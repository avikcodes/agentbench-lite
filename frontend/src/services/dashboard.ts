import { apiGet, apiPost } from "@/services/http";
import type {
  AgentExecutionResult,
  AnalyticsSummary,
  BenchmarkRunRequest,
  BenchmarkRunState,
  BenchmarkEvaluationResult,
  BenchmarkTask,
  BenchmarkTaskExecutionRequest,
  CompareBenchmarksRequest,
  DatasetSummary,
  EvaluateBenchmarkRunRequest,
  EvaluationComparisonResult,
  ExecutionTraceResponse,
  HealthResponse,
  ModelMetadata,
  TaskEvaluationResult,
  ToolMetadata,
  TrendAnalysis,
} from "@/types/api";

export const dashboardApi = {
  getHealth: () => apiGet<HealthResponse>("/api/health"),
  getModels: () => apiGet<ModelMetadata[]>("/api/models"),
  getDatasets: () => apiGet<DatasetSummary[]>("/api/benchmarks/datasets"),
  getDatasetTasks: (datasetId: string) =>
    apiGet<BenchmarkTask[]>(`/api/benchmarks/datasets/${datasetId}/tasks`),
  createBenchmarkRun: (body: BenchmarkRunRequest) =>
    apiPost<BenchmarkRunState, BenchmarkRunRequest>("/api/benchmarks/runs", body, {
      timeoutMs: 20000,
    }),
  getBenchmarkRun: (runId: string) =>
    apiGet<BenchmarkRunState>(`/api/benchmarks/runs/${runId}`, {
      timeoutMs: 10000,
      retries: 2,
    }),
  getBenchmarkRunStatus: (runId: string) =>
    apiGet<BenchmarkRunState>(`/api/benchmarks/runs/${runId}/status`, {
      timeoutMs: 10000,
      retries: 2,
    }),
  retryBenchmarkRun: (runId: string) =>
    apiPost<BenchmarkRunState, Record<string, never>>(
      `/api/benchmarks/runs/${runId}/retry`,
      {},
      { timeoutMs: 20000 },
    ),
  getTools: () => apiGet<ToolMetadata[]>("/api/tools"),
  getBenchmarkResults: () =>
    apiGet<BenchmarkEvaluationResult[]>("/api/evaluations/benchmarks"),
  getBenchmarkResult: (benchmarkId: string) =>
    apiGet<BenchmarkEvaluationResult>(`/api/evaluations/benchmarks/${benchmarkId}`),
  runBenchmarkTask: (
    datasetId: string,
    taskId: string,
    body: BenchmarkTaskExecutionRequest,
  ) =>
    apiPost<AgentExecutionResult, BenchmarkTaskExecutionRequest>(
      `/api/executions/benchmarks/${datasetId}/tasks/${taskId}`,
      body,
    ),
  evaluateBenchmarkRun: (body: EvaluateBenchmarkRunRequest) =>
    apiPost<BenchmarkEvaluationResult, EvaluateBenchmarkRunRequest>(
      "/api/evaluations/benchmarks/runs",
      body,
    ),

  getExecutionResult: (executionId: string) =>
    apiGet<AgentExecutionResult>(`/api/executions/${executionId}`),

  getExecutionTrace: (executionId: string) =>
    apiGet<ExecutionTraceResponse>(`/api/executions/${executionId}/trace`),

  getTaskEvaluation: (executionId: string) =>
    apiGet<TaskEvaluationResult>(`/api/evaluations/tasks/${executionId}`),

  getAnalyticsSummary: () =>
    apiGet<AnalyticsSummary>("/api/analytics/summary"),

  compareBenchmarks: (body: CompareBenchmarksRequest) =>
    apiPost<EvaluationComparisonResult, CompareBenchmarksRequest>(
      "/api/analytics/compare",
      body,
    ),

  getTrendAnalysis: (modelName?: string) =>
    apiGet<TrendAnalysis>(
      `/api/analytics/trends${modelName ? `?model_name=${encodeURIComponent(modelName)}` : ""}`,
    ),

  downloadExport: async (url: string, filename: string) => {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Download failed.");
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  },
};
