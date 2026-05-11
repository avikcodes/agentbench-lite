"use client";

import { Clock } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ReasoningViewer } from "@/components/replay/reasoning-viewer";
import { ToolCallViewer } from "@/components/replay/tool-call-viewer";
import { formatMs } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ExecutionTraceStep } from "@/types/api";

export function ReplayCard({
  step,
  expanded,
}: {
  step: ExecutionTraceStep;
  expanded: boolean;
}) {
  const isError = step.status === "error";
  const isFinalStep = step.selected_tool === null;

  return (
    <div className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
            isError
              ? "border-rose-300 bg-rose-50 text-rose-700"
              : "border-primary/30 bg-primary/5 text-primary",
          )}
        >
          {step.step_number}
        </div>
      </div>

      <div className="min-w-0 flex-1 pb-8">
        <Card className={cn(isError ? "border-rose-200" : "")}>
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Step {step.step_number}</span>
                {isFinalStep ? (
                  <Badge variant="default">Final answer</Badge>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {isError ? <Badge variant="destructive">Failed</Badge> : <Badge variant="success">Success</Badge>}
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {formatMs(step.latency)}
                </span>
              </div>
            </div>

            <ReasoningViewer content={step.reasoning_step} stepNumber={step.step_number} expanded={expanded} />

            <ToolCallViewer
              toolName={step.selected_tool}
              toolInput={step.tool_input}
              toolOutput={step.tool_output}
              expanded={expanded}
              hasError={isError}
            />

            {step.error_message ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/60 px-4 py-3">
                <p className="text-xs font-semibold tracking-wide text-rose-700 uppercase">Error</p>
                <p className="mt-1 text-sm text-rose-600">{step.error_message}</p>
              </div>
            ) : null}

            {step.started_at ? (
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Start: {new Date(step.started_at).toLocaleTimeString()}</span>
                <span>End: {new Date(step.completed_at).toLocaleTimeString()}</span>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}
