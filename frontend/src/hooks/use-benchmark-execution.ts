"use client";

import { useCallback, useMemo, useState } from "react";

import { useApiQuery } from "@/hooks/use-api-query";
import { notifyBenchmarkRunCompleted } from "@/services/live-updates";
import { dashboardApi } from "@/services/dashboard";
import type {
  AgentModelConfig,
  BenchmarkRunState,
  BenchmarkRunStatus,
} from "@/types/api";

type StartRunInput = {
  datasetId: string;
  model: AgentModelConfig;
};

const ACTIVE_STATUSES: BenchmarkRunStatus[] = ["queued", "running", "evaluating"];

export function useBenchmarkExecution() {
  const [runId, setRunId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [lastCompletedRunId, setLastCompletedRunId] = useState<string | null>(null);

  const runQuery = useApiQuery<BenchmarkRunState>(
    `benchmark-run-${runId ?? "idle"}`,
    () => dashboardApi.getBenchmarkRunStatus(runId ?? ""),
    {
      enabled: Boolean(runId),
      pollIntervalMs: runId ? 2000 : undefined,
      onSuccess: (result) => {
        if (
          result.status === "completed" &&
          result.run_id !== lastCompletedRunId
        ) {
          setLastCompletedRunId(result.run_id);
          notifyBenchmarkRunCompleted({
            runId: result.run_id,
            benchmarkId: result.benchmark_id,
          });
        }
      },
    },
  );

  const startRun = useCallback(async ({ datasetId, model }: StartRunInput) => {
    setRunError(null);

    try {
      const createdRun = await dashboardApi.createBenchmarkRun({
        dataset_id: datasetId,
        model,
      });
      setRunId(createdRun.run_id);
      runQuery.setData(createdRun);
      return createdRun;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start the benchmark run.";
      setRunError(message);
      throw error;
    }
  }, [runQuery]);

  const retryFailedTasks = useCallback(async () => {
    if (!runId) {
      return null;
    }

    setRunError(null);

    try {
      const retriedRun = await dashboardApi.retryBenchmarkRun(runId);
      runQuery.setData(retriedRun);
      return retriedRun;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to retry failed tasks.";
      setRunError(message);
      throw error;
    }
  }, [runId, runQuery]);

  const snapshot = runQuery.data;
  const isActive = snapshot ? ACTIVE_STATUSES.includes(snapshot.status) : false;

  const progress = useMemo(() => {
    if (!snapshot || snapshot.summary.total_tasks === 0) {
      return 0;
    }

    return snapshot.summary.completion_rate * 100;
  }, [snapshot]);

  return {
    runId,
    run: snapshot,
    progress,
    isActive,
    isLoading: runQuery.isLoading,
    error: runError ?? runQuery.error,
    startRun,
    retryFailedTasks,
    refetch: runQuery.refetch,
    setRunId,
  };
}
