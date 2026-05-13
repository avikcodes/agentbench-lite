"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Play, RefreshCcw, RotateCcw } from "lucide-react";

import { BenchmarkCompletionSummary } from "@/components/benchmark/benchmark-completion-summary";
import { BenchmarkStatusCards } from "@/components/benchmark/benchmark-status-cards";
import { ExecutionErrorAlert } from "@/components/benchmark/execution-error-alert";
import { ExecutionProgressTracker } from "@/components/benchmark/execution-progress-tracker";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBenchmarkExecution } from "@/hooks/use-benchmark-execution";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDate, formatMs, formatScore, titleCase } from "@/lib/format";
import { dashboardApi } from "@/services/dashboard";
import type { AgentModelConfig, BenchmarkTask } from "@/types/api";

const defaultConfig: AgentModelConfig = {
  provider: "groq",
  model_name: "",
  temperature: 0.2,
  max_tokens: 512,
  max_steps: 5,
  retry_limit: 2,
};

export function BenchmarkRunner() {
  const models = useApiQuery("run-models", dashboardApi.getModels);
  const datasets = useApiQuery("run-datasets", dashboardApi.getDatasets);
  const tools = useApiQuery("run-tools", dashboardApi.getTools);
  const execution = useBenchmarkExecution();

  const [selectedDataset, setSelectedDataset] = useState("");
  const [config, setConfig] = useState<AgentModelConfig>(defaultConfig);
  const [tasks, setTasks] = useState<BenchmarkTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskReloadSeed, setTaskReloadSeed] = useState(0);

  const effectiveConfig = useMemo(() => {
    if (config.model_name) {
      return config;
    }

    const firstModel = models.data?.[0];
    if (!firstModel) {
      return config;
    }

    return {
      ...config,
      provider: firstModel.provider,
      model_name: firstModel.model_name,
    };
  }, [config, models.data]);

  const effectiveDataset = selectedDataset || datasets.data?.[0]?.dataset_id || "";

  useEffect(() => {
    if (!effectiveDataset) {
      return;
    }

    async function loadTasks() {
      setLoadingTasks(true);
      setTaskError(null);

      try {
        const nextTasks = await dashboardApi.getDatasetTasks(effectiveDataset);
        setTasks(nextTasks);
      } catch (error) {
        setTaskError(error instanceof Error ? error.message : "Unable to load tasks.");
      } finally {
        setLoadingTasks(false);
      }
    }

    void loadTasks();
  }, [effectiveDataset, taskReloadSeed]);

  const selectedModel = (models.data ?? []).find(
    (model) =>
      model.model_name === effectiveConfig.model_name && model.provider === effectiveConfig.provider,
  );

  const run = execution.run;
  const taskStates = useMemo(() => run?.task_states ?? [], [run]);
  const failedTasks = useMemo(
    () => taskStates.filter((task) => task.status === "failed"),
    [taskStates],
  );

  async function handleStartRun() {
    if (!effectiveDataset || !effectiveConfig.model_name || tasks.length === 0) {
      return;
    }

    await execution.startRun({
      datasetId: effectiveDataset,
      model: effectiveConfig,
    });
  }

  async function handleRetryFailedTasks() {
    await execution.retryFailedTasks();
  }

  if (models.isLoading || datasets.isLoading || tools.isLoading) {
    return <PageSkeleton />;
  }

  if (models.error || datasets.error || tools.error) {
    return (
      <ErrorState
        message={models.error ?? datasets.error ?? tools.error ?? "Unknown error"}
        onRetry={() => {
          void models.refetch();
          void datasets.refetch();
          void tools.refetch();
        }}
      />
    );
  }

  const enabledModels = (models.data ?? []).filter((model) => model.enabled);

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Execution Lab"
        title="Run a benchmark suite"
        description="Launch a full benchmark workflow from one form submission, then follow execution, evaluation, replay generation, and result publication live."
        actions={
          <>
            <Button variant="outline" onClick={() => void datasets.refetch()}>
              <RefreshCcw className="size-4" />
              Refresh data
            </Button>
            <Button disabled={execution.isActive || !selectedModel?.enabled} onClick={() => void handleStartRun()}>
              <Play className="size-4" />
              Run benchmark
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Benchmark configuration</CardTitle>
            <CardDescription>
              The payload below is mapped directly to the backend benchmark lifecycle API.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Provider</span>
              <Select
                value={effectiveConfig.provider}
                onChange={(event) => {
                  const provider = event.target.value as AgentModelConfig["provider"];
                  const firstModel =
                    enabledModels.find((model) => model.provider === provider) ??
                    models.data?.find((model) => model.provider === provider);
                  setConfig((current) => ({
                    ...current,
                    provider,
                    model_name: firstModel?.model_name ?? "",
                  }));
                }}
              >
                {Array.from(new Set((models.data ?? []).map((model) => model.provider))).map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Model</span>
              <Select
                value={effectiveConfig.model_name}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    model_name: event.target.value,
                  }))
                }
              >
                {(models.data ?? [])
                  .filter((model) => model.provider === config.provider)
                  .map((model) => (
                    <option key={`${model.provider}-${model.model_name}`} value={model.model_name}>
                      {model.model_name} {model.enabled ? "" : "(disabled)"}
                    </option>
                  ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Dataset</span>
              <Select value={effectiveDataset} onChange={(event) => setSelectedDataset(event.target.value)}>
                {(datasets.data ?? []).map((dataset) => (
                  <option key={dataset.dataset_id} value={dataset.dataset_id}>
                    {dataset.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Temperature</span>
              <Input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={config.temperature}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    temperature: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Max tokens</span>
              <Input
                type="number"
                min={1}
                max={4096}
                value={config.max_tokens}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    max_tokens: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Max steps</span>
              <Input
                type="number"
                min={1}
                max={10}
                value={config.max_steps}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    max_steps: Number(event.target.value),
                  }))
                }
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium">Retry limit</span>
              <Input
                type="number"
                min={0}
                max={5}
                value={config.retry_limit}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    retry_limit: Number(event.target.value),
                  }))
                }
              />
            </label>

            <div className="rounded-2xl bg-secondary/70 p-4">
              <p className="text-sm font-medium">Current run target</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  {run?.model_name ?? selectedModel?.description ?? "Choose a model"}
                </span>
                <StatusBadge status={run?.status ?? (selectedModel?.enabled ? "healthy" : "disabled")} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dataset preview</CardTitle>
            <CardDescription>Inspect tasks and tool constraints before launching the run.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingTasks ? (
              <PageSkeleton />
            ) : taskError ? (
              <ErrorState message={taskError} onRetry={() => setTaskReloadSeed((value) => value + 1)} />
            ) : tasks.length === 0 ? (
              <EmptyState title="No tasks found" description="This dataset does not currently contain benchmark tasks." />
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-secondary/70 p-4">
                    <p className="text-sm text-muted-foreground">Tasks</p>
                    <p className="mt-2 text-2xl font-semibold">{tasks.length}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/70 p-4">
                    <p className="text-sm text-muted-foreground">Tool-enabled tasks</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {tasks.filter((task) => task.allowed_tools.length > 0).length}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-secondary/70 p-4">
                    <p className="text-sm text-muted-foreground">Available tools</p>
                    <p className="mt-2 text-2xl font-semibold">{tools.data?.length ?? 0}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Difficulty</TableHead>
                        <TableHead>Allowed tools</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((task) => (
                        <TableRow key={task.task_id}>
                          <TableCell className="font-medium">{task.task_id}</TableCell>
                          <TableCell>{titleCase(task.category)}</TableCell>
                          <TableCell>{titleCase(task.difficulty)}</TableCell>
                          <TableCell>
                            {task.allowed_tools.length > 0 ? task.allowed_tools.join(", ") : "None"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live execution status</CardTitle>
          <CardDescription>
            Polling stays active while the backend processes tasks, evaluates outputs, writes traces, and stores analytics-ready benchmark results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ExecutionProgressTracker progress={execution.progress} run={run ?? null} />
          <BenchmarkStatusCards run={run ?? null} />

          {execution.error ? (
            <ExecutionErrorAlert
              message={execution.error}
              onRetry={failedTasks.length > 0 ? () => void handleRetryFailedTasks() : undefined}
            />
          ) : null}

          {run?.failure_message ? (
            <ExecutionErrorAlert
              message={run.failure_message}
              onRetry={failedTasks.length > 0 ? () => void handleRetryFailedTasks() : undefined}
            />
          ) : null}

          {run?.status === "completed" ? <BenchmarkCompletionSummary run={run} /> : null}

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Run ID: {run?.run_id ?? "Not started"}</span>
            {run?.current_task_id ? <span>Active task: {run.current_task_id}</span> : null}
            {run?.started_at ? <span>Started: {formatDate(run.started_at)}</span> : null}
            {run?.completed_at ? <span>Completed: {formatDate(run.completed_at)}</span> : null}
            {failedTasks.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                disabled={execution.isActive}
                onClick={() => void handleRetryFailedTasks()}
              >
                <RotateCcw className="size-4" />
                Retry failed tasks
              </Button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Execution</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Latency</TableHead>
                  <TableHead>Replay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(taskStates.length > 0
                  ? taskStates
                  : tasks.map((task) => ({
                      task_id: task.task_id,
                      status: "queued",
                      execution_id: null,
                      score: null,
                      latency: null,
                      replay_url: null,
                      error_message: null,
                    }))).map((task) => (
                  <TableRow key={task.task_id}>
                    <TableCell className="font-medium">
                      <div>{task.task_id}</div>
                      {"category" in task && task.category ? (
                        <div className="text-xs text-muted-foreground">{titleCase(task.category)}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {task.execution_id ?? task.error_message ?? "Pending"}
                    </TableCell>
                    <TableCell>{task.score !== null ? formatScore(task.score) : "--"}</TableCell>
                    <TableCell>{task.latency !== null ? formatMs(task.latency) : "--"}</TableCell>
                    <TableCell>
                      {task.replay_url ? (
                        <Link className="text-primary hover:underline" href={task.replay_url}>
                          Open replay
                        </Link>
                      ) : (
                        "--"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
