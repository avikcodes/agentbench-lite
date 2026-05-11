from __future__ import annotations

from app.evaluators.base import BaseEvaluator
from app.evaluators.metrics.metrics import compute_reasoning_step_count
from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import EvaluationMetric, MetricName
from app.schemas.execution import AgentExecutionResult


class ReasoningEvaluator(BaseEvaluator):
    name = "reasoning"
    description = "Evaluates reasoning step quality and step count efficiency"

    async def evaluate(
        self,
        execution: AgentExecutionResult,
        task: BenchmarkTask,
    ) -> list[EvaluationMetric]:
        weight = getattr(self, "_reasoning_weight", 0.05)
        return [
            await compute_reasoning_step_count(execution, task, weight=weight),
        ]

    async def get_metrics(self) -> list[MetricName]:
        return [MetricName.REASONING_STEP_COUNT]
