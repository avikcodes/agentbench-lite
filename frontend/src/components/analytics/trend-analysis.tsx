"use client";

import { TrendingUp } from "lucide-react";

import { TrendLineChart } from "@/components/shared/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import { useBenchmarkRefresh } from "@/hooks/use-benchmark-refresh";
import { dashboardApi } from "@/services/dashboard";

export function TrendAnalysis() {
  const allResults = useApiQuery("benchmark-results", () => dashboardApi.getBenchmarkResults());
  const trends = useApiQuery("trends", () => dashboardApi.getTrendAnalysis());

  useBenchmarkRefresh(() => {
    void allResults.refetch();
    void trends.refetch();
  });

  if (trends.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading trends...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (trends.error) {
    return <ErrorState message={trends.error} onRetry={() => void trends.refetch()} />;
  }

  if (!trends.data || trends.data.scores.length === 0) {
    return (
      <EmptyState
        title="No trend data"
        description="Complete multiple benchmark runs to see performance trends over time."
      />
    );
  }

  const scoreData = trends.data.scores.map((d) => ({
    name: d.benchmark_id.slice(0, 8),
    value: d.score,
  }));

  const passRateData = trends.data.pass_rates.map((d) => ({
    name: d.benchmark_id.slice(0, 8),
    value: d.pass_rate,
  }));

  const latencyData = trends.data.latencies.map((d) => ({
    name: d.benchmark_id.slice(0, 8),
    value: d.latency,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" />
          <CardTitle>Trend Analysis</CardTitle>
        </div>
        <CardDescription>
          Track benchmark progression over time for scores, pass rates, and latency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Score trend</CardTitle>
              <CardDescription>Overall scores over time</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={scoreData}
                dataKey="value"
                formatter={(v) => `${(v * 100).toFixed(1)}%`}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pass rate trend</CardTitle>
              <CardDescription>Task pass rate over time</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={passRateData}
                dataKey="value"
                color="var(--chart-3)"
                formatter={(v) => `${(v * 100).toFixed(1)}%`}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Latency trend</CardTitle>
              <CardDescription>Average latency over time</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendLineChart
                data={latencyData}
                dataKey="value"
                color="var(--chart-4)"
                formatter={(v) => `${v.toFixed(2)}s`}
              />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
