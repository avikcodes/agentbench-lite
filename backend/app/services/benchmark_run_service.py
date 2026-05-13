from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from time import perf_counter
from uuid import uuid4

from app.schemas.benchmark import BenchmarkTask
from app.schemas.execution import (
    AgentExecutionResult,
    BenchmarkRunRequest,
    BenchmarkRunState,
    BenchmarkRunSummary,
    BenchmarkRunTaskState,
    BenchmarkTaskExecutionRequest,
)
from app.services.dataset_service import dataset_service
from app.services.evaluation_service import evaluation_service
from app.services.execution_store_service import execution_store_service
from app.services.task_runner_service import task_runner_service


class BenchmarkRunNotFoundError(Exception):
    """Raised when a benchmark run cannot be found."""


class BenchmarkRunStoreService:
    def __init__(self) -> None:
        self._runs: dict[str, BenchmarkRunState] = {}
        self._lock = asyncio.Lock()

    async def save_run(self, run: BenchmarkRunState) -> BenchmarkRunState:
        async with self._lock:
            self._runs[run.run_id] = run
        return run

    async def get_run(self, run_id: str) -> BenchmarkRunState:
        async with self._lock:
            run = self._runs.get(run_id)
        if run is None:
            raise BenchmarkRunNotFoundError(f"Benchmark run '{run_id}' was not found.")
        return run


benchmark_run_store_service = BenchmarkRunStoreService()


class BenchmarkRunService:
    def __init__(self) -> None:
        self.store = benchmark_run_store_service

    async def create_run(self, request: BenchmarkRunRequest) -> BenchmarkRunState:
        dataset = await dataset_service.get_dataset(request.dataset_id)
        task_states = [
            BenchmarkRunTaskState(
                task_id=task.task_id,
                category=task.category,
                difficulty=task.difficulty,
            )
            for task in dataset.tasks
        ]

        run = BenchmarkRunState(
            run_id=f"run_{uuid4().hex[:12]}",
            dataset_id=dataset.dataset_id,
            dataset_name=dataset.name,
            model_name=f"{request.model.provider}/{request.model.model_name}",
            run_config=request.model,
            created_at=datetime.now(UTC),
            task_states=task_states,
            summary=self._build_summary(task_states),
        )
        await self.store.save_run(run)
        asyncio.create_task(self._execute_run(run.run_id, request, dataset.tasks))
        return run

    async def get_run(self, run_id: str) -> BenchmarkRunState:
        run = await self.store.get_run(run_id)
        run.summary = self._build_summary(run.task_states)
        return run

    async def retry_failed_tasks(self, run_id: str) -> BenchmarkRunState:
        run = await self.store.get_run(run_id)
        if run.status in {"running", "evaluating"}:
            raise ValueError("The benchmark run is already in progress.")

        dataset = await dataset_service.get_dataset(run.dataset_id)
        failed_ids = {
            task.task_id for task in run.task_states if task.status == "failed"
        }
        if not failed_ids:
            return run

        previous_execution_ids = {
            task.execution_id
            for task in run.task_states
            if task.task_id in failed_ids and task.execution_id
        }

        run.status = "queued"
        run.failure_message = None
        run.completed_at = None
        run.started_at = None
        run.current_task_id = None
        run.benchmark_id = None
        run.benchmark_result = None
        run.execution_ids = [
            execution_id
            for execution_id in run.execution_ids
            if execution_id not in previous_execution_ids
        ]

        for task_state in run.task_states:
            if task_state.task_id in failed_ids:
                task_state.status = "queued"
                task_state.execution_id = None
                task_state.replay_url = None
                task_state.latency = None
                task_state.passed = None
                task_state.score = None
                task_state.error_message = None
                task_state.started_at = None
                task_state.completed_at = None
                task_state.evaluated_at = None

        task_map = {task.task_id: task for task in dataset.tasks}
        retry_tasks = [task_map[task_id] for task_id in failed_ids if task_id in task_map]
        request = BenchmarkRunRequest(dataset_id=run.dataset_id, model=run.run_config)
        run.summary = self._build_summary(run.task_states)
        await self.store.save_run(run)
        asyncio.create_task(self._execute_run(run.run_id, request, retry_tasks, append=True))
        return run

    async def _execute_run(
        self,
        run_id: str,
        request: BenchmarkRunRequest,
        tasks: list[BenchmarkTask],
        *,
        append: bool = False,
    ) -> None:
        run = await self.store.get_run(run_id)
        run.status = "running"
        run.started_at = datetime.now(UTC)
        run.completed_at = None
        run.failure_message = None
        await self.store.save_run(run)

        execution_ids = list(run.execution_ids) if append else []
        for task in tasks:
            run.current_task_id = task.task_id
            task_state = self._find_task_state(run, task.task_id)
            task_state.status = "running"
            task_state.started_at = datetime.now(UTC)
            task_state.error_message = None
            await self.store.save_run(run)

            execution = await self._execute_task(task, request)
            task_state.execution_id = execution.execution_id
            task_state.replay_url = f"/replay/{execution.execution_id}"
            task_state.latency = execution.total_latency
            task_state.completed_at = datetime.now(UTC)
            execution_ids = [
                existing_id for existing_id in execution_ids if existing_id != execution.execution_id
            ]
            execution_ids.append(execution.execution_id)
            run.execution_ids = execution_ids

            task_state.status = "evaluating"
            await self.store.save_run(run)

            evaluation = await evaluation_service.evaluate_single(
                execution_id=execution.execution_id,
                task_id=task.task_id,
                dataset_id=run.dataset_id,
            )
            task_state.score = evaluation.score
            task_state.passed = evaluation.passed
            task_state.evaluated_at = evaluation.evaluated_at
            task_state.error_message = execution.error_message
            task_state.status = "completed" if evaluation.passed else "failed"
            await self.store.save_run(run)

        run.current_task_id = None
        run.status = "evaluating"
        await self.store.save_run(run)

        try:
            result = await evaluation_service.evaluate_benchmark_run(
                execution_ids=run.execution_ids,
                model_name=run.model_name,
                dataset_id=run.dataset_id,
            )
            run.benchmark_id = result.benchmark_id
            run.benchmark_result = result.model_dump(mode="json")
            run.status = "completed"
        except Exception as exc:
            run.failure_message = str(exc)
            run.status = "failed"
        finally:
            run.completed_at = datetime.now(UTC)
            run.summary = self._build_summary(run.task_states)
            await self.store.save_run(run)

    async def _execute_task(
        self,
        task: BenchmarkTask,
        request: BenchmarkRunRequest,
    ) -> AgentExecutionResult:
        started_at = perf_counter()

        try:
            return await task_runner_service.run_benchmark_task(
                request.dataset_id,
                task.task_id,
                BenchmarkTaskExecutionRequest(model=request.model),
            )
        except Exception as exc:
            execution = AgentExecutionResult(
                execution_id=str(uuid4()),
                task_id=task.task_id,
                model_used=f"{request.model.provider}/{request.model.model_name}",
                final_answer="Task execution failed before a final answer was produced.",
                success_status=False,
                execution_trace=[],
                total_latency=round(perf_counter() - started_at, 6),
                tools_used=[],
                error_message=str(exc),
            )
            return await execution_store_service.save_result(execution)

    def _build_summary(
        self,
        task_states: list[BenchmarkRunTaskState],
    ) -> BenchmarkRunSummary:
        counts = {
            "queued": 0,
            "running": 0,
            "evaluating": 0,
            "completed": 0,
            "failed": 0,
        }
        for task in task_states:
            counts[task.status] += 1

        total = len(task_states)
        done = counts["completed"] + counts["failed"]
        completion_rate = round(done / total, 4) if total else 0.0

        return BenchmarkRunSummary(
            total_tasks=total,
            queued_tasks=counts["queued"],
            running_tasks=counts["running"],
            evaluating_tasks=counts["evaluating"],
            completed_tasks=counts["completed"],
            failed_tasks=counts["failed"],
            completion_rate=completion_rate,
        )

    def _find_task_state(
        self,
        run: BenchmarkRunState,
        task_id: str,
    ) -> BenchmarkRunTaskState:
        for task_state in run.task_states:
            if task_state.task_id == task_id:
                return task_state
        raise BenchmarkRunNotFoundError(
            f"Task '{task_id}' was not found in benchmark run '{run.run_id}'."
        )


benchmark_run_service = BenchmarkRunService()
