from __future__ import annotations

from uuid import uuid4

from app.evaluators.configs.weights import resolve_weights
from app.evaluators.registry import evaluator_registry
from app.evaluators.reports.generator import (
    generate_benchmark_report,
    generate_comparison_report,
    generate_task_evaluation,
)
from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import (
    BenchmarkEvaluationResult,
    EvaluationComparisonResult,
    EvaluationWeightConfig,
    MetricBreakdown,
    TaskEvaluationResult,
)
from app.schemas.execution import AgentExecutionResult
from app.services.dataset_service import dataset_service
from app.services.evaluation_store_service import evaluation_store_service
from app.services.execution_store_service import execution_store_service


class EvaluationServiceError(Exception):
    """Base exception for evaluation service failures."""


class ExecutionNotFoundError(EvaluationServiceError):
    """Raised when an execution referenced for evaluation is not found."""


class TaskNotFoundError(EvaluationServiceError):
    """Raised when a task referenced for evaluation is not found."""


class EvaluationService:
    async def evaluate_single(
        self,
        execution_id: str,
        task_id: str,
        dataset_id: str | None = None,
        weight_config: EvaluationWeightConfig | None = None,
    ) -> TaskEvaluationResult:
        try:
            execution = await execution_store_service.get_result(execution_id)
        except Exception as exc:
            raise ExecutionNotFoundError(
                f"Execution '{execution_id}' was not found."
            ) from exc

        task: BenchmarkTask | None = None
        if dataset_id:
            try:
                task = await dataset_service.get_task(dataset_id, task_id)
            except Exception as exc:
                raise TaskNotFoundError(
                    f"Task '{task_id}' was not found in dataset '{dataset_id}'."
                ) from exc
        else:
            task = BenchmarkTask(
                task_id=task_id,
                category="unknown",
                question=execution.task_id,
                expected_answer="",
                allowed_tools=[],
                difficulty="medium",
            )

        weights = None
        if weight_config:
            weights = resolve_weights(
                custom_weights=weight_config.metric_weights,
                profile_name=weight_config.profile_name,
            )

        return await generate_task_evaluation(execution, task, weights)

    async def evaluate_benchmark_run(
        self,
        execution_ids: list[str],
        model_name: str,
        dataset_id: str | None = None,
        weight_config: EvaluationWeightConfig | None = None,
    ) -> BenchmarkEvaluationResult:
        executions: list[AgentExecutionResult] = []
        for exec_id in execution_ids:
            try:
                execution = await execution_store_service.get_result(exec_id)
                executions.append(execution)
            except Exception as exc:
                raise ExecutionNotFoundError(
                    f"Execution '{exec_id}' was not found."
                ) from exc

        tasks: list[BenchmarkTask] = []
        if dataset_id:
            try:
                tasks = await dataset_service.get_dataset_tasks(dataset_id)
            except Exception as exc:
                raise TaskNotFoundError(
                    f"Dataset '{dataset_id}' was not found."
                ) from exc
        else:
            task_map: dict[str, BenchmarkTask] = {}
            for execution in executions:
                if execution.task_id not in task_map:
                    task_map[execution.task_id] = BenchmarkTask(
                        task_id=execution.task_id,
                        category="unknown",
                        question="",
                        expected_answer="",
                        allowed_tools=[],
                        difficulty="medium",
                    )
            tasks = list(task_map.values())

        weights = None
        if weight_config:
            weights = resolve_weights(
                custom_weights=weight_config.metric_weights,
                profile_name=weight_config.profile_name,
            )

        benchmark_id = f"bench_{uuid4().hex[:12]}"

        result = await generate_benchmark_report(
            benchmark_id=benchmark_id,
            model_name=model_name,
            executions=executions,
            tasks=tasks,
            dataset_id=dataset_id,
            weights=weights,
        )

        await evaluation_store_service.save_result(result)
        return result

    async def get_benchmark_result(
        self, benchmark_id: str
    ) -> BenchmarkEvaluationResult:
        try:
            return await evaluation_store_service.get_result(benchmark_id)
        except Exception as exc:
            raise EvaluationServiceError(
                f"Benchmark result '{benchmark_id}' was not found."
            ) from exc

    async def compare_benchmarks(
        self,
        benchmark_ids: list[str],
    ) -> EvaluationComparisonResult:
        results: list[BenchmarkEvaluationResult] = []
        for bid in benchmark_ids:
            result = await self.get_benchmark_result(bid)
            results.append(result)

        comparison_id = f"compare_{uuid4().hex[:12]}"
        return await generate_comparison_report(comparison_id, results)

    async def list_evaluators(self) -> list[dict[str, str]]:
        return evaluator_registry.list()

    async def list_evaluation_results(
        self,
    ) -> list[BenchmarkEvaluationResult]:
        return await evaluation_store_service.list_results()


evaluation_service = EvaluationService()
