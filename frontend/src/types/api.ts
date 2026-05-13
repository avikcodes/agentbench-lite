export type ModelProviderName = "groq" | "openrouter";

export type DifficultyLevel = "easy" | "medium" | "hard";

export type DatasetSummary = {
  dataset_id: string;
  name: string;
  description: string;
  total_tasks: number;
};

export type BenchmarkTask = {
  task_id: string;
  category: string;
  question: string;
  expected_answer: string;
  allowed_tools: string[];
  difficulty: DifficultyLevel;
};

export type ModelMetadata = {
  provider: ModelProviderName;
  model_name: string;
  description: string;
  enabled: boolean;
  base_url: string;
  timeout_seconds: number;
};

export type ToolMetadata = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
};

export type AgentModelConfig = {
  provider: ModelProviderName;
  model_name: string;
  temperature: number;
  max_tokens: number;
  max_steps: number;
  retry_limit: number;
};

export type BenchmarkTaskExecutionRequest = {
  model: AgentModelConfig;
};

export type BenchmarkRunRequest = {
  dataset_id: string;
  model: AgentModelConfig;
};

export type ExecutionTraceStep = {
  step_number: number;
  reasoning_step: string;
  selected_tool: string | null;
  tool_input: Record<string, unknown>;
  tool_output: Record<string, unknown>;
  started_at: string;
  completed_at: string;
  latency: number;
  status: "success" | "error";
  error_message: string | null;
};

export type AgentExecutionResult = {
  execution_id: string;
  task_id: string;
  model_used: string;
  final_answer: string;
  success_status: boolean;
  execution_trace: ExecutionTraceStep[];
  total_latency: number;
  tools_used: string[];
  error_message: string | null;
};

export type EvaluationMetric = {
  metric_name: string;
  value: number;
  weight: number;
  normalized: boolean;
  details?: Record<string, unknown> | null;
};

export type MetricBreakdown = {
  metrics: Record<string, EvaluationMetric>;
  overall_score: number;
};

export type FailureDetail = {
  failure_type: string;
  description: string;
  step_number: number | null;
  details?: Record<string, unknown> | null;
};

export type FailureAnalysis = {
  has_failures: boolean;
  failures: FailureDetail[];
  primary_failure: string;
  failure_count: number;
};

export type TaskEvaluationResult = {
  task_id: string;
  execution_id: string;
  category: string | null;
  difficulty: string | null;
  metric_breakdown: MetricBreakdown;
  failure_analysis: FailureAnalysis;
  passed: boolean;
  score: number;
  evaluated_at: string;
};

export type ExecutionStatistics = {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  average_latency: number;
  total_latency: number;
  average_steps: number;
  total_steps: number;
  total_tool_calls: number;
  average_tool_calls: number;
  total_retries: number;
  average_retries: number;
  hallucination_count: number;
  timeout_count: number;
  crash_count: number;
};

export type BenchmarkSummary = {
  benchmark_id: string;
  model_name: string | null;
  total_tasks: number;
  passed_tasks: number;
  failed_tasks: number;
  pass_rate: number;
  average_score: number;
  weighted_score: number;
  execution_statistics: ExecutionStatistics;
  generated_at: string;
};

export type BenchmarkEvaluationResult = {
  benchmark_id: string;
  model_name: string;
  dataset_id?: string | null;
  execution_ids: string[];
  task_results: TaskEvaluationResult[];
  metric_breakdown: MetricBreakdown;
  overall_score: number;
  benchmark_summary: BenchmarkSummary;
  execution_statistics: ExecutionStatistics;
  failure_analysis: FailureAnalysis;
  evaluation_timestamp: string;
};

export type EvaluateBenchmarkRunRequest = {
  execution_ids: string[];
  model_name: string;
  dataset_id?: string;
};

export type HealthResponse = {
  status: string;
};

export type AppApiError = {
  detail?: string;
};

export type BenchmarkRunStatus =
  | "queued"
  | "running"
  | "evaluating"
  | "completed"
  | "failed";

export type RunTaskStatus = BenchmarkRunStatus;

export type RunTaskItem = {
  taskId: string;
  category: string;
  status: RunTaskStatus;
  executionId?: string;
  latency?: number;
  error?: string | null;
};

export type ExecutionTraceResponse = {
  execution_id: string;
  task_id: string;
  execution_trace: ExecutionTraceStep[];
};

export type AnalyticsSummary = {
  total_benchmarks: number;
  total_executions: number;
  average_score: number;
  average_pass_rate: number;
  total_tool_calls: number;
  average_latency: number;
  score_distribution: { range: string; count: number }[];
  failure_distribution: { failure_type: string; count: number }[];
  tool_usage_distribution: { tool_name: string; count: number }[];
  model_performance: { model_name: string; average_score: number; total_runs: number }[];
  generated_at: string;
};

export type TrendDataPoint = {
  benchmark_id: string;
  evaluated_at: string;
  score: number;
  pass_rate: number;
  latency: number;
};

export type TrendAnalysis = {
  scores: TrendDataPoint[];
  pass_rates: TrendDataPoint[];
  latencies: TrendDataPoint[];
  model_name: string | null;
};

export type CompareBenchmarksRequest = {
  benchmark_ids: string[];
};

export type CompareBenchmarkRanking = {
  rank: number;
  model_name: string;
  weighted_score: number;
  average_score: number;
  pass_rate: number;
  total_tasks: number;
  passed_tasks: number;
};

export type EvaluationComparisonResult = {
  benchmark_id: string;
  results: BenchmarkEvaluationResult[];
  ranking: CompareBenchmarkRanking[];
  generated_at: string;
};

export type DatasetWithTasks = DatasetSummary & {
  tasks: BenchmarkTask[];
};

export type BenchmarkRunTaskState = {
  task_id: string;
  category: string;
  difficulty: DifficultyLevel;
  status: BenchmarkRunStatus;
  execution_id: string | null;
  replay_url: string | null;
  latency: number | null;
  passed: boolean | null;
  score: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  evaluated_at: string | null;
};

export type BenchmarkRunSummary = {
  total_tasks: number;
  queued_tasks: number;
  running_tasks: number;
  evaluating_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  completion_rate: number;
};

export type BenchmarkRunState = {
  run_id: string;
  dataset_id: string;
  dataset_name: string;
  model_name: string;
  model_config: AgentModelConfig;
  status: BenchmarkRunStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  current_task_id: string | null;
  benchmark_id: string | null;
  execution_ids: string[];
  failure_message: string | null;
  summary: BenchmarkRunSummary;
  task_states: BenchmarkRunTaskState[];
  benchmark_result: BenchmarkEvaluationResult | null;
};
