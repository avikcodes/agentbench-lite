"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function ReasoningViewer({
  content,
  stepNumber,
  expanded,
}: {
  content: string;
  stepNumber: number;
  expanded: boolean;
}) {
  const [open, setOpen] = useState(expanded);

  return (
    <div className="rounded-2xl border border-border/60 bg-secondary/40">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {open ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        Reasoning (Step {stepNumber})
      </button>
      {open ? (
        <div className="border-t border-border/40 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/88">{content}</p>
        </div>
      ) : null}
    </div>
  );
}
