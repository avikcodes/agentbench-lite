from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


ToolExecutionStatus = Literal["success", "error"]


class ToolMetadata(BaseModel):
    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)
    input_schema: dict[str, Any] = Field(default_factory=dict)
    output_schema: dict[str, Any] = Field(default_factory=dict)


class ToolExecutionRequest(BaseModel):
    tool_name: str = Field(..., min_length=1)
    input: dict[str, Any] = Field(default_factory=dict)


class ToolExecutionResponse(BaseModel):
    tool_name: str = Field(..., min_length=1)
    status: ToolExecutionStatus
    input: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any] = Field(default_factory=dict)
    execution_time: float = Field(..., ge=0)


class CalculatorInput(BaseModel):
    expression: str = Field(..., min_length=1, description="Arithmetic expression to evaluate.")


class CalculatorOutput(BaseModel):
    result: float
    expression: str


class UnitConverterInput(BaseModel):
    value: float
    from_unit: str = Field(..., min_length=1)
    to_unit: str = Field(..., min_length=1)


class UnitConverterOutput(BaseModel):
    original_value: float
    original_unit: str
    converted_value: float
    converted_unit: str
    category: Literal["length", "weight"]


class FakeWebSearchInput(BaseModel):
    query: str = Field(..., min_length=1)


class FakeWebSearchResult(BaseModel):
    title: str
    url: str
    snippet: str


class FakeWebSearchOutput(BaseModel):
    query: str
    results: list[FakeWebSearchResult] = Field(default_factory=list)
    total_results: int = Field(..., ge=0)
