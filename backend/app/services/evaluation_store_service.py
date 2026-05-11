from __future__ import annotations

from app.schemas.evaluation import BenchmarkEvaluationResult


class EvaluationStoreError(Exception):
    """Base exception for evaluation storage failures."""


class EvaluationNotFoundError(EvaluationStoreError):
    """Raised when an evaluation result cannot be found."""


class EvaluationStoreService:
    def __init__(self) -> None:
        self._results: dict[str, BenchmarkEvaluationResult] = {}

    async def save_result(
        self, result: BenchmarkEvaluationResult
    ) -> BenchmarkEvaluationResult:
        self._results[result.benchmark_id] = result
        return result

    async def get_result(
        self, benchmark_id: str
    ) -> BenchmarkEvaluationResult:
        result = self._results.get(benchmark_id)
        if result is None:
            raise EvaluationNotFoundError(
                f"Benchmark evaluation '{benchmark_id}' was not found."
            )
        return result

    async def list_results(self) -> list[BenchmarkEvaluationResult]:
        return list(self._results.values())

    async def delete_result(self, benchmark_id: str) -> None:
        if benchmark_id not in self._results:
            raise EvaluationNotFoundError(
                f"Benchmark evaluation '{benchmark_id}' was not found."
            )
        del self._results[benchmark_id]


evaluation_store_service = EvaluationStoreService()
