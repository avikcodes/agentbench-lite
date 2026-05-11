from __future__ import annotations

from app.schemas.evaluation import ExecutionStatistics
from app.schemas.execution import AgentExecutionResult


async def compute_execution_statistics(
    executions: list[AgentExecutionResult],
) -> ExecutionStatistics:
    total = len(executions)
    completed = sum(1 for e in executions if e.success_status)
    failed = total - completed

    total_latency = sum(e.total_latency for e in executions)
    avg_latency = total_latency / total if total > 0 else 0.0

    total_steps = sum(len(e.execution_trace) for e in executions)
    avg_steps = total_steps / total if total > 0 else 0.0

    total_tool_calls = sum(len(e.tools_used) for e in executions)
    avg_tool_calls = total_tool_calls / total if total > 0 else 0.0

    total_retries = sum(
        sum(1 for step in e.execution_trace if step.status == "error")
        for e in executions
    )
    avg_retries = total_retries / total if total > 0 else 0.0

    hallucination_count = sum(
        1 for e in executions
        if e.error_message and "hallucinat" in e.error_message.lower()
    )

    timeout_count = sum(
        1 for e in executions
        if e.error_message and "timeout" in e.error_message.lower()
    )

    crash_count = sum(
        1 for e in executions
        if not e.success_status
        and e.error_message
        and "error" in e.error_message.lower()
    )

    return ExecutionStatistics(
        total_tasks=total,
        completed_tasks=completed,
        failed_tasks=failed,
        average_latency=round(avg_latency, 4),
        total_latency=round(total_latency, 4),
        average_steps=round(avg_steps, 2),
        total_steps=total_steps,
        total_tool_calls=total_tool_calls,
        average_tool_calls=round(avg_tool_calls, 2),
        total_retries=total_retries,
        average_retries=round(avg_retries, 2),
        hallucination_count=hallucination_count,
        timeout_count=timeout_count,
        crash_count=crash_count,
    )
