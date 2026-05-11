from __future__ import annotations

from app.schemas.execution import AgentExecutionResult, ExecutionTraceResponse


class ExecutionStoreError(Exception):
    """Base exception for execution storage failures."""


class ExecutionNotFoundError(ExecutionStoreError):
    """Raised when an execution result cannot be found."""


class ExecutionStoreService:
    def __init__(self) -> None:
        self._results: dict[str, AgentExecutionResult] = {}

    async def save_result(self, result: AgentExecutionResult) -> AgentExecutionResult:
        self._results[result.execution_id] = result
        return result

    async def get_result(self, execution_id: str) -> AgentExecutionResult:
        result = self._results.get(execution_id)
        if result is None:
            raise ExecutionNotFoundError(
                f"Execution '{execution_id}' was not found."
            )
        return result

    async def get_trace(self, execution_id: str) -> ExecutionTraceResponse:
        result = await self.get_result(execution_id)
        return ExecutionTraceResponse(
            execution_id=result.execution_id,
            task_id=result.task_id,
            execution_trace=result.execution_trace,
        )


execution_store_service = ExecutionStoreService()
