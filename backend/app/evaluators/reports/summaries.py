from __future__ import annotations

from app.schemas.evaluation import (
    BenchmarkSummary,
    ExecutionStatistics,
    MetricBreakdown,
    TaskEvaluationResult,
)


async def generate_benchmark_summary(
    benchmark_id: str,
    model_name: str,
    task_results: list[TaskEvaluationResult],
    metric_breakdown: MetricBreakdown,
    execution_statistics: ExecutionStatistics,
) -> BenchmarkSummary:
    total = len(task_results)
    passed = sum(1 for r in task_results if r.passed)
    failed = total - passed
    pass_rate = passed / total if total > 0 else 0.0

    avg_score = (
        sum(r.score for r in task_results) / total
        if total > 0
        else 0.0
    )

    return BenchmarkSummary(
        benchmark_id=benchmark_id,
        model_name=model_name,
        total_tasks=total,
        passed_tasks=passed,
        failed_tasks=failed,
        pass_rate=round(pass_rate, 4),
        average_score=round(avg_score, 4),
        weighted_score=round(metric_breakdown.overall_score, 4),
        execution_statistics=execution_statistics,
    )


async def generate_model_ranking(
    summaries: list[BenchmarkSummary],
) -> list[dict[str, float | str]]:
    sorted_summaries = sorted(
        summaries,
        key=lambda s: s.weighted_score,
        reverse=True,
    )

    return [
        {
            "rank": idx + 1,
            "model_name": summary.model_name,
            "weighted_score": summary.weighted_score,
            "average_score": summary.average_score,
            "pass_rate": summary.pass_rate,
            "total_tasks": summary.total_tasks,
            "passed_tasks": summary.passed_tasks,
        }
        for idx, summary in enumerate(sorted_summaries)
    ]
