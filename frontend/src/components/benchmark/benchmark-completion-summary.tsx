"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { BenchmarkRunState } from "@/types/api";

export function BenchmarkCompletionSummary({
  run,
}: {
  run: BenchmarkRunState;
}) {
  const result = run.benchmark_result;
  const replayExecutionId = run.task_states.find((task) => task.execution_id)?.execution_id;

  return (
    <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
      <p className="text-sm font-semibold">Benchmark run complete</p>
      <p className="mt-1 text-sm">
        {run.dataset_name} finished with {run.summary.completed_tasks} passing tasks and{" "}
        {run.summary.failed_tasks} failed tasks.
      </p>
      {result ? (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Overall score</p>
            <p className="mt-1 text-xl font-semibold">{(result.overall_score * 100).toFixed(1)}%</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass rate</p>
            <p className="mt-1 text-xl font-semibold">
              {(result.benchmark_summary.pass_rate * 100).toFixed(1)}%
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Benchmark ID</p>
            <p className="mt-1 font-mono text-sm">{result.benchmark_id}</p>
          </div>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {run.benchmark_id ? (
          <>
            <Link href={`/results/${run.benchmark_id}`}>
              <Button>View results</Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant="outline">Open leaderboard</Button>
            </Link>
            <Link href="/analytics">
              <Button variant="outline">Open analytics</Button>
            </Link>
          </>
        ) : null}
        {replayExecutionId ? (
          <Link href={`/replay/${replayExecutionId}`}>
            <Button variant="outline">Open replay</Button>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
