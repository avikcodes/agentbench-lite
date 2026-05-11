import { ResultDetail } from "@/components/results/result-detail";

export default async function ResultDetailPage({
  params,
}: {
  params: Promise<{ benchmarkId: string }>;
}) {
  const { benchmarkId } = await params;

  return <ResultDetail benchmarkId={benchmarkId} />;
}
