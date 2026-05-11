"use client";

import { useMemo, useState, useCallback } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { ExecutionTimeline } from "@/components/replay/execution-timeline";
import { MetadataSidebar } from "@/components/replay/metadata-sidebar";
import { TraceFilters, type FilterState } from "@/components/replay/trace-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useApiQuery } from "@/hooks/use-api-query";
import { dashboardApi } from "@/services/dashboard";

export function ReplayViewer({ executionId }: { executionId: string }) {
  const execution = useApiQuery(`execution-${executionId}`, () =>
    dashboardApi.getExecutionResult(executionId),
  );
  const evaluation = useApiQuery(`evaluation-${executionId}`, () =>
    dashboardApi.getTaskEvaluation(executionId).catch(() => null),
  );

  const [filters, setFilters] = useState<FilterState>({
    tools: [],
    errorsOnly: false,
    expanded: "none",
  });

  const handleFilterChange = useCallback((next: FilterState) => {
    setFilters(next);
  }, []);

  const filteredSteps = useMemo(() => {
    if (!execution.data) return [];
    let steps = execution.data.execution_trace;

    if (filters.tools.length > 0) {
      steps = steps.filter(
        (s) => s.selected_tool && filters.tools.includes(s.selected_tool),
      );
    }

    if (filters.errorsOnly) {
      steps = steps.filter((s) => s.status === "error");
    }

    return steps;
  }, [execution.data, filters]);

  const availableTools = useMemo(() => {
    if (!execution.data) return [];
    const tools = new Set<string>();
    execution.data.execution_trace.forEach((s) => {
      if (s.selected_tool) tools.add(s.selected_tool);
    });
    return Array.from(tools).sort();
  }, [execution.data]);

  if (execution.isLoading) {
    return <PageSkeleton />;
  }

  if (execution.error || !execution.data) {
    return (
      <ErrorState
        message={execution.error ?? "Execution not found."}
        onRetry={() => void execution.refetch()}
      />
    );
  }

  const errorCount = execution.data.execution_trace.filter(
    (s) => s.status === "error",
  ).length;

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Execution Replay"
        title={`Replay: ${execution.data.execution_id.slice(0, 8)}...`}
        description={`Trace replay for task "${execution.data.task_id}" using ${execution.data.model_used}.`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={execution.data.success_status ? "success" : "destructive"}>
              {execution.data.success_status ? "Passed" : "Failed"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {execution.data.execution_trace.length} steps
            </span>
            {errorCount > 0 ? (
              <Badge variant="destructive">{errorCount} error{errorCount > 1 ? "s" : ""}</Badge>
            ) : null}
          </div>
        }
      />

      <TraceFilters
        availableTools={availableTools}
        filters={filters}
        onChange={handleFilterChange}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <ExecutionTimeline
            steps={execution.data.execution_trace}
            filteredSteps={filteredSteps}
            expanded={filters.expanded === "all"}
          />
        </div>

        <div className="min-w-0">
          <MetadataSidebar
            execution={execution.data}
            evaluation={evaluation.data}
          />
        </div>
      </div>
    </div>
  );
}
