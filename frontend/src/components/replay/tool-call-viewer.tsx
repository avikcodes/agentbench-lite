"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Cpu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";

export function ToolCallViewer({
  toolName,
  toolInput,
  toolOutput,
  expanded,
  hasError,
}: {
  toolName: string | null;
  toolInput: Record<string, unknown>;
  toolOutput: Record<string, unknown>;
  expanded: boolean;
  hasError: boolean;
}) {
  const [open, setOpen] = useState(expanded);

  if (!toolName) return null;

  return (
    <div className={cn("rounded-2xl border", hasError ? "border-rose-200 bg-rose-50/40" : "border-border/60 bg-secondary/40")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <Cpu className={cn("size-4", hasError ? "text-rose-600" : "text-primary")} />
        <span className="text-sm font-medium">{titleCase(toolName)}</span>
        {open ? <ChevronDown className="ml-auto size-3 text-muted-foreground" /> : <ChevronRight className="ml-auto size-3 text-muted-foreground" />}
      </button>
      {open ? (
        <div className="border-t border-border/40 space-y-3 px-4 py-3">
          {Object.keys(toolInput).length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Input</p>
              <pre className="overflow-x-auto rounded-xl bg-background p-3 text-xs leading-5">{JSON.stringify(toolInput, null, 2)}</pre>
            </div>
          ) : null}
          {Object.keys(toolOutput).length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Output</p>
              <pre className={cn("overflow-x-auto rounded-xl bg-background p-3 text-xs leading-5", hasError ? "text-rose-600" : "")}>{JSON.stringify(toolOutput, null, 2)}</pre>
            </div>
          ) : null}
          {hasError ? (
            <Badge variant="destructive">Tool execution failed</Badge>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
