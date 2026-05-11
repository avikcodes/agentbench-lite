import { Badge } from "@/components/ui/badge";
import type { RunTaskStatus } from "@/types/api";

export function StatusBadge({
  status,
}: {
  status: RunTaskStatus | "healthy" | "idle" | "disabled";
}) {
  if (status === "success" || status === "healthy") {
    return <Badge variant="success">{status}</Badge>;
  }

  if (status === "running") {
    return <Badge variant="info">running</Badge>;
  }

  if (status === "queued" || status === "idle") {
    return <Badge variant="default">{status}</Badge>;
  }

  if (status === "disabled") {
    return <Badge variant="warning">disabled</Badge>;
  }

  return <Badge variant="destructive">{status}</Badge>;
}
