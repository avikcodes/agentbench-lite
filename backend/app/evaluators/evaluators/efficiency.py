from __future__ import annotations

from app.evaluators.base import BaseEvaluator
from app.evaluators.metrics.metrics import (
    compute_execution_completion,
    compute_retry_count,
    compute_token_usage_score,
)
from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import EvaluationMetric, MetricName
from app.schemas.execution import AgentExecutionResult


class EfficiencyEvaluator(BaseEvaluator):
    name = "efficiency"
    description = "Evaluates overall execution efficiency including completion, retries, and token usage"

    async def evaluate(
        self,
        execution: AgentExecutionResult,
        task: BenchmarkTask,
    ) -> list[EvaluationMetric]:
        completion_weight = getattr(self, "_completion_weight", 0.05)
        retry_weight = getattr(self, "_retry_weight", 0.05)
        token_weight = getattr(self, "_token_weight", 0.05)

        return [
            await compute_execution_completion(execution, task, weight=completion_weight),
            await compute_retry_count(execution, task, weight=retry_weight),
            await compute_token_usage_score(execution, task, weight=token_weight),
        ]

    async def get_metrics(self) -> list[MetricName]:
        return [
            MetricName.EXECUTION_COMPLETION,
            MetricName.RETRY_COUNT,
            MetricName.TOKEN_USAGE_SCORE,
        ]
