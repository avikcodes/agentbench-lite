"use client";

import { Progress } from "@/components/ui/progress";
import type { BenchmarkRunState } from "@/types/api";

export function ExecutionProgressTracker({
  progress,
  run,
}: {
  progress: number;
  run: BenchmarkRunState | null;
}) {
  return (
    <div className="space-y-3 rounded-2xl bg-secondary/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Execution progress</p>
          <p className="text-sm text-muted-foreground">
            {run
              ? `${run.summary.completed_tasks + run.summary.failed_tasks} of ${run.summary.total_tasks} tasks finished`
              : "Start a benchmark run to stream task updates."}
          </p>
        </div>
        <p className="text-lg font-semibold">{progress.toFixed(0)}%</p>
      </div>
      <Progress value={progress} />
    </div>
  );
}
