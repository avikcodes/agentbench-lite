from __future__ import annotations

from uuid import uuid4

from app.schemas.execution import (
    AgentExecutionResult,
    AgentTaskPayload,
    BenchmarkTaskExecutionRequest,
    CustomTaskExecutionRequest,
)
from app.services.dataset_service import dataset_service
from app.services.execution_service import execution_service


class TaskRunnerService:
    async def run_benchmark_task(
        self,
        dataset_id: str,
        task_id: str,
        request: BenchmarkTaskExecutionRequest,
    ) -> AgentExecutionResult:
        benchmark_task = await dataset_service.get_task(dataset_id, task_id)
        task_payload = AgentTaskPayload(
            task_id=benchmark_task.task_id,
            question=benchmark_task.question,
            allowed_tools=benchmark_task.allowed_tools,
        )
        return await execution_service.execute_task(task_payload, request.model)

    async def run_custom_task(
        self,
        request: CustomTaskExecutionRequest,
    ) -> AgentExecutionResult:
        task_payload = AgentTaskPayload(
            task_id=f"custom-{uuid4()}",
            question=request.question,
            allowed_tools=request.allowed_tools,
        )
        return await execution_service.execute_task(task_payload, request.model)


task_runner_service = TaskRunnerService()
