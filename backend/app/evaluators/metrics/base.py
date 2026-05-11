from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any

from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import EvaluationMetric, MetricName
from app.schemas.execution import AgentExecutionResult


class BaseMetric(ABC):
    name: MetricName
    description: str

    @abstractmethod
    async def compute(
        self,
        execution: AgentExecutionResult,
        task: BenchmarkTask,
        weight: float = 1.0,
    ) -> EvaluationMetric:
        ...
