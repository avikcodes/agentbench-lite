import { ReplayViewer } from "@/components/replay/replay-viewer";

export default async function ReplayDetailPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = await params;

  return <ReplayViewer executionId={executionId} />;
}
