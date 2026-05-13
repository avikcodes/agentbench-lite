const BENCHMARK_RUN_COMPLETED = "agentbench:run-completed";

export type BenchmarkRunCompletedDetail = {
  runId: string;
  benchmarkId: string | null;
};

export function notifyBenchmarkRunCompleted(detail: BenchmarkRunCompletedDetail) {
  window.dispatchEvent(new CustomEvent(BENCHMARK_RUN_COMPLETED, { detail }));
}

export function subscribeToBenchmarkRunCompleted(
  listener: (detail: BenchmarkRunCompletedDetail) => void,
) {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<BenchmarkRunCompletedDetail>;
    listener(customEvent.detail);
  };

  window.addEventListener(BENCHMARK_RUN_COMPLETED, handler);
  return () => window.removeEventListener(BENCHMARK_RUN_COMPLETED, handler);
}
