import { Badge } from "@/components/ui/badge";
import type { RunTaskStatus } from "@/types/api";

export function StatusBadge({
  status,
}: {
  status: RunTaskStatus | "healthy" | "idle" | "disabled";
}) {
  if (status === "healthy") {
    return <Badge variant="success">healthy</Badge>;
  }

  if (status === "running") {
    return <Badge variant="info">running</Badge>;
  }

  if (status === "evaluating") {
    return <Badge variant="warning">evaluating</Badge>;
  }

  if (status === "completed") {
    return <Badge variant="success">completed</Badge>;
  }

  if (status === "queued" || status === "idle") {
    return <Badge variant="default">{status}</Badge>;
  }

  if (status === "disabled") {
    return <Badge variant="warning">disabled</Badge>;
  }

  return <Badge variant="destructive">{status}</Badge>;
}
