"use client";

import { AccuracyChart, LatencyChart } from "@/components/shared/charts";
import { ErrorState } from "@/components/shared/error-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDate, formatMs, formatPercent, formatScore, titleCase } from "@/lib/format";
import { dashboardApi } from "@/services/dashboard";

export function ResultDetail({ benchmarkId }: { benchmarkId: string }) {
  const result = useApiQuery(`result-${benchmarkId}`, () => dashboardApi.getBenchmarkResult(benchmarkId));

  if (result.isLoading) {
    return <PageSkeleton />;
  }

  if (result.error || !result.data) {
    return <ErrorState message={result.error ?? "Benchmark result not found."} onRetry={() => void result.refetch()} />;
  }

  const metrics = Object.values(result.data.metric_breakdown.metrics);
  const accuracyData = result.data.task_results.map((task) => ({
    name: task.task_id,
    accuracy: task.passed ? 100 : 0,
  }));
  const latencyData = result.data.task_results.map((task) => {
    const execution = result.data?.execution_statistics.average_latency ?? 0;
    return { name: task.task_id, latency: execution };
  });

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Result Detail"
        title={result.data.benchmark_id}
        description={`Detailed evaluation for ${result.data.model_name}, including task-level metrics, failure analysis, and benchmark summary statistics.`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Overall score"
          value={formatPercent(result.data.overall_score)}
          hint="Composite weighted score for this benchmark run."
        />
        <MetricCard
          label="Pass rate"
          value={formatPercent(result.data.benchmark_summary.pass_rate)}
          hint={`${result.data.benchmark_summary.passed_tasks} of ${result.data.benchmark_summary.total_tasks} tasks passed.`}
        />
        <MetricCard
          label="Average latency"
          value={formatMs(result.data.execution_statistics.average_latency)}
          hint="Mean task execution latency."
        />
        <MetricCard
          label="Evaluated at"
          value={formatDate(result.data.evaluation_timestamp)}
          hint="Timestamp returned by the evaluation service."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Accuracy chart</CardTitle>
            <CardDescription>Task pass outcomes for this benchmark.</CardDescription>
          </CardHeader>
          <CardContent>
            <AccuracyChart data={accuracyData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latency chart</CardTitle>
            <CardDescription>Per-task latency overview using benchmark execution statistics.</CardDescription>
          </CardHeader>
          <CardContent>
            <LatencyChart data={latencyData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Metric breakdown</CardTitle>
            <CardDescription>Normalized evaluation metrics and weights returned by the backend.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.map((metric) => (
              <div key={metric.metric_name} className="rounded-2xl bg-secondary/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{titleCase(metric.metric_name)}</p>
                  <Badge variant="info">weight {metric.weight}</Badge>
                </div>
                <p className="mt-2 text-2xl font-semibold">{formatScore(metric.value)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution summary</CardTitle>
            <CardDescription>Benchmark-wide operational statistics and failure overview.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-secondary/70 p-4">
              <p className="text-sm text-muted-foreground">Completed tasks</p>
              <p className="mt-2 text-2xl font-semibold">{result.data.execution_statistics.completed_tasks}</p>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-4">
              <p className="text-sm text-muted-foreground">Failed tasks</p>
              <p className="mt-2 text-2xl font-semibold">{result.data.execution_statistics.failed_tasks}</p>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-4">
              <p className="text-sm text-muted-foreground">Average steps</p>
              <p className="mt-2 text-2xl font-semibold">{result.data.execution_statistics.average_steps.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-4">
              <p className="text-sm text-muted-foreground">Primary failure</p>
              <p className="mt-2 text-2xl font-semibold">{titleCase(result.data.failure_analysis.primary_failure)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task results</CardTitle>
          <CardDescription>Per-task scores, categories, difficulty, and failure signal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Primary failure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.data.task_results.map((task) => (
                  <TableRow key={task.execution_id}>
                    <TableCell className="font-medium">{task.task_id}</TableCell>
                    <TableCell>{task.category ? titleCase(task.category) : "--"}</TableCell>
                    <TableCell>{task.difficulty ? titleCase(task.difficulty) : "--"}</TableCell>
                    <TableCell>{task.passed ? "Yes" : "No"}</TableCell>
                    <TableCell>{formatScore(task.score)}</TableCell>
                    <TableCell>{titleCase(task.failure_analysis.primary_failure)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
