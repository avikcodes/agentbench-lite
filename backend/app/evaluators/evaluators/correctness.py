from __future__ import annotations

from app.evaluators.base import BaseEvaluator, EvaluationContext
from app.evaluators.metrics.metrics import (
    compute_exact_match_score,
    compute_hallucination_flag,
    compute_task_success,
)
from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import EvaluationMetric, MetricName
from app.schemas.execution import AgentExecutionResult


class CorrectnessEvaluator(BaseEvaluator):
    name = "correctness"
    description = "Evaluates answer correctness including task success, exact match, and hallucination detection"

    async def evaluate(
        self,
        execution: AgentExecutionResult,
        task: BenchmarkTask,
    ) -> list[EvaluationMetric]:
        context = getattr(self, "_context", None)
        weights = context.weights if context else {}

        success_weight = weights.get(MetricName.TASK_SUCCESS.value, 0.25)
        match_weight = weights.get(MetricName.EXACT_MATCH_SCORE.value, 0.15)
        hallu_weight = weights.get(MetricName.HALLUCINATION_FLAG.value, 0.10)

        return [
            await compute_task_success(execution, task, weight=success_weight),
            await compute_exact_match_score(execution, task, weight=match_weight),
            await compute_hallucination_flag(execution, task, weight=hallu_weight),
        ]

    async def get_metrics(self) -> list[MetricName]:
        return [
            MetricName.TASK_SUCCESS,
            MetricName.EXACT_MATCH_SCORE,
            MetricName.HALLUCINATION_FLAG,
        ]
