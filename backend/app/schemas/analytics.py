from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AnalyticsSummary(BaseModel):
    total_benchmarks: int = 0
    total_executions: int = 0
    average_score: float = 0.0
    average_pass_rate: float = 0.0
    total_tool_calls: int = 0
    average_latency: float = 0.0
    score_distribution: list[dict[str, Any]] = Field(default_factory=list)
    failure_distribution: list[dict[str, Any]] = Field(default_factory=list)
    tool_usage_distribution: list[dict[str, Any]] = Field(default_factory=list)
    model_performance: list[dict[str, Any]] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class TrendDataPoint(BaseModel):
    benchmark_id: str
    evaluated_at: datetime
    score: float
    pass_rate: float
    latency: float


class TrendAnalysis(BaseModel):
    scores: list[TrendDataPoint] = Field(default_factory=list)
    pass_rates: list[TrendDataPoint] = Field(default_factory=list)
    latencies: list[TrendDataPoint] = Field(default_factory=list)
    model_name: str | None = None


class ExportPayload(BaseModel):
    format: str = "json"
    data: dict[str, Any] = Field(default_factory=dict)
    filename: str = ""
