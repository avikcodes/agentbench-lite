from __future__ import annotations

from collections import Counter

from app.evaluators.reports.generator import generate_comparison_report
from app.schemas.analytics import AnalyticsSummary, TrendAnalysis, TrendDataPoint
from app.schemas.evaluation import (
    BenchmarkEvaluationResult,
    EvaluationComparisonResult,
)
from app.services.evaluation_store_service import evaluation_store_service
from app.services.execution_store_service import execution_store_service


class AnalyticsServiceError(Exception):
    """Base exception for analytics service failures."""


class AnalyticsService:
    async def get_summary(self) -> AnalyticsSummary:
        results = await evaluation_store_service.list_results()
        if not results:
            return AnalyticsSummary()

        total = len(results)
        scores = [r.overall_score for r in results]
        pass_rates = [r.benchmark_summary.pass_rate for r in results]
        latencies = [r.execution_statistics.average_latency for r in results]
        total_tool_calls = sum(
            r.execution_statistics.total_tool_calls for r in results
        )

        score_buckets: dict[str, int] = {
            "0.0-0.2": 0,
            "0.2-0.4": 0,
            "0.4-0.6": 0,
            "0.6-0.8": 0,
            "0.8-1.0": 0,
        }
        for s in scores:
            if s < 0.2:
                score_buckets["0.0-0.2"] += 1
            elif s < 0.4:
                score_buckets["0.2-0.4"] += 1
            elif s < 0.6:
                score_buckets["0.4-0.6"] += 1
            elif s < 0.8:
                score_buckets["0.6-0.8"] += 1
            else:
                score_buckets["0.8-1.0"] += 1

        failure_counter: Counter[str] = Counter()
        tool_counter: Counter[str] = Counter()
        for r in results:
            for f in r.failure_analysis.failures:
                failure_counter[f.failure_type.value] += 1
            for execution_id in r.execution_ids:
                try:
                    execution = await execution_store_service.get_result(execution_id)
                except Exception:
                    continue
                for tool_name in execution.tools_used:
                    tool_counter[tool_name] += 1

        for r in results:
            for task in r.task_results:
                for f in task.failure_analysis.failures:
                    failure_counter[f.failure_type.value] += 1

        model_perf: dict[str, list[float]] = {}
        for r in results:
            model = r.model_name
            if model not in model_perf:
                model_perf[model] = []
            model_perf[model].append(r.overall_score)

        model_performance_list = [
            {
                "model_name": model,
                "average_score": round(sum(scores) / len(scores), 4),
                "total_runs": len(scores),
            }
            for model, scores in model_perf.items()
        ]
        model_performance_list.sort(key=lambda x: x["average_score"], reverse=True)

        return AnalyticsSummary(
            total_benchmarks=total,
            total_executions=sum(r.benchmark_summary.total_tasks for r in results),
            average_score=round(sum(scores) / total, 4) if total > 0 else 0.0,
            average_pass_rate=round(sum(pass_rates) / total, 4)
            if total > 0
            else 0.0,
            total_tool_calls=total_tool_calls,
            average_latency=round(sum(latencies) / total, 4)
            if total > 0
            else 0.0,
            score_distribution=[
                {"range": k, "count": v} for k, v in score_buckets.items()
            ],
            failure_distribution=[
                {"failure_type": k, "count": v}
                for k, v in failure_counter.most_common()
            ],
            tool_usage_distribution=[
                {"tool_name": k, "count": v} for k, v in tool_counter.most_common()
            ],
            model_performance=model_performance_list,
        )

    async def get_trends(
        self, model_name: str | None = None
    ) -> TrendAnalysis:
        results = await evaluation_store_service.list_results()
        if model_name:
            results = [r for r in results if r.model_name == model_name]

        results.sort(
            key=lambda r: r.evaluation_timestamp
        )

        data_points = [
            TrendDataPoint(
                benchmark_id=r.benchmark_id,
                evaluated_at=r.evaluation_timestamp,
                score=r.overall_score,
                pass_rate=r.benchmark_summary.pass_rate,
                latency=r.execution_statistics.average_latency,
            )
            for r in results
        ]

        return TrendAnalysis(
            scores=data_points,
            pass_rates=data_points,
            latencies=data_points,
            model_name=model_name,
        )

    async def compare(
        self, benchmark_ids: list[str]
    ) -> EvaluationComparisonResult:
        results: list[BenchmarkEvaluationResult] = []
        for bid in benchmark_ids:
            try:
                result = await evaluation_store_service.get_result(bid)
                results.append(result)
            except Exception as exc:
                raise AnalyticsServiceError(
                    f"Benchmark result '{bid}' was not found."
                ) from exc

        comparison_id = f"compare_{len(benchmark_ids)}"
        return await generate_comparison_report(comparison_id, results)


analytics_service = AnalyticsService()
