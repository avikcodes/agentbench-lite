"use client";

import Link from "next/link";
import { Activity, BrainCircuit, Database, Timer } from "lucide-react";

import { BenchmarkHistoryChart, ScoreComparisonChart } from "@/components/shared/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDate, formatMs, formatPercent } from "@/lib/format";
import { dashboardApi } from "@/services/dashboard";

export function DashboardOverview() {
  const health = useApiQuery("health", dashboardApi.getHealth);
  const models = useApiQuery("models", dashboardApi.getModels);
  const datasets = useApiQuery("datasets", dashboardApi.getDatasets);
  const benchmarks = useApiQuery("benchmarks", dashboardApi.getBenchmarkResults);

  if (health.isLoading || models.isLoading || datasets.isLoading || benchmarks.isLoading) {
    return <PageSkeleton />;
  }

  if (health.error || models.error || datasets.error || benchmarks.error) {
    return (
      <ErrorState
        message={health.error ?? models.error ?? datasets.error ?? benchmarks.error ?? "Unknown error"}
        onRetry={() => {
          void health.refetch();
          void models.refetch();
          void datasets.refetch();
          void benchmarks.refetch();
        }}
      />
    );
  }

  const benchmarkData = benchmarks.data ?? [];
  const recentRuns = benchmarkData.slice().sort((a, b) => {
    return new Date(b.evaluation_timestamp).getTime() - new Date(a.evaluation_timestamp).getTime();
  }).slice(0, 5);

  const averageScore =
    benchmarkData.length > 0
      ? benchmarkData.reduce((sum, run) => sum + run.overall_score, 0) / benchmarkData.length
      : 0;

  const scoreChart = recentRuns.map((run) => ({
    name: run.model_name.split("/").pop() ?? run.model_name,
    score: run.overall_score,
  }));

  const historyChart = recentRuns.map((run) => ({
    name: formatDate(run.evaluation_timestamp).split(",")[0] ?? run.benchmark_id,
    score: run.overall_score,
  }));

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Command Center"
        title="Benchmark operations at a glance"
        description="Monitor model readiness, inspect recent evaluation runs, and jump into new benchmark executions from a single research-grade workspace."
        actions={
          <>
            <Link href="/run">
              <Button>Run benchmark</Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline">Open leaderboard</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Backend status"
          value={health.data?.status ?? "unknown"}
          hint="FastAPI connectivity verified through the Next proxy layer."
          icon={<Activity className="size-5" />}
        />
        <MetricCard
          label="Registered models"
          value={String(models.data?.length ?? 0)}
          hint="Includes enabled and currently unavailable provider-backed models."
          icon={<BrainCircuit className="size-5" />}
        />
        <MetricCard
          label="Datasets"
          value={String(datasets.data?.length ?? 0)}
          hint="Benchmark suites currently available for execution."
          icon={<Database className="size-5" />}
        />
        <MetricCard
          label="Average score"
          value={formatPercent(averageScore)}
          hint="Mean overall score across stored benchmark evaluations."
          icon={<Timer className="size-5" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Recent benchmark runs</CardTitle>
            <CardDescription>
              Latest evaluated runs stored by the backend, including pass rate and latency summaries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRuns.length === 0 ? (
              <EmptyState
                title="No benchmark runs yet"
                description="Run your first benchmark to populate the dashboard, results, and leaderboard views."
                action={
                  <Link href="/run">
                    <Button>Start a benchmark</Button>
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Model</TableHead>
                      <TableHead>Benchmark</TableHead>
                      <TableHead>Pass rate</TableHead>
                      <TableHead>Latency</TableHead>
                      <TableHead>Run time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRuns.map((run) => (
                      <TableRow key={run.benchmark_id}>
                        <TableCell className="font-medium">{run.model_name}</TableCell>
                        <TableCell>
                          <Link className="text-primary hover:underline" href={`/results/${run.benchmark_id}`}>
                            {run.benchmark_id}
                          </Link>
                        </TableCell>
                        <TableCell>{formatPercent(run.benchmark_summary.pass_rate)}</TableCell>
                        <TableCell>{formatMs(run.execution_statistics.average_latency)}</TableCell>
                        <TableCell>{formatDate(run.evaluation_timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System summary</CardTitle>
            <CardDescription>
              A quick operational snapshot of model availability and evaluation throughput.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-secondary/70 px-4 py-3">
              <span className="text-sm font-medium">API health</span>
              <StatusBadge status={health.data?.status === "healthy" ? "healthy" : "error"} />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-secondary/70 px-4 py-3">
              <span className="text-sm font-medium">Enabled models</span>
              <span className="font-semibold">
                {(models.data ?? []).filter((model) => model.enabled).length} / {models.data?.length ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-secondary/70 px-4 py-3">
              <span className="text-sm font-medium">Stored benchmark results</span>
              <span className="font-semibold">{benchmarkData.length}</span>
            </div>
            <div className="rounded-2xl bg-primary px-4 py-4 text-primary-foreground">
              <p className="text-xs font-semibold tracking-[0.2em] uppercase">Research note</p>
              <p className="mt-2 text-sm leading-6 text-primary-foreground/85">
                Results are held in backend memory right now, so the UI reflects current-session benchmark history.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score comparison</CardTitle>
            <CardDescription>Overall benchmark scores for the most recent evaluated runs.</CardDescription>
          </CardHeader>
          <CardContent>
            {scoreChart.length > 0 ? (
              <ScoreComparisonChart data={scoreChart} />
            ) : (
              <EmptyState title="No score data" description="Run benchmarks to populate comparison charts." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Benchmark history</CardTitle>
            <CardDescription>Recent score movement over time for the latest recorded evaluations.</CardDescription>
          </CardHeader>
          <CardContent>
            {historyChart.length > 0 ? (
              <BenchmarkHistoryChart data={historyChart} />
            ) : (
              <EmptyState title="No history yet" description="Benchmark history will appear once runs are evaluated." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
