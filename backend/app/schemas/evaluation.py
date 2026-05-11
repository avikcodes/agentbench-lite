from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class MetricName(str, Enum):
    TASK_SUCCESS = "task_success"
    EXACT_MATCH_SCORE = "exact_match_score"
    TOOL_USAGE_EFFICIENCY = "tool_usage_efficiency"
    REASONING_STEP_COUNT = "reasoning_step_count"
    LATENCY_SCORE = "latency_score"
    TOOL_CALL_ACCURACY = "tool_call_accuracy"
    EXECUTION_COMPLETION = "execution_completion"
    HALLUCINATION_FLAG = "hallucination_flag"
    RETRY_COUNT = "retry_count"
    TOKEN_USAGE_SCORE = "token_usage_score"
    OVERALL_SCORE = "overall_score"


class EvaluationMetric(BaseModel):
    metric_name: MetricName
    value: float = Field(..., ge=0, le=1)
    weight: float = Field(default=1.0, ge=0, le=1)
    normalized: bool = True
    details: dict[str, Any] | None = None


class MetricBreakdown(BaseModel):
    metrics: dict[str, EvaluationMetric]
    overall_score: float = Field(..., ge=0, le=1)


class FailureType(str, Enum):
    INVALID_TOOL_USAGE = "invalid_tool_usage"
    INCORRECT_FINAL_ANSWER = "incorrect_final_answer"
    TIMEOUT = "timeout"
    REASONING_FAILURE = "reasoning_failure"
    EXECUTION_CRASH = "execution_crash"
    HALLUCINATION = "hallucination"
    TOOL_EXECUTION_ERROR = "tool_execution_error"
    NONE = "none"


class FailureDetail(BaseModel):
    failure_type: FailureType
    description: str
    step_number: int | None = None
    details: dict[str, Any] | None = None


class FailureAnalysis(BaseModel):
    has_failures: bool
    failures: list[FailureDetail] = Field(default_factory=list)
    primary_failure: FailureType = FailureType.NONE
    failure_count: int = 0


class TaskEvaluationResult(BaseModel):
    task_id: str
    execution_id: str
    category: str | None = None
    difficulty: str | None = None
    metric_breakdown: MetricBreakdown
    failure_analysis: FailureAnalysis
    passed: bool
    score: float = Field(..., ge=0, le=1)
    evaluated_at: datetime = Field(default_factory=datetime.utcnow)


class ExecutionStatistics(BaseModel):
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    average_latency: float = 0.0
    total_latency: float = 0.0
    average_steps: float = 0.0
    total_steps: int = 0
    total_tool_calls: int = 0
    average_tool_calls: float = 0.0
    total_retries: int = 0
    average_retries: float = 0.0
    hallucination_count: int = 0
    timeout_count: int = 0
    crash_count: int = 0


class BenchmarkSummary(BaseModel):
    benchmark_id: str
    model_name: str | None = None
    total_tasks: int = 0
    passed_tasks: int = 0
    failed_tasks: int = 0
    pass_rate: float = 0.0
    average_score: float = 0.0
    weighted_score: float = 0.0
    execution_statistics: ExecutionStatistics = Field(default_factory=ExecutionStatistics)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class BenchmarkEvaluationResult(BaseModel):
    benchmark_id: str
    model_name: str
    task_results: list[TaskEvaluationResult] = Field(default_factory=list)
    metric_breakdown: MetricBreakdown
    overall_score: float = Field(..., ge=0, le=1)
    benchmark_summary: BenchmarkSummary
    execution_statistics: ExecutionStatistics
    failure_analysis: FailureAnalysis
    evaluation_timestamp: datetime = Field(default_factory=datetime.utcnow)


class EvaluationComparisonResult(BaseModel):
    benchmark_id: str
    results: list[BenchmarkEvaluationResult] = Field(default_factory=list)
    ranking: list[dict[str, Any]] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class EvaluationWeightConfig(BaseModel):
    metric_weights: dict[str, float] = Field(default_factory=dict)
    profile_name: str | None = None


class EvaluationProfile(BaseModel):
    name: str
    description: str
    metric_weights: dict[str, float]


class EvaluateSingleRequest(BaseModel):
    execution_id: str
    task_id: str
    dataset_id: str | None = None
    weight_config: EvaluationWeightConfig | None = None


class EvaluateBenchmarkRunRequest(BaseModel):
    execution_ids: list[str]
    model_name: str
    dataset_id: str | None = None
    weight_config: EvaluationWeightConfig | None = None


class CompareBenchmarksRequest(BaseModel):
    benchmark_ids: list[str]
