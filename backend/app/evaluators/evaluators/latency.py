from __future__ import annotations

from app.evaluators.base import BaseEvaluator
from app.evaluators.metrics.metrics import compute_latency_score
from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import EvaluationMetric, MetricName
from app.schemas.execution import AgentExecutionResult


class LatencyEvaluator(BaseEvaluator):
    name = "latency"
    description = "Evaluates execution speed and response time"

    async def evaluate(
        self,
        execution: AgentExecutionResult,
        task: BenchmarkTask,
    ) -> list[EvaluationMetric]:
        weight = getattr(self, "_latency_weight", 0.10)
        return [
            await compute_latency_score(execution, task, weight=weight),
        ]

    async def get_metrics(self) -> list[MetricName]:
        return [MetricName.LATENCY_SCORE]
