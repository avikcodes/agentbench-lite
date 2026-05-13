"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ExecutionErrorAlert({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <div className="space-y-2">
          <p className="text-sm font-semibold">Execution issue detected</p>
          <p className="text-sm">{message}</p>
          {onRetry ? (
            <Button variant="outline" onClick={onRetry}>
              Retry failed tasks
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
