from __future__ import annotations

import re
from typing import Any

from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import EvaluationMetric, MetricName
from app.schemas.execution import AgentExecutionResult, ExecutionTraceStep


def _normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


async def compute_task_success(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
) -> EvaluationMetric:
    return EvaluationMetric(
        metric_name=MetricName.TASK_SUCCESS,
        value=1.0 if execution.success_status else 0.0,
        weight=weight,
        details={"success_status": execution.success_status},
    )


async def compute_exact_match_score(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
) -> EvaluationMetric:
    final = execution.final_answer.strip()
    expected = task.expected_answer.strip()

    if final == expected:
        score = 1.0
        match_type = "exact"
    elif _normalize_text(final) == _normalize_text(expected):
        score = 0.8
        match_type = "normalized"
    elif expected.lower() in final.lower():
        score = 0.5
        match_type = "partial"
    else:
        score = 0.0
        match_type = "none"

    return EvaluationMetric(
        metric_name=MetricName.EXACT_MATCH_SCORE,
        value=score,
        weight=weight,
        details={
            "match_type": match_type,
            "final_answer": execution.final_answer,
            "expected_answer": task.expected_answer,
        },
    )


async def compute_tool_usage_efficiency(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
) -> EvaluationMetric:
    trace = execution.execution_trace
    tool_steps = [s for s in trace if s.selected_tool is not None]

    if not tool_steps:
        return EvaluationMetric(
            metric_name=MetricName.TOOL_USAGE_EFFICIENCY,
            value=1.0,
            weight=weight,
            details={"total_tool_calls": 0, "successful_calls": 0, "note": "no_tool_calls"},
        )

    successful = sum(1 for s in tool_steps if s.status == "success")
    total = len(tool_steps)
    score = successful / total if total > 0 else 1.0

    return EvaluationMetric(
        metric_name=MetricName.TOOL_USAGE_EFFICIENCY,
        value=score,
        weight=weight,
        details={
            "total_tool_calls": total,
            "successful_calls": successful,
            "failed_calls": total - successful,
        },
    )


async def compute_reasoning_step_count(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
) -> EvaluationMetric:
    step_count = len(execution.execution_trace)

    if step_count == 0:
        score = 0.0
    elif step_count <= 1:
        score = 0.3
    elif step_count <= 3:
        score = 0.7
    elif step_count <= 7:
        score = 1.0
    elif step_count <= 10:
        score = 0.8
    elif step_count <= 15:
        score = 0.5
    else:
        score = max(0.0, 1.0 - (step_count - 15) / 20)

    return EvaluationMetric(
        metric_name=MetricName.REASONING_STEP_COUNT,
        value=score,
        weight=weight,
        details={"step_count": step_count, "ideal_range": "3-7"},
    )


async def compute_latency_score(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
    threshold: float = 60.0,
) -> EvaluationMetric:
    latency = execution.total_latency

    if latency <= 0:
        score = 0.0
    elif latency < 5:
        score = 1.0
    elif latency >= threshold:
        score = 0.0
    else:
        score = 1.0 - (latency - 5) / (threshold - 5)

    return EvaluationMetric(
        metric_name=MetricName.LATENCY_SCORE,
        value=round(score, 4),
        weight=weight,
        details={
            "total_latency_seconds": latency,
            "threshold_seconds": threshold,
        },
    )


async def compute_tool_call_accuracy(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
) -> EvaluationMetric:
    trace = execution.execution_trace
    allowed = set(tool.lower() for tool in task.allowed_tools) if task.allowed_tools else set()
    tool_steps = [s for s in trace if s.selected_tool is not None]

    if not tool_steps:
        return EvaluationMetric(
            metric_name=MetricName.TOOL_CALL_ACCURACY,
            value=1.0,
            weight=weight,
            details={"total_calls": 0, "allowed_calls": 0, "disallowed_calls": 0},
        )

    if not allowed:
        return EvaluationMetric(
            metric_name=MetricName.TOOL_CALL_ACCURACY,
            value=1.0,
            weight=weight,
            details={"total_calls": len(tool_steps), "note": "no_allowed_tools_defined"},
        )

    correct = sum(
        1 for s in tool_steps
        if s.selected_tool and s.selected_tool.lower() in allowed
    )
    total = len(tool_steps)
    score = correct / total if total > 0 else 1.0

    return EvaluationMetric(
        metric_name=MetricName.TOOL_CALL_ACCURACY,
        value=score,
        weight=weight,
        details={
            "total_calls": total,
            "allowed_calls": correct,
            "disallowed_calls": total - correct,
            "allowed_tools": list(allowed),
            "tools_used": list(set(s.selected_tool for s in tool_steps if s.selected_tool)),
        },
    )


async def compute_execution_completion(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
) -> EvaluationMetric:
    trace = execution.execution_trace

    if not trace:
        return EvaluationMetric(
            metric_name=MetricName.EXECUTION_COMPLETION,
            value=0.0,
            weight=weight,
            details={"note": "no_execution_trace", "step_count": 0},
        )

    all_success = all(step.status == "success" for step in trace)
    error_count = sum(1 for step in trace if step.status == "error")

    return EvaluationMetric(
        metric_name=MetricName.EXECUTION_COMPLETION,
        value=1.0 if all_success else 0.0,
        weight=weight,
        details={
            "all_steps_successful": all_success,
            "total_steps": len(trace),
            "error_steps": error_count,
        },
    )


async def compute_hallucination_flag(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
) -> EvaluationMetric:
    hallucinated = False
    reasons: list[str] = []

    error_msg = execution.error_message or ""
    if "hallucinat" in error_msg.lower():
        hallucinated = True
        reasons.append("error_message_indicates_hallucination")

    final_lower = execution.final_answer.lower()
    expected_lower = task.expected_answer.lower()

    if execution.success_status and _normalize_text(final_lower) != _normalize_text(expected_lower):
        pass

    if not execution.success_status and execution.final_answer:
        trace = execution.execution_trace
        if trace:
            last_step = trace[-1]
            if last_step.status == "success" and last_step.tool_output:
                tool_output_str = str(last_step.tool_output).lower()
                if expected_lower not in tool_output_str and expected_lower not in final_lower:
                    if len(final_lower) > 10 and len(expected_lower) > 5:
                        hallucinated = True
                        reasons.append("answer_contradicts_tool_output")

    return EvaluationMetric(
        metric_name=MetricName.HALLUCINATION_FLAG,
        value=0.0 if hallucinated else 1.0,
        weight=weight,
        details={
            "hallucination_detected": hallucinated,
            "reasons": reasons if hallucinated else None,
        },
    )


async def compute_retry_count(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
    max_retries: int = 5,
) -> EvaluationMetric:
    trace = execution.execution_trace
    retries = sum(1 for step in trace if step.status == "error")

    if retries == 0:
        score = 1.0
    else:
        score = max(0.0, 1.0 - (retries / max_retries))

    return EvaluationMetric(
        metric_name=MetricName.RETRY_COUNT,
        value=score,
        weight=weight,
        details={
            "retry_count": retries,
            "max_retries": max_retries,
            "error_steps": [s.step_number for s in trace if s.status == "error"],
        },
    )


async def compute_token_usage_score(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weight: float = 1.0,
) -> EvaluationMetric:
    trace = execution.execution_trace
    step_count = len(trace)

    if step_count == 0:
        score = 0.0
    elif step_count <= 3:
        score = 1.0
    elif step_count <= 6:
        score = 0.8
    elif step_count <= 10:
        score = 0.5
    elif step_count <= 15:
        score = 0.3
    else:
        score = 0.1

    total_reasoning_chars = sum(len(s.reasoning_step) for s in trace)
    char_efficiency = 1.0
    if total_reasoning_chars > 0:
        avg_chars = total_reasoning_chars / step_count if step_count > 0 else 0
        if avg_chars > 500:
            char_efficiency = max(0.0, 1.0 - (avg_chars - 500) / 2000)

    score = score * 0.6 + char_efficiency * 0.4

    return EvaluationMetric(
        metric_name=MetricName.TOKEN_USAGE_SCORE,
        value=round(score, 4),
        weight=weight,
        details={
            "step_count": step_count,
            "total_reasoning_chars": total_reasoning_chars,
            "char_efficiency": round(char_efficiency, 4),
        },
    )


METRIC_COMPUTATORS: dict[str, Any] = {
    MetricName.TASK_SUCCESS.value: compute_task_success,
    MetricName.EXACT_MATCH_SCORE.value: compute_exact_match_score,
    MetricName.TOOL_USAGE_EFFICIENCY.value: compute_tool_usage_efficiency,
    MetricName.REASONING_STEP_COUNT.value: compute_reasoning_step_count,
    MetricName.LATENCY_SCORE.value: compute_latency_score,
    MetricName.TOOL_CALL_ACCURACY.value: compute_tool_call_accuracy,
    MetricName.EXECUTION_COMPLETION.value: compute_execution_completion,
    MetricName.HALLUCINATION_FLAG.value: compute_hallucination_flag,
    MetricName.RETRY_COUNT.value: compute_retry_count,
    MetricName.TOKEN_USAGE_SCORE.value: compute_token_usage_score,
}


async def compute_all_metrics(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weights: dict[str, float] | None = None,
) -> dict[str, EvaluationMetric]:
    weights = weights or {}
    results: dict[str, EvaluationMetric] = {}

    for metric_name, computator in METRIC_COMPUTATORS.items():
        weight = weights.get(metric_name, 1.0)
        metric = await computator(execution, task, weight=weight)
        results[metric_name] = metric

    return results
