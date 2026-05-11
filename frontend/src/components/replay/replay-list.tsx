"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, Search } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDate, formatMs, formatPercent, titleCase } from "@/lib/format";
import { dashboardApi } from "@/services/dashboard";
import type { BenchmarkEvaluationResult } from "@/types/api";

function BenchmarkExecutionCard({
  result,
}: {
  result: BenchmarkEvaluationResult;
}) {
  const executionIds = result.task_results.map((t) => t.execution_id).filter(Boolean);

  if (executionIds.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>{result.benchmark_id}</CardTitle>
            <CardDescription>
              {result.model_name} &middot; {result.task_results.length} tasks &middot;{" "}
              {formatPercent(result.benchmark_summary.pass_rate)} pass rate
            </CardDescription>
          </div>
          <Badge variant={result.overall_score >= 0.5 ? "success" : "destructive"}>
            Score: {result.overall_score.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-48 space-y-1.5 overflow-y-auto">
          {result.task_results.map((task) => (
            <Link
              key={task.execution_id}
              href={`/replay/${task.execution_id}`}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 transition hover:bg-secondary/80"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Play className="size-3 shrink-0 text-primary" />
                <span className="truncate text-sm font-medium">{task.task_id}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{task.difficulty ? titleCase(task.difficulty) : ""}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={task.passed ? "success" : "destructive"}>
                  {task.passed ? "Pass" : "Fail"}
                </Badge>
                <span className="text-xs text-muted-foreground">{task.score.toFixed(2)}</span>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ReplayList() {
  const results = useApiQuery("benchmark-results", () => dashboardApi.getBenchmarkResults());

  const [searchId, setSearchId] = useState("");

  if (results.isLoading) {
    return <PageSkeleton />;
  }

  if (results.error) {
    return (
      <ErrorState
        message={results.error}
        onRetry={() => void results.refetch()}
      />
    );
  }

  const benchmarks = results.data ?? [];

  if (benchmarks.length === 0) {
    return (
      <div className="section-grid">
        <PageHeader
          eyebrow="Execution Replay"
          title="Replay Viewer"
          description="Select an execution to replay, or enter an execution ID directly."
        />
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Enter execution ID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="max-w-md"
                />
                {searchId.trim() ? (
                  <Link
                    href={`/replay/${searchId.trim()}`}
                    className={buttonVariants({ variant: "default", className: "no-underline" })}
                  >
                    <Search className="mr-2 size-4" />
                    View replay
                  </Link>
                ) : (
                  <Button disabled>
                    <Search className="mr-2 size-4" />
                    View replay
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          <EmptyState
            title="No executions available"
            description="Run a benchmark first to see execution traces here."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Execution Replay"
        title="Replay Viewer"
        description="Browse executions from completed benchmarks or enter an execution ID directly."
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Enter execution ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="max-w-md"
            />
            {searchId.trim() ? (
              <Link
                href={`/replay/${searchId.trim()}`}
                className={buttonVariants({ variant: "default", className: "no-underline" })}
              >
                <Search className="mr-2 size-4" />
                View replay
              </Link>
            ) : (
              <Button disabled>
                <Search className="mr-2 size-4" />
                View replay
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {benchmarks.map((result) => (
          <BenchmarkExecutionCard key={result.benchmark_id} result={result} />
        ))}
      </div>
    </div>
  );
}
