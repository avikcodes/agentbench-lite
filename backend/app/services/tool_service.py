from __future__ import annotations

from time import perf_counter

from pydantic import ValidationError

from app.schemas.tool import ToolExecutionResponse, ToolMetadata
from app.tools import tool_registry
from app.tools.base import BaseTool


class ToolServiceError(Exception):
    """Base exception for tool service failures."""


class ToolNotFoundError(ToolServiceError):
    """Raised when a tool cannot be found in the registry."""


class ToolValidationError(ToolServiceError):
    """Raised when a tool input payload fails validation."""


class ToolExecutionError(ToolServiceError):
    """Raised when a tool fails during execution."""


class ToolService:
    def __init__(self) -> None:
        self.registry = tool_registry

    async def list_tools(self) -> list[ToolMetadata]:
        return [tool.get_metadata() for tool in self.registry.list()]

    async def get_tool(self, tool_name: str) -> ToolMetadata:
        tool = self._get_tool_or_raise(tool_name)
        return tool.get_metadata()

    async def execute_tool(
        self,
        tool_name: str,
        payload: dict,
    ) -> ToolExecutionResponse:
        tool = self._get_tool_or_raise(tool_name)
        start_time = perf_counter()

        try:
            validated_input = tool.validate_input(payload)
        except ValidationError as exc:
            raise ToolValidationError(exc.errors(include_url=False)) from exc

        try:
            result = await tool.execute(validated_input)
        except Exception as exc:
            raise ToolExecutionError(str(exc)) from exc

        execution_time = round(perf_counter() - start_time, 6)
        return ToolExecutionResponse(
            tool_name=tool.name,
            status="success",
            input=validated_input.model_dump(),
            output=result.model_dump(),
            execution_time=execution_time,
        )

    def _get_tool_or_raise(self, tool_name: str) -> BaseTool:
        tool = self.registry.get(tool_name)
        if tool is None:
            raise ToolNotFoundError(f"Tool '{tool_name}' was not found.")
        return tool


tool_service = ToolService()
