from __future__ import annotations

from typing import Any

from app.evaluators.base import BaseEvaluator


class EvaluatorRegistryError(Exception):
    """Base exception for evaluator registry failures."""


class EvaluatorNotFoundError(EvaluatorRegistryError):
    """Raised when an evaluator is not found in the registry."""


class EvaluatorRegistry:
    def __init__(self) -> None:
        self._evaluators: dict[str, BaseEvaluator] = {}

    def register(self, evaluator: BaseEvaluator) -> None:
        if evaluator.name in self._evaluators:
            raise EvaluatorRegistryError(
                f"Evaluator '{evaluator.name}' is already registered."
            )
        self._evaluators[evaluator.name] = evaluator

    def unregister(self, name: str) -> None:
        if name not in self._evaluators:
            raise EvaluatorNotFoundError(
                f"Evaluator '{name}' was not found in the registry."
            )
        del self._evaluators[name]

    def get(self, name: str) -> BaseEvaluator:
        evaluator = self._evaluators.get(name)
        if evaluator is None:
            raise EvaluatorNotFoundError(
                f"Evaluator '{name}' was not found in the registry."
            )
        return evaluator

    def list(self) -> list[dict[str, Any]]:
        return [
            {"name": e.name, "description": e.description}
            for e in self._evaluators.values()
        ]

    def get_all(self) -> list[BaseEvaluator]:
        return list(self._evaluators.values())


evaluator_registry = EvaluatorRegistry()
