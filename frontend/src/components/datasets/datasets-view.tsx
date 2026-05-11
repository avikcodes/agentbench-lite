"use client";

import { useEffect, useState } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { titleCase } from "@/lib/format";
import { dashboardApi } from "@/services/dashboard";
import type { DatasetWithTasks } from "@/types/api";

export function DatasetsView() {
  const datasets = useApiQuery("datasets-view", dashboardApi.getDatasets);
  const [datasetDetails, setDatasetDetails] = useState<DatasetWithTasks[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    const datasetList = datasets.data ?? [];
    if (datasetList.length === 0) {
      return;
    }

    async function loadDetails() {
      setDetailsLoading(true);
      setDetailsError(null);

      try {
        const detailRows = await Promise.all(
          datasetList.map(async (dataset) => ({
            ...dataset,
            tasks: await dashboardApi.getDatasetTasks(dataset.dataset_id),
          })),
        );
        setDatasetDetails(detailRows);
      } catch (error) {
        setDetailsError(error instanceof Error ? error.message : "Unable to load dataset details.");
      } finally {
        setDetailsLoading(false);
      }
    }

    void loadDetails();
  }, [datasets.data]);

  if (datasets.isLoading || detailsLoading) {
    return <PageSkeleton />;
  }

  if (datasets.error || detailsError) {
    return <ErrorState message={datasets.error ?? detailsError ?? "Unable to load datasets."} onRetry={() => void datasets.refetch()} />;
  }

  return (
    <div className="section-grid">
      <PageHeader
        eyebrow="Dataset Catalog"
        title="Benchmark datasets"
        description="Browse benchmark suites, inspect task counts, review difficulty spread, and understand the workload each dataset contributes to the dashboard."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {datasetDetails.map((dataset) => {
          const easy = dataset.tasks.filter((task) => task.difficulty === "easy").length;
          const medium = dataset.tasks.filter((task) => task.difficulty === "medium").length;
          const hard = dataset.tasks.filter((task) => task.difficulty === "hard").length;

          return (
            <Card key={dataset.dataset_id}>
              <CardHeader>
                <CardTitle>{dataset.name}</CardTitle>
                <CardDescription>{dataset.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-secondary/70 p-4">
                    <p className="text-sm text-muted-foreground">Tasks</p>
                    <p className="mt-2 text-2xl font-semibold">{dataset.total_tasks}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/70 p-4">
                    <p className="text-sm text-muted-foreground">Tool tasks</p>
                    <p className="mt-2 text-2xl font-semibold">
                      {dataset.tasks.filter((task) => task.allowed_tools.length > 0).length}
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl bg-secondary/70 p-4">
                  <p className="text-sm font-medium">Difficulty overview</p>
                  <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Easy</p>
                      <p className="mt-1 font-semibold">{easy}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Medium</p>
                      <p className="mt-1 font-semibold">{medium}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hard</p>
                      <p className="mt-1 font-semibold">{hard}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dataset details table</CardTitle>
          <CardDescription>Dataset identifiers, task counts, and benchmark composition details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dataset</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>Categories</TableHead>
                  <TableHead>Difficulty mix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasetDetails.map((dataset) => (
                  <TableRow key={`${dataset.dataset_id}-row`}>
                    <TableCell className="font-medium">{dataset.name}</TableCell>
                    <TableCell className="font-mono text-xs">{dataset.dataset_id}</TableCell>
                    <TableCell>{dataset.total_tasks}</TableCell>
                    <TableCell>
                      {Array.from(new Set(dataset.tasks.map((task) => titleCase(task.category)))).join(", ")}
                    </TableCell>
                    <TableCell>
                      easy {dataset.tasks.filter((task) => task.difficulty === "easy").length}, medium{" "}
                      {dataset.tasks.filter((task) => task.difficulty === "medium").length}, hard{" "}
                      {dataset.tasks.filter((task) => task.difficulty === "hard").length}
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
