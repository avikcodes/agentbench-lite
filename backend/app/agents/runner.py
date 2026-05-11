from __future__ import annotations

import json
from datetime import UTC, datetime
from time import perf_counter
from uuid import uuid4

from pydantic import ValidationError

from app.agents.prompts import build_agent_prompt
from app.schemas.execution import (
    AgentDecision,
    AgentExecutionResult,
    AgentModelConfig,
    AgentTaskPayload,
    ExecutionTraceStep,
)
from app.schemas.llm import ModelInferenceRequest
from app.services.model_service import model_service
from app.services.tool_service import (
    ToolExecutionError,
    ToolNotFoundError,
    ToolValidationError,
    tool_service,
)


class AgentRunnerError(Exception):
    """Base exception for agent runner failures."""


class AgentRunner:
    async def run_task(
        self,
        task: AgentTaskPayload,
        model_config: AgentModelConfig,
    ) -> AgentExecutionResult:
        execution_id = str(uuid4())
        trace: list[ExecutionTraceStep] = []
        tools_used: list[str] = []
        total_start = perf_counter()
        final_answer = ""
        success_status = False
        error_message: str | None = None

        for step_number in range(1, model_config.max_steps + 1):
            started_at = datetime.now(UTC)
            step_start = perf_counter()
            status = "success"
            decision: AgentDecision | None = None
            selected_tool: str | None = None
            tool_input: dict = {}
            tool_output: dict = {}
            step_error: str | None = None

            try:
                decision = await self._get_agent_decision(
                    task=task,
                    trace=trace,
                    model_config=model_config,
                )
                selected_tool = decision.tool_name
                tool_input = decision.tool_input

                if decision.action == "final":
                    final_answer = decision.final_answer or ""
                    success_status = True
                    completed_at = datetime.now(UTC)
                    trace.append(
                        ExecutionTraceStep(
                            step_number=step_number,
                            reasoning_step=decision.reasoning,
                            selected_tool=None,
                            tool_input={},
                            tool_output={"final_answer": final_answer},
                            started_at=started_at,
                            completed_at=completed_at,
                            latency=round(perf_counter() - step_start, 6),
                            status="success",
                        )
                    )
                    break

                self._validate_tool_selection(task.allowed_tools, decision.tool_name)
                tool_result = await tool_service.execute_tool(
                    decision.tool_name or "",
                    decision.tool_input,
                )
                tool_output = tool_result.output
                if decision.tool_name and decision.tool_name not in tools_used:
                    tools_used.append(decision.tool_name)
            except (
                ToolNotFoundError,
                ToolExecutionError,
                ToolValidationError,
                ValueError,
                AgentRunnerError,
            ) as exc:
                status = "error"
                step_error = str(exc)
            except Exception as exc:
                status = "error"
                step_error = f"Unexpected execution error: {exc}"

            completed_at = datetime.now(UTC)
            trace.append(
                ExecutionTraceStep(
                    step_number=step_number,
                    reasoning_step=(
                        decision.reasoning
                        if decision is not None
                        else "Execution failed before decision parsing."
                    ),
                    selected_tool=selected_tool,
                    tool_input=tool_input,
                    tool_output=tool_output,
                    started_at=started_at,
                    completed_at=completed_at,
                    latency=round(perf_counter() - step_start, 6),
                    status=status,
                    error_message=step_error,
                )
            )

            if status == "error":
                final_answer = "Task execution failed before reaching a final answer."
                error_message = step_error
                break

        if not success_status and not final_answer:
            final_answer = "Task execution ended without a final answer."
            if error_message is None:
                error_message = "Maximum execution steps reached."

        return AgentExecutionResult(
            execution_id=execution_id,
            task_id=task.task_id,
            model_used=f"{model_config.provider}/{model_config.model_name}",
            final_answer=final_answer,
            success_status=success_status,
            execution_trace=trace,
            total_latency=round(perf_counter() - total_start, 6),
            tools_used=tools_used,
            error_message=error_message,
        )

    async def _get_agent_decision(
        self,
        task: AgentTaskPayload,
        trace: list[ExecutionTraceStep],
        model_config: AgentModelConfig,
    ) -> AgentDecision:
        last_error: Exception | None = None

        for _attempt in range(model_config.retry_limit + 1):
            prompt = build_agent_prompt(task, trace)
            response = await model_service.infer(
                ModelInferenceRequest(
                    provider=model_config.provider,
                    model_name=model_config.model_name,
                    prompt=prompt,
                    temperature=model_config.temperature,
                    max_tokens=model_config.max_tokens,
                )
            )
            try:
                return self._parse_decision(response.response)
            except (json.JSONDecodeError, ValidationError, ValueError) as exc:
                last_error = exc

        raise AgentRunnerError(
            f"Unable to parse model decision after retries: {last_error}"
        )

    def _parse_decision(self, raw_response: str) -> AgentDecision:
        cleaned = raw_response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.splitlines()
            cleaned = "\n".join(
                line for line in lines if not line.strip().startswith("```")
            ).strip()

        payload = json.loads(cleaned)
        return AgentDecision.model_validate(payload)

    def _validate_tool_selection(
        self,
        allowed_tools: list[str],
        tool_name: str | None,
    ) -> None:
        if not tool_name:
            raise AgentRunnerError("Model selected a tool action without a tool name.")
        if allowed_tools and tool_name not in allowed_tools:
            raise AgentRunnerError(
                f"Tool '{tool_name}' is not allowed for this task."
            )
