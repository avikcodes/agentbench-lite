"use client";

import { AccuracyChart, LatencyChart, ScoreComparisonChart } from "@/components/shared/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { useBenchmarkRefresh } from "@/hooks/use-benchmark-refresh";
import { formatMs, formatPercent, formatScore } from "@/lib/format";
import { dashboardApi } from "@/services/dashboard";

type AggregatedRow = {
  model: string;
  averageScore: number;
  passRate: number;
  latency: number;
  runs: number;
};

export function LeaderboardView() {
  const benchmarks = useApiQuery("leaderboard-benchmarks", dashboardApi.getBenchmarkResults);
  useBenchmarkRefresh(() => {
    void benchmarks.refetch();
  });

  if (benchmarks.isLoading) {
    return <PageSkeleton />;
  }

  if (benchmarks.error) {
    return <ErrorState message={benchmarks.error} onRetry={() => void benchmarks.refetch()} />;
  }

  const results = benchmarks.data ?? [];
  if (results.length === 0) {
    return <EmptyState title="No leaderboard data" description="Run evaluated benchmarks to generate model rankings." />;
  }

  const grouped = new Map<string, AggregatedRow>();
  for (const run of results) {
    const current = grouped.get(run.model_name) ?? {
      model: run.model_name,
      averageScore: 0,
      passRate: 0,
      latency: 0,
      runs: 0,
    };
    current.averageScore += run.overall_score;
    current.passRate += run.benchmark_summary.pass_rate;
    current.latency += run.execution_statistics.average_latency;
    current.runs += 1;
    grouped.set(run.model_name, current);
  }

  const rankings = Array.from(grouped.values())
    .map((row) => ({
      ...row,
      averageScore: row.averageScore / row.runs,
      passRate: row.passRate / row.runs,
      latency: row.latency / row.runs,
    }))
    .sort((a, b) => b.averageScore - a.averageScore);

  const scoreData = rankings.map((row) => ({ name: row.model.split("/").pop() ?? row.model, score: row.averageScore }));
  const accuracyData = rankings.map((row) => ({ name: row.model.split("/").pop() ?? row.model, accuracy: row.passRate * 100 }));
  const latencyData = rankings.map((row) => ({ name: row.model.split("/").pop() ?? row.model, latency: row.latency }));
  const fastest = rankings.slice().sort((a, b) => a.latency - b.latency);
  const mostReliable = rankings.slice().sort((a, b) => b.passRate - a.passRate);

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Leaderboard"
        title="Model rankings across benchmark runs"
        description="Compare models by mean overall score, average latency, and benchmark success rate using stored evaluation results."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Average scores</CardTitle>
            <CardDescription>Mean benchmark score per model.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreComparisonChart data={scoreData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Success rates</CardTitle>
            <CardDescription>Average pass rate across benchmark runs.</CardDescription>
          </CardHeader>
          <CardContent>
            <AccuracyChart data={accuracyData} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Latency rankings</CardTitle>
            <CardDescription>Lower values indicate faster task execution.</CardDescription>
          </CardHeader>
          <CardContent>
            <LatencyChart data={latencyData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Model leaderboard</CardTitle>
            <CardDescription>Ranked by average overall score.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Average score</TableHead>
                    <TableHead>Success rate</TableHead>
                    <TableHead>Latency</TableHead>
                    <TableHead>Runs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.map((row, index) => (
                    <TableRow key={row.model}>
                      <TableCell className="font-semibold">#{index + 1}</TableCell>
                      <TableCell className="font-medium">{row.model}</TableCell>
                      <TableCell>{formatScore(row.averageScore)}</TableCell>
                      <TableCell>{formatPercent(row.passRate)}</TableCell>
                      <TableCell>{formatMs(row.latency)}</TableCell>
                      <TableCell>{row.runs}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fastest models</CardTitle>
            <CardDescription>Sorted by average latency.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {fastest.map((row, index) => (
              <div key={row.model} className="rounded-2xl bg-secondary/70 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    #{index + 1} {row.model}
                  </p>
                  <p className="text-sm text-muted-foreground">{formatMs(row.latency)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Most reliable models</CardTitle>
          <CardDescription>Ranked by average task success rate across benchmark runs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mostReliable.map((row, index) => (
            <div key={row.model} className="rounded-2xl bg-secondary/70 p-4">
              <p className="text-sm text-muted-foreground">#{index + 1} by success rate</p>
              <p className="mt-2 text-lg font-semibold">{row.model}</p>
              <p className="mt-1 text-sm">{formatPercent(row.passRate)} success</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
