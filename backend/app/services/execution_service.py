from __future__ import annotations

from app.agents.runner import AgentRunner
from app.schemas.execution import AgentExecutionResult, AgentModelConfig, AgentTaskPayload
from app.services.execution_store_service import execution_store_service


class ExecutionService:
    def __init__(self) -> None:
        self.runner = AgentRunner()
        self.store = execution_store_service

    async def execute_task(
        self,
        task: AgentTaskPayload,
        model_config: AgentModelConfig,
    ) -> AgentExecutionResult:
        result = await self.runner.run_task(task=task, model_config=model_config)
        return await self.store.save_result(result)


execution_service = ExecutionService()
