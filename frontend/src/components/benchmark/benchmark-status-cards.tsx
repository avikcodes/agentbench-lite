"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { BenchmarkRunState } from "@/types/api";

export function BenchmarkStatusCards({
  run,
}: {
  run: BenchmarkRunState | null;
}) {
  const summary = run?.summary;

  const items = [
    { label: "Queued", value: summary?.queued_tasks ?? 0 },
    { label: "Running", value: summary?.running_tasks ?? 0 },
    { label: "Evaluating", value: summary?.evaluating_tasks ?? 0 },
    { label: "Completed", value: summary?.completed_tasks ?? 0 },
    { label: "Failed", value: summary?.failed_tasks ?? 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
