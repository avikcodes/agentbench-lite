"use client";

import { Filter, AlertCircle, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";

export type FilterState = {
  tools: string[];
  errorsOnly: boolean;
  expanded: "all" | "none";
};

export function TraceFilters({
  availableTools,
  filters,
  onChange,
}: {
  availableTools: string[];
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}) {
  const hasActiveFilters = filters.tools.length > 0 || filters.errorsOnly;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableTools.map((tool) => {
            const active = filters.tools.includes(tool);
            return (
              <button
                key={tool}
                type="button"
                onClick={() => {
                  const next = active
                    ? filters.tools.filter((t) => t !== tool)
                    : [...filters.tools, tool];
                  onChange({ ...filters, tools: next });
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary",
                )}
              >
                {titleCase(tool)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...filters, errorsOnly: !filters.errorsOnly })}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition",
              filters.errorsOnly
                ? "border-rose-300 bg-rose-50 text-rose-700"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            <AlertCircle className="size-3" />
            Errors only
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => onChange({ ...filters, expanded: filters.expanded === "all" ? "none" : "all" })}
          >
            {filters.expanded === "all" ? "Collapse all" : "Expand all"}
          </Button>

          {hasActiveFilters ? (
            <Button variant="ghost" size="xs" onClick={() => onChange({ tools: [], errorsOnly: false, expanded: filters.expanded })}>
              <X className="mr-1 size-3" />
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Active filters:</span>
          {filters.tools.map((tool) => (
            <Badge key={tool} variant="default">
              {titleCase(tool)}
            </Badge>
          ))}
          {filters.errorsOnly ? <Badge variant="destructive">Errors only</Badge> : null}
        </div>
      ) : null}
    </Card>
  );
}
