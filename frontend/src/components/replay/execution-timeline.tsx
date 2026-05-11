"use client";

import { List } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ReplayCard } from "@/components/replay/replay-card";
import type { ExecutionTraceStep } from "@/types/api";

export function ExecutionTimeline({
  steps,
  filteredSteps,
  expanded,
}: {
  steps: ExecutionTraceStep[];
  filteredSteps: ExecutionTraceStep[];
  expanded: boolean;
}) {
  if (steps.length === 0) {
    return (
      <EmptyState
        title="No execution trace"
        description="This execution does not contain any trace steps."
      />
    );
  }

  if (filteredSteps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-16">
        <List className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No steps match the current filters.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[15px] top-0 bottom-8 w-px bg-border/60" />
      <div className="space-y-1">
        {filteredSteps.map((step) => (
          <ReplayCard key={step.step_number} step={step} expanded={expanded} />
        ))}
      </div>
    </div>
  );
}
