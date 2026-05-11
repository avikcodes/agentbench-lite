from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.llm import ModelProviderName


AgentActionType = Literal["tool", "final"]


class AgentModelConfig(BaseModel):
    provider: ModelProviderName
    model_name: str = Field(..., min_length=1)
    temperature: float = Field(default=0.2, ge=0, le=2)
    max_tokens: int = Field(default=512, ge=1, le=4096)
    max_steps: int = Field(default=5, ge=1, le=10)
    retry_limit: int = Field(default=2, ge=0, le=5)


class AgentTaskPayload(BaseModel):
    task_id: str = Field(..., min_length=1)
    question: str = Field(..., min_length=1)
    allowed_tools: list[str] = Field(default_factory=list)


class CustomTaskExecutionRequest(BaseModel):
    question: str = Field(..., min_length=1)
    allowed_tools: list[str] = Field(default_factory=list)
    model: AgentModelConfig


class BenchmarkTaskExecutionRequest(BaseModel):
    model: AgentModelConfig


class AgentDecision(BaseModel):
    reasoning: str = Field(..., min_length=1)
    action: AgentActionType
    tool_name: str | None = None
    tool_input: dict[str, Any] = Field(default_factory=dict)
    final_answer: str | None = None

    @model_validator(mode="after")
    def validate_action_payload(self) -> "AgentDecision":
        if self.action == "tool" and not self.tool_name:
            raise ValueError("tool_name is required when action is 'tool'.")
        if self.action == "final" and not self.final_answer:
            raise ValueError("final_answer is required when action is 'final'.")
        return self


class ExecutionTraceStep(BaseModel):
    step_number: int = Field(..., ge=1)
    reasoning_step: str = Field(..., min_length=1)
    selected_tool: str | None = None
    tool_input: dict[str, Any] = Field(default_factory=dict)
    tool_output: dict[str, Any] = Field(default_factory=dict)
    started_at: datetime
    completed_at: datetime
    latency: float = Field(..., ge=0)
    status: Literal["success", "error"]
    error_message: str | None = None


class AgentExecutionResult(BaseModel):
    execution_id: str = Field(..., min_length=1)
    task_id: str = Field(..., min_length=1)
    model_used: str = Field(..., min_length=1)
    final_answer: str = Field(..., min_length=1)
    success_status: bool
    execution_trace: list[ExecutionTraceStep] = Field(default_factory=list)
    total_latency: float = Field(..., ge=0)
    tools_used: list[str] = Field(default_factory=list)
    error_message: str | None = None


class ExecutionTraceResponse(BaseModel):
    execution_id: str = Field(..., min_length=1)
    task_id: str = Field(..., min_length=1)
    execution_trace: list[ExecutionTraceStep] = Field(default_factory=list)
