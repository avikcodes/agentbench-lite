"use client";

import Link from "next/link";

import { BenchmarkHistoryChart, ScoreComparisonChart } from "@/components/shared/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { useBenchmarkRefresh } from "@/hooks/use-benchmark-refresh";
import { formatDate, formatMs, formatPercent, formatScore } from "@/lib/format";
import { dashboardApi } from "@/services/dashboard";

export function ResultsOverview() {
  const benchmarks = useApiQuery("results-benchmarks", dashboardApi.getBenchmarkResults);
  useBenchmarkRefresh(() => {
    void benchmarks.refetch();
  });

  if (benchmarks.isLoading) {
    return <PageSkeleton />;
  }

  if (benchmarks.error) {
    return <ErrorState message={benchmarks.error} onRetry={() => void benchmarks.refetch()} />;
  }

  const results = (benchmarks.data ?? []).slice().sort((a, b) => {
    return new Date(b.evaluation_timestamp).getTime() - new Date(a.evaluation_timestamp).getTime();
  });

  const latest = results[0];

  const chartData = results.slice(0, 6).map((run) => ({
    name: run.model_name.split("/").pop() ?? run.model_name,
    score: run.overall_score,
  }));

  const historyData = results.slice(0, 6).reverse().map((run) => ({
    name: formatDate(run.evaluation_timestamp).split(",")[0] ?? run.benchmark_id,
    score: run.overall_score,
  }));

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Results Hub"
        title="Benchmark results and metric breakdowns"
        description="Review evaluated benchmark runs, compare overall scores, and inspect detailed metric summaries for each execution."
        actions={
          <Link href="/run">
            <Button>New run</Button>
          </Link>
        }
      />

      {results.length === 0 ? (
        <EmptyState
          title="No evaluated benchmarks"
          description="Run a benchmark first. Once the backend evaluates it, the result table and charts will appear here."
          action={
            <Link href="/run">
              <Button>Run benchmark</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Evaluated runs"
              value={String(results.length)}
              hint="Benchmark evaluation records currently available."
            />
            <MetricCard
              label="Latest score"
              value={latest ? formatPercent(latest.overall_score) : "0%"}
              hint="Overall score for the most recent evaluated benchmark."
            />
            <MetricCard
              label="Latest pass rate"
              value={latest ? formatPercent(latest.benchmark_summary.pass_rate) : "0%"}
              hint="Task-level success rate for the most recent run."
            />
            <MetricCard
              label="Average latency"
              value={latest ? formatMs(latest.execution_statistics.average_latency) : "0s"}
              hint="Mean latency per task in the latest evaluated benchmark."
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Score comparison</CardTitle>
                <CardDescription>Most recent benchmark scores by model.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScoreComparisonChart data={chartData} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Benchmark history</CardTitle>
                <CardDescription>Recent evaluation scores over time.</CardDescription>
              </CardHeader>
              <CardContent>
                <BenchmarkHistoryChart data={historyData} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Benchmark results table</CardTitle>
              <CardDescription>Open any benchmark to inspect task-level metrics and execution summaries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Benchmark</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Overall score</TableHead>
                      <TableHead>Pass rate</TableHead>
                      <TableHead>Avg latency</TableHead>
                      <TableHead>Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((run) => (
                      <TableRow key={run.benchmark_id}>
                        <TableCell className="font-medium">
                          <Link className="text-primary hover:underline" href={`/results/${run.benchmark_id}`}>
                            {run.benchmark_id}
                          </Link>
                        </TableCell>
                        <TableCell>{run.model_name}</TableCell>
                        <TableCell>{formatScore(run.overall_score)}</TableCell>
                        <TableCell>{formatPercent(run.benchmark_summary.pass_rate)}</TableCell>
                        <TableCell>{formatMs(run.execution_statistics.average_latency)}</TableCell>
                        <TableCell>{formatDate(run.evaluation_timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
