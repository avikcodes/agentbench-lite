from __future__ import annotations

from app.evaluators.base import BaseEvaluator
from app.evaluators.metrics.metrics import (
    compute_tool_call_accuracy,
    compute_tool_usage_efficiency,
)
from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import EvaluationMetric, MetricName
from app.schemas.execution import AgentExecutionResult


class ToolEvaluator(BaseEvaluator):
    name = "tool_usage"
    description = "Evaluates tool selection accuracy and execution efficiency"

    async def evaluate(
        self,
        execution: AgentExecutionResult,
        task: BenchmarkTask,
    ) -> list[EvaluationMetric]:
        efficiency_weight = getattr(self, "_efficiency_weight", 0.10)
        accuracy_weight = getattr(self, "_accuracy_weight", 0.10)

        return [
            await compute_tool_usage_efficiency(execution, task, weight=efficiency_weight),
            await compute_tool_call_accuracy(execution, task, weight=accuracy_weight),
        ]

    async def get_metrics(self) -> list[MetricName]:
        return [
            MetricName.TOOL_USAGE_EFFICIENCY,
            MetricName.TOOL_CALL_ACCURACY,
        ]
