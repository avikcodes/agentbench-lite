from __future__ import annotations

from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import FailureAnalysis, FailureDetail, FailureType
from app.schemas.execution import AgentExecutionResult


async def analyze_failures(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
) -> FailureAnalysis:
    failures: list[FailureDetail] = []

    for step in execution.execution_trace:
        if step.status == "error":
            if step.selected_tool:
                failures.append(
                    FailureDetail(
                        failure_type=FailureType.TOOL_EXECUTION_ERROR,
                        description=step.error_message or "Tool execution failed",
                        step_number=step.step_number,
                        details={
                            "tool_name": step.selected_tool,
                            "tool_input": step.tool_input,
                            "error": step.error_message,
                        },
                    )
                )
            else:
                failures.append(
                    FailureDetail(
                        failure_type=FailureType.EXECUTION_CRASH,
                        description=step.error_message or "Step execution failed",
                        step_number=step.step_number,
                        details={"error": step.error_message},
                    )
                )

    if not execution.success_status and execution.final_answer:
        if not any(
            f.failure_type in (FailureType.TOOL_EXECUTION_ERROR, FailureType.EXECUTION_CRASH)
            for f in failures
        ):
            final_answer_norm = execution.final_answer.lower().strip()
            expected_norm = task.expected_answer.lower().strip()

            if final_answer_norm != expected_norm:
                failures.append(
                    FailureDetail(
                        failure_type=FailureType.INCORRECT_FINAL_ANSWER,
                        description="Final answer does not match expected answer",
                        details={
                            "final_answer": execution.final_answer,
                            "expected_answer": task.expected_answer,
                        },
                    )
                )

    if execution.execution_trace:
        tool_steps = [s for s in execution.execution_trace if s.selected_tool]
        allowed_tools = set(t.lower() for t in task.allowed_tools) if task.allowed_tools else set()
        if allowed_tools:
            for step in tool_steps:
                if step.selected_tool and step.selected_tool.lower() not in allowed_tools:
                    failures.append(
                        FailureDetail(
                            failure_type=FailureType.INVALID_TOOL_USAGE,
                            description=f"Used disallowed tool '{step.selected_tool}'",
                            step_number=step.step_number,
                            details={
                                "tool_used": step.selected_tool,
                                "allowed_tools": list(allowed_tools),
                            },
                        )
                    )

    has_timeout = (
        execution.error_message is not None
        and "timeout" in execution.error_message.lower()
    )
    if has_timeout:
        failures.append(
            FailureDetail(
                failure_type=FailureType.TIMEOUT,
                description="Execution timed out",
                details={"error_message": execution.error_message},
            )
        )

    hallucination_detected = (
        execution.error_message is not None
        and "hallucinat" in execution.error_message.lower()
    )
    if hallucination_detected:
        failures.append(
            FailureDetail(
                failure_type=FailureType.HALLUCINATION,
                description="Hallucination detected in execution",
                details={"error_message": execution.error_message},
            )
        )

    if not failures and not execution.success_status:
        if execution.execution_trace:
            last_step = execution.execution_trace[-1]
            if last_step.status == "success" and last_step.selected_tool is None:
                failures.append(
                    FailureDetail(
                        failure_type=FailureType.REASONING_FAILURE,
                        description="Execution completed but did not produce correct reasoning",
                        step_number=last_step.step_number,
                        details={
                            "reasoning": last_step.reasoning_step,
                            "final_answer": execution.final_answer,
                        },
                    )
                )

    failure_count = len(failures)
    primary = failures[0].failure_type if failures else FailureType.NONE

    return FailureAnalysis(
        has_failures=failure_count > 0,
        failures=failures,
        primary_failure=primary,
        failure_count=failure_count,
    )


async def aggregate_failure_analysis(
    task_results: list[tuple[AgentExecutionResult, BenchmarkTask]],
) -> FailureAnalysis:
    all_failures: list[FailureDetail] = []
    failure_type_counts: dict[FailureType, int] = {}

    for execution, task in task_results:
        analysis = await analyze_failures(execution, task)
        all_failures.extend(analysis.failures)
        for failure in analysis.failures:
            failure_type_counts[failure.failure_type] = (
                failure_type_counts.get(failure.failure_type, 0) + 1
            )

    if failure_type_counts:
        primary = max(failure_type_counts, key=failure_type_counts.get)
    else:
        primary = FailureType.NONE

    return FailureAnalysis(
        has_failures=len(all_failures) > 0,
        failures=all_failures,
        primary_failure=primary,
        failure_count=len(all_failures),
    )
