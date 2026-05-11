from __future__ import annotations

from typing import Any

from app.schemas.evaluation import MetricName

DEFAULT_METRIC_WEIGHTS: dict[str, float] = {
    MetricName.TASK_SUCCESS.value: 0.25,
    MetricName.EXACT_MATCH_SCORE.value: 0.15,
    MetricName.TOOL_USAGE_EFFICIENCY.value: 0.10,
    MetricName.REASONING_STEP_COUNT.value: 0.05,
    MetricName.LATENCY_SCORE.value: 0.10,
    MetricName.TOOL_CALL_ACCURACY.value: 0.10,
    MetricName.EXECUTION_COMPLETION.value: 0.05,
    MetricName.HALLUCINATION_FLAG.value: 0.10,
    MetricName.RETRY_COUNT.value: 0.05,
    MetricName.TOKEN_USAGE_SCORE.value: 0.05,
}

LATENCY_FOCUSED_WEIGHTS: dict[str, float] = {
    MetricName.TASK_SUCCESS.value: 0.20,
    MetricName.EXACT_MATCH_SCORE.value: 0.10,
    MetricName.TOOL_USAGE_EFFICIENCY.value: 0.10,
    MetricName.REASONING_STEP_COUNT.value: 0.05,
    MetricName.LATENCY_SCORE.value: 0.30,
    MetricName.TOOL_CALL_ACCURACY.value: 0.10,
    MetricName.EXECUTION_COMPLETION.value: 0.05,
    MetricName.HALLUCINATION_FLAG.value: 0.05,
    MetricName.RETRY_COUNT.value: 0.05,
    MetricName.TOKEN_USAGE_SCORE.value: 0.00,
}

ACCURACY_FOCUSED_WEIGHTS: dict[str, float] = {
    MetricName.TASK_SUCCESS.value: 0.30,
    MetricName.EXACT_MATCH_SCORE.value: 0.25,
    MetricName.TOOL_USAGE_EFFICIENCY.value: 0.10,
    MetricName.REASONING_STEP_COUNT.value: 0.05,
    MetricName.LATENCY_SCORE.value: 0.05,
    MetricName.TOOL_CALL_ACCURACY.value: 0.10,
    MetricName.EXECUTION_COMPLETION.value: 0.05,
    MetricName.HALLUCINATION_FLAG.value: 0.10,
    MetricName.RETRY_COUNT.value: 0.00,
    MetricName.TOKEN_USAGE_SCORE.value: 0.00,
}

EFFICIENCY_FOCUSED_WEIGHTS: dict[str, float] = {
    MetricName.TASK_SUCCESS.value: 0.20,
    MetricName.EXACT_MATCH_SCORE.value: 0.10,
    MetricName.TOOL_USAGE_EFFICIENCY.value: 0.15,
    MetricName.REASONING_STEP_COUNT.value: 0.10,
    MetricName.LATENCY_SCORE.value: 0.15,
    MetricName.TOOL_CALL_ACCURACY.value: 0.10,
    MetricName.EXECUTION_COMPLETION.value: 0.05,
    MetricName.HALLUCINATION_FLAG.value: 0.05,
    MetricName.RETRY_COUNT.value: 0.05,
    MetricName.TOKEN_USAGE_SCORE.value: 0.05,
}

WEIGHT_PROFILES: dict[str, dict[str, float]] = {
    "balanced": DEFAULT_METRIC_WEIGHTS,
    "latency_focused": LATENCY_FOCUSED_WEIGHTS,
    "accuracy_focused": ACCURACY_FOCUSED_WEIGHTS,
    "efficiency_focused": EFFICIENCY_FOCUSED_WEIGHTS,
}


def get_weight_profile(name: str) -> dict[str, float]:
    profile = WEIGHT_PROFILES.get(name)
    if profile is None:
        raise ValueError(f"Weight profile '{name}' was not found.")
    return profile


def resolve_weights(
    custom_weights: dict[str, float] | None = None,
    profile_name: str | None = None,
) -> dict[str, float]:
    if profile_name:
        base = get_weight_profile(profile_name)
    else:
        base = dict(DEFAULT_METRIC_WEIGHTS)

    if custom_weights:
        base.update(custom_weights)

    return base
