from __future__ import annotations

from datetime import datetime

from app.evaluators.analysis.failure import aggregate_failure_analysis
from app.evaluators.analysis.statistics import compute_execution_statistics
from app.evaluators.metrics.metrics import compute_all_metrics
from app.evaluators.reports.summaries import generate_benchmark_summary
from app.schemas.benchmark import BenchmarkTask
from app.schemas.evaluation import (
    BenchmarkEvaluationResult,
    EvaluationComparisonResult,
    EvaluationMetric,
    FailureAnalysis,
    MetricBreakdown,
    TaskEvaluationResult,
)
from app.schemas.execution import AgentExecutionResult


def _compute_overall_score(
    metrics: dict[str, EvaluationMetric],
) -> float:
    total_weight = sum(m.weight for m in metrics.values())
    if total_weight == 0:
        return 0.0

    weighted_sum = sum(m.value * m.weight for m in metrics.values())
    return round(weighted_sum / total_weight, 4)


async def generate_task_evaluation(
    execution: AgentExecutionResult,
    task: BenchmarkTask,
    weights: dict[str, float] | None = None,
) -> TaskEvaluationResult:
    from app.evaluators.analysis.failure import analyze_failures

    metrics = await compute_all_metrics(execution, task, weights)
    overall = _compute_overall_score(metrics)

    metric_breakdown = MetricBreakdown(
        metrics=metrics,
        overall_score=overall,
    )

    failure_analysis = await analyze_failures(execution, task)

    passed = overall >= 0.5 and not failure_analysis.has_failures

    return TaskEvaluationResult(
        task_id=task.task_id,
        execution_id=execution.execution_id,
        category=task.category,
        difficulty=task.difficulty,
        metric_breakdown=metric_breakdown,
        failure_analysis=failure_analysis,
        passed=passed,
        score=overall,
    )


async def generate_benchmark_report(
    benchmark_id: str,
    model_name: str,
    executions: list[AgentExecutionResult],
    tasks: list[BenchmarkTask],
    dataset_id: str | None = None,
    weights: dict[str, float] | None = None,
) -> BenchmarkEvaluationResult:
    task_results: list[TaskEvaluationResult] = []
    exec_task_pairs: list[tuple[AgentExecutionResult, BenchmarkTask]] = []

    task_map = {t.task_id: t for t in tasks}

    for execution in executions:
        task = task_map.get(execution.task_id)
        if task is None:
            continue

        result = await generate_task_evaluation(execution, task, weights)
        task_results.append(result)
        exec_task_pairs.append((execution, task))

    all_metrics: dict[str, EvaluationMetric] = {}
    for result in task_results:
        for name, metric in result.metric_breakdown.metrics.items():
            if name not in all_metrics:
                all_metrics[name] = metric.model_copy(deep=True)

    overall_score = _compute_overall_score(all_metrics)

    metric_breakdown = MetricBreakdown(
        metrics=all_metrics,
        overall_score=overall_score,
    )

    execution_statistics = await compute_execution_statistics(executions)
    failure_analysis = await aggregate_failure_analysis(exec_task_pairs)
    benchmark_summary = await generate_benchmark_summary(
        benchmark_id,
        model_name,
        task_results,
        metric_breakdown,
        execution_statistics,
    )

    return BenchmarkEvaluationResult(
        benchmark_id=benchmark_id,
        model_name=model_name,
        dataset_id=dataset_id,
        execution_ids=[execution.execution_id for execution in executions],
        task_results=task_results,
        metric_breakdown=metric_breakdown,
        overall_score=overall_score,
        benchmark_summary=benchmark_summary,
        execution_statistics=execution_statistics,
        failure_analysis=failure_analysis,
        evaluation_timestamp=datetime.utcnow(),
    )


async def generate_comparison_report(
    benchmark_id: str,
    results: list[BenchmarkEvaluationResult],
) -> EvaluationComparisonResult:
    from app.evaluators.reports.summaries import generate_model_ranking

    summaries = [r.benchmark_summary for r in results]
    ranking = await generate_model_ranking(summaries)

    return EvaluationComparisonResult(
        benchmark_id=benchmark_id,
        results=results,
        ranking=ranking,
    )
