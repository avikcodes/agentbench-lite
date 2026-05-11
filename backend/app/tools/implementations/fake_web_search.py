from __future__ import annotations

from pydantic import BaseModel

from app.schemas.tool import (
    FakeWebSearchInput,
    FakeWebSearchOutput,
    FakeWebSearchResult,
)
from app.tools.base import BaseTool


class FakeWebSearchTool(BaseTool):
    name = "fake_web_search"
    description = "Returns predefined mock search results for demo queries."
    input_model = FakeWebSearchInput
    output_model = FakeWebSearchOutput

    _SEARCH_INDEX: dict[str, list[FakeWebSearchResult]] = {
        "agentbench lite": [
            FakeWebSearchResult(
                title="AgentBench Lite Overview",
                url="https://example.com/agentbench-lite",
                snippet="A lightweight benchmark project for testing agent capabilities.",
            ),
            FakeWebSearchResult(
                title="Building Tool Systems in FastAPI",
                url="https://example.com/fastapi-tools",
                snippet="Patterns for registries, validation, and async tool execution.",
            ),
        ],
        "fastapi tools": [
            FakeWebSearchResult(
                title="FastAPI Tool Registry Pattern",
                url="https://example.com/tool-registry",
                snippet="Use a central registry and typed schemas for scalable tools.",
            ),
            FakeWebSearchResult(
                title="Async Services with Pydantic",
                url="https://example.com/async-pydantic",
                snippet="Model validation and async execution can work cleanly together.",
            ),
        ],
        "unit conversion": [
            FakeWebSearchResult(
                title="Metric and Imperial Conversion Guide",
                url="https://example.com/conversion-guide",
                snippet="Basic conversions for length and weight values.",
            ),
        ],
    }

    async def execute(self, payload: BaseModel) -> FakeWebSearchOutput:
        tool_input = FakeWebSearchInput.model_validate(payload)
        normalized_query = tool_input.query.strip().lower()
        results = self._SEARCH_INDEX.get(
            normalized_query,
            [
                FakeWebSearchResult(
                    title="No Exact Match Found",
                    url="https://example.com/search-help",
                    snippet="This is a mock search tool with static predefined responses.",
                )
            ],
        )

        return FakeWebSearchOutput(
            query=tool_input.query,
            results=results,
            total_results=len(results),
        )
