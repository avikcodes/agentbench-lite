from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import EvaluationMetric, MetricName
from app.schemas.execution import AgentExecutionResult


class BaseEvaluator(ABC):
    name: str
    description: str

    @abstractmethod
    async def evaluate(
        self,
        execution: AgentExecutionResult,
        task: BenchmarkTask,
    ) -> list[EvaluationMetric]:
        ...

    async def validate(
        self,
        execution: AgentExecutionResult,
        task: BenchmarkTask,
    ) -> bool:
        return True

    async def get_metrics(self) -> list[MetricName]:
        ...


class EvaluationContext:
    def __init__(
        self,
        execution: AgentExecutionResult,
        task: BenchmarkTask,
        weights: dict[str, float] | None = None,
    ) -> None:
        self.execution = execution
        self.task = task
        self.weights = weights or {}

    def get_weight(self, metric_name: str, default: float = 1.0) -> float:
        return self.weights.get(metric_name, default)
