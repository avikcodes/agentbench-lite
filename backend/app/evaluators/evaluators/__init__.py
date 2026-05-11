"""Concrete evaluator implementations."""

from app.evaluators.evaluators.correctness import CorrectnessEvaluator
from app.evaluators.evaluators.efficiency import EfficiencyEvaluator
from app.evaluators.evaluators.latency import LatencyEvaluator
from app.evaluators.evaluators.reasoning import ReasoningEvaluator
from app.evaluators.evaluators.tool_evaluator import ToolEvaluator
from app.evaluators.registry import evaluator_registry

evaluator_registry.register(CorrectnessEvaluator())
evaluator_registry.register(LatencyEvaluator())
evaluator_registry.register(ToolEvaluator())
evaluator_registry.register(ReasoningEvaluator())
evaluator_registry.register(EfficiencyEvaluator())

__all__ = [
    "CorrectnessEvaluator",
    "LatencyEvaluator",
    "ToolEvaluator",
    "ReasoningEvaluator",
    "EfficiencyEvaluator",
]
