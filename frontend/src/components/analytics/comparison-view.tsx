"use client";

import { useState, useMemo } from "react";
import { BarChart3, Plus, X } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { HorizontalBarChart } from "@/components/shared/charts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatDate, formatPercent, formatScore } from "@/lib/format";
import { dashboardApi } from "@/services/dashboard";

export function ComparisonView() {
  const allResults = useApiQuery("benchmark-results", () => dashboardApi.getBenchmarkResults());

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [newId, setNewId] = useState("");

  const availableResults = useMemo(() => {
    if (!allResults.data) return [];
    return allResults.data.filter((r) => !selectedIds.includes(r.benchmark_id));
  }, [allResults.data, selectedIds]);

  const addToComparison = () => {
    if (newId && !selectedIds.includes(newId)) {
      setSelectedIds([...selectedIds, newId]);
      setNewId("");
    }
  };

  const removeFromComparison = (id: string) => {
    setSelectedIds(selectedIds.filter((i) => i !== id));
  };

  const comparisonResult = useApiQuery(
    `compare-${selectedIds.sort().join(",")}`,
    () => {
      if (selectedIds.length < 2) return Promise.resolve(null);
      return dashboardApi.compareBenchmarks({ benchmark_ids: selectedIds });
    },
  );

  if (allResults.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading benchmarks...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (allResults.error) {
    return <ErrorState message={allResults.error} onRetry={() => void allResults.refetch()} />;
  }

  if (!allResults.data || allResults.data.length === 0) {
    return (
      <EmptyState
        title="No benchmark data"
        description="Run and evaluate benchmarks before using the comparison tool."
      />
    );
  }

  const ranking = comparisonResult.data?.ranking ?? [];
  const hasData = selectedIds.length >= 2 && ranking.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-primary" />
          <CardTitle>Benchmark Comparison</CardTitle>
        </div>
        <CardDescription>
          Select 2+ benchmarks to compare scores, pass rates, and model performance side by side.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Add benchmark</p>
            <div className="flex gap-2">
              <Select
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                className="w-64"
              >
                <option value="">Select a benchmark...</option>
                {availableResults.map((r) => (
                  <option key={r.benchmark_id} value={r.benchmark_id}>
                    {r.benchmark_id.slice(0, 16)}... ({r.model_name})
                  </option>
                ))}
              </Select>
              <Button variant="outline" size="sm" onClick={addToComparison} disabled={!newId}>
                <Plus className="mr-1 size-3" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {selectedIds.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map((id) => {
              const result = allResults.data?.find((r) => r.benchmark_id === id);
              return (
                <div key={id} className="flex items-center gap-2 rounded-full border bg-secondary/50 px-3 py-1.5 text-xs">
                  <span className="font-medium">{result?.model_name ?? id.slice(0, 8)}</span>
                  <span className="text-muted-foreground">{formatScore(result?.overall_score ?? 0)}</span>
                  <button type="button" onClick={() => removeFromComparison(id)} className="text-muted-foreground hover:text-foreground">
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        {selectedIds.length < 2 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Select at least 2 benchmarks to compare.
          </div>
        ) : comparisonResult.isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            Loading comparison...
          </div>
        ) : hasData ? (
          <div className="space-y-6">
            <div>
              <h4 className="mb-3 text-sm font-semibold">Ranking</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Weighted score</TableHead>
                    <TableHead>Avg score</TableHead>
                    <TableHead>Pass rate</TableHead>
                    <TableHead>Passed / Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((r) => (
                    <TableRow key={r.model_name}>
                      <TableCell>#{r.rank}</TableCell>
                      <TableCell className="font-medium">{r.model_name}</TableCell>
                      <TableCell>{formatScore(r.weighted_score)}</TableCell>
                      <TableCell>{formatScore(r.average_score)}</TableCell>
                      <TableCell>{formatPercent(r.pass_rate)}</TableCell>
                      <TableCell>{r.passed_tasks} / {r.total_tasks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Score comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <HorizontalBarChart
                    data={ranking.map((r) => ({ name: r.model_name, value: r.weighted_score }))}
                    dataKey="value"
                    formatter={(v) => `${(v * 100).toFixed(1)}%`}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pass rate comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <HorizontalBarChart
                    data={ranking.map((r) => ({ name: r.model_name, value: r.pass_rate }))}
                    dataKey="value"
                    color="var(--chart-3)"
                    formatter={(v) => `${(v * 100).toFixed(1)}%`}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
