"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, RefreshCcw } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatMs, titleCase } from "@/lib/format";
import { dashboardApi } from "@/services/dashboard";
import type { AgentModelConfig, BenchmarkTask, RunTaskItem } from "@/types/api";

const defaultConfig: AgentModelConfig = {
  provider: "groq",
  model_name: "",
  temperature: 0.2,
  max_tokens: 512,
  max_steps: 5,
  retry_limit: 2,
};

export function BenchmarkRunner() {
  const router = useRouter();
  const models = useApiQuery("run-models", dashboardApi.getModels);
  const datasets = useApiQuery("run-datasets", dashboardApi.getDatasets);
  const tools = useApiQuery("run-tools", dashboardApi.getTools);

  const [selectedDataset, setSelectedDataset] = useState("");
  const [config, setConfig] = useState<AgentModelConfig>(defaultConfig);
  const [tasks, setTasks] = useState<BenchmarkTask[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<RunTaskItem[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [activeBenchmarkId, setActiveBenchmarkId] = useState<string | null>(null);
  const [taskReloadSeed, setTaskReloadSeed] = useState(0);

  useEffect(() => {
    const availableModels = models.data ?? [];
    if (availableModels.length > 0 && !config.model_name) {
      setConfig((current) => ({
        ...current,
        provider: availableModels[0].provider,
        model_name: availableModels[0].model_name,
      }));
    }
  }, [models.data, config.model_name]);

  useEffect(() => {
    const availableDatasets = datasets.data ?? [];
    if (availableDatasets.length > 0 && !selectedDataset) {
      setSelectedDataset(availableDatasets[0].dataset_id);
    }
  }, [datasets.data, selectedDataset]);

  useEffect(() => {
    if (!selectedDataset) {
      return;
    }

    async function loadTasks() {
      setLoadingTasks(true);
      setTaskError(null);

      try {
        const nextTasks = await dashboardApi.getDatasetTasks(selectedDataset);
        setTasks(nextTasks);
        setTaskStatuses(
          nextTasks.map((task) => ({
            taskId: task.task_id,
            category: task.category,
            status: "queued",
          })),
        );
      } catch (error) {
        setTaskError(error instanceof Error ? error.message : "Unable to load tasks.");
      } finally {
        setLoadingTasks(false);
      }
    }

    void loadTasks();
  }, [selectedDataset, taskReloadSeed]);

  const selectedModel = (models.data ?? []).find(
    (model) => model.model_name === config.model_name && model.provider === config.provider,
  );

  const progress =
    taskStatuses.length === 0
      ? 0
      : (taskStatuses.filter((task) => task.status === "success" || task.status === "error").length /
          taskStatuses.length) *
        100;

  async function runBenchmark() {
    if (!selectedDataset || !config.model_name || tasks.length === 0) {
      return;
    }

    setIsRunning(true);
    setRunError(null);
    setActiveBenchmarkId(null);
    const executionIds: string[] = [];

    setTaskStatuses((current) =>
      current.map((task) => ({
        ...task,
        status: "queued",
        executionId: undefined,
        latency: undefined,
        error: null,
      })),
    );

    try {
      for (const task of tasks) {
        setTaskStatuses((current) =>
          current.map((item) =>
            item.taskId === task.task_id ? { ...item, status: "running" } : item,
          ),
        );

        try {
          const execution = await dashboardApi.runBenchmarkTask(selectedDataset, task.task_id, {
            model: config,
          });

          executionIds.push(execution.execution_id);
          setTaskStatuses((current) =>
            current.map((item) =>
              item.taskId === task.task_id
                ? {
                    ...item,
                    status: execution.success_status ? "success" : "error",
                    executionId: execution.execution_id,
                    latency: execution.total_latency,
                    error: execution.error_message,
                  }
                : item,
            ),
          );
        } catch (error) {
          setTaskStatuses((current) =>
            current.map((item) =>
              item.taskId === task.task_id
                ? {
                    ...item,
                    status: "error",
                    error: error instanceof Error ? error.message : "Execution failed.",
                  }
                : item,
            ),
          );
        }
      }

      if (executionIds.length === 0) {
        throw new Error("No task executions completed successfully, so the benchmark could not be evaluated.");
      }

      const result = await dashboardApi.evaluateBenchmarkRun({
        execution_ids: executionIds,
        model_name: `${config.provider}/${config.model_name}`,
        dataset_id: selectedDataset,
      });

      setActiveBenchmarkId(result.benchmark_id);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Unable to complete benchmark run.");
    } finally {
      setIsRunning(false);
    }
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
        description="Choose a model, select a dataset, tune execution controls, and launch a full benchmark run with live per-task status updates."
        actions={
          <>
            <Button variant="outline" onClick={() => void datasets.refetch()}>
              <RefreshCcw className="size-4" />
              Refresh data
            </Button>
            <Button disabled={isRunning || !selectedModel?.enabled} onClick={() => void runBenchmark()}>
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
            <CardDescription>Execution controls are sent directly to the backend benchmark task runner.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium">Provider</span>
              <Select
                value={config.provider}
                onChange={(event) => {
                  const provider = event.target.value as AgentModelConfig["provider"];
                  const firstModel = enabledModels.find((model) => model.provider === provider) ?? models.data?.find((model) => model.provider === provider);
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
                value={config.model_name}
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
              <Select value={selectedDataset} onChange={(event) => setSelectedDataset(event.target.value)}>
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
              <p className="text-sm font-medium">Model availability</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{selectedModel?.description ?? "Choose a model"}</span>
                <StatusBadge status={selectedModel?.enabled ? "healthy" : "disabled"} />
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
          <CardDescription>Task-level updates appear here as the benchmark progresses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {runError ? (
            <ErrorState message={runError} />
          ) : null}

          {activeBenchmarkId ? (
            <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-800">
              <p className="text-sm font-semibold">Benchmark evaluation complete</p>
              <p className="mt-1 text-sm">
                Result stored as <span className="font-mono">{activeBenchmarkId}</span>.
              </p>
              <div className="mt-3">
                <Button variant="outline" onClick={() => router.push(`/results/${activeBenchmarkId}`)}>
                  View results
                </Button>
              </div>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Execution</TableHead>
                  <TableHead>Latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taskStatuses.map((task) => (
                  <TableRow key={task.taskId}>
                    <TableCell className="font-medium">{task.taskId}</TableCell>
                    <TableCell>{titleCase(task.category)}</TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {task.executionId ?? task.error ?? "Pending"}
                    </TableCell>
                    <TableCell>{task.latency ? formatMs(task.latency) : "--"}</TableCell>
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
