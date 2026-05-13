"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  TrendingUp,
} from "lucide-react";

import { ComparisonView } from "@/components/analytics/comparison-view";
import { ExportPanel } from "@/components/analytics/export-panel";
import { TrendAnalysis } from "@/components/analytics/trend-analysis";
import { DistributionPieChart, HorizontalBarChart } from "@/components/shared/charts";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { MetricCard } from "@/components/shared/metric-card";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/use-api-query";
import { useBenchmarkRefresh } from "@/hooks/use-benchmark-refresh";
import { dashboardApi } from "@/services/dashboard";

export function AnalyticsDashboard() {
  const summary = useApiQuery("analytics-summary", () => dashboardApi.getAnalyticsSummary());
  useBenchmarkRefresh(() => {
    void summary.refetch();
  });

  if (summary.isLoading) {
    return <PageSkeleton />;
  }

  if (summary.error || !summary.data) {
    return (
      <ErrorState
        message={summary.error ?? "Failed to load analytics."}
        onRetry={() => void summary.refetch()}
      />
    );
  }

  const s = summary.data;

  if (s.total_benchmarks === 0) {
    return (
      <div className="section-grid">
        <PageHeader
          eyebrow="Analytics"
          title="Analytics Dashboard"
          description="Overall analytics, trends, and benchmark comparison across all runs."
        />
        <EmptyState
          title="No analytics data"
          description="Run and evaluate benchmarks to populate analytics."
        />
      </div>
    );
  }

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Analytics"
        title="Analytics Dashboard"
        description="Overall analytics, trends, and benchmark comparison across all runs."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total benchmarks"
          value={String(s.total_benchmarks)}
          hint={`${s.total_executions} total executions across all runs`}
          icon={<BarChart3 className="size-4" />}
        />
        <MetricCard
          label="Average score"
          value={`${(s.average_score * 100).toFixed(1)}%`}
          hint="Mean overall score across all benchmarks"
          icon={<CheckCircle2 className="size-4" />}
        />
        <MetricCard
          label="Average pass rate"
          value={`${(s.average_pass_rate * 100).toFixed(1)}%`}
          hint="Mean task pass rate across all benchmarks"
          icon={<TrendingUp className="size-4" />}
        />
        <MetricCard
          label="Average latency"
          value={`${s.average_latency.toFixed(2)}s`}
          hint={`${s.total_tool_calls} total tool calls`}
          icon={<Clock className="size-4" />}
        />
      </div>

      {s.model_performance.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="size-4 text-primary" />
              <CardTitle>Model Performance</CardTitle>
            </div>
            <CardDescription>
              Average scores by model across all benchmark runs.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={s.model_performance.map((m) => ({
                name: m.model_name,
                value: m.average_score,
              }))}
              dataKey="value"
              formatter={(v) => `${(v * 100).toFixed(1)}%`}
            />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {s.score_distribution.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>How benchmark scores are distributed across ranges.</CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionPieChart
                data={s.score_distribution.map((d) => ({
                  name: d.range,
                  value: d.count,
                }))}
              />
            </CardContent>
          </Card>
        ) : null}

        {s.failure_distribution.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Failure Distribution</CardTitle>
              <CardDescription>Breakdown of failure types across all tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <DistributionPieChart
                data={s.failure_distribution.map((d) => ({
                  name: d.failure_type.replace(/_/g, " "),
                  value: d.count,
                }))}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <TrendAnalysis />

      <ComparisonView />

      <ExportPanel />
    </div>
  );
}
