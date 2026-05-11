"use client";

import { CheckCircle2, ServerCrash } from "lucide-react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { dashboardApi } from "@/services/dashboard";

export function ModelsView() {
  const models = useApiQuery("models-view", dashboardApi.getModels);

  if (models.isLoading) {
    return <PageSkeleton />;
  }

  if (models.error || !models.data) {
    return <ErrorState message={models.error ?? "Unable to load models."} onRetry={() => void models.refetch()} />;
  }

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Model Registry"
        title="Available inference models"
        description="Inspect providers, readiness state, timeouts, and metadata for every model exposed by the backend registry."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {models.data.map((model) => (
          <Card key={`${model.provider}-${model.model_name}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{model.model_name}</CardTitle>
                  <CardDescription>{model.provider}</CardDescription>
                </div>
                {model.enabled ? <CheckCircle2 className="size-5 text-emerald-600" /> : <ServerCrash className="size-5 text-amber-600" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusBadge status={model.enabled ? "healthy" : "disabled"} />
              <p className="text-sm leading-6 text-muted-foreground">{model.description}</p>
              <div className="rounded-2xl bg-secondary/70 p-4">
                <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Endpoint</p>
                <p className="mt-2 break-all font-mono text-xs">{model.base_url}</p>
              </div>
              <div className="rounded-2xl bg-secondary/70 p-4">
                <p className="text-sm text-muted-foreground">Timeout</p>
                <p className="mt-2 text-xl font-semibold">{model.timeout_seconds}s</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Model metadata table</CardTitle>
          <CardDescription>Use this view to verify provider coverage and operational readiness before running benchmarks.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timeout</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.data.map((model) => (
                  <TableRow key={`${model.provider}-${model.model_name}-row`}>
                    <TableCell>{model.provider}</TableCell>
                    <TableCell className="font-medium">{model.model_name}</TableCell>
                    <TableCell>
                      <StatusBadge status={model.enabled ? "healthy" : "disabled"} />
                    </TableCell>
                    <TableCell>{model.timeout_seconds}s</TableCell>
                    <TableCell>{model.description}</TableCell>
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
