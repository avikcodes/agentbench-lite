"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashboardApi } from "@/services/dashboard";

export function ExportPanel() {
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: string, url: string, filename: string) => {
    setExporting(type);
    try {
      await dashboardApi.downloadExport(url, filename);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  const exports = [
    {
      id: "benchmark-json",
      label: "Benchmark Reports (JSON)",
      description: "Download all benchmark evaluation data as JSON.",
      icon: FileJson,
      url: "",  // set per benchmark
      filename: "",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="size-4 text-primary" />
          <CardTitle>Export Reports</CardTitle>
        </div>
        <CardDescription>
          Download benchmark, execution, and evaluation reports as JSON or CSV.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Report types</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 p-4">
                <p className="mb-2 text-sm font-semibold">Benchmark</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Full benchmark results with task-level metrics.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={exporting === "benchmark-json"}
                    onClick={() => handleExport(
                      "benchmark-json",
                      "/api/analytics/summary",
                      "analytics_summary.json",
                    )}
                  >
                    <FileJson className="mr-1 size-3" />
                    JSON
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="mb-2 text-sm font-semibold">Execution</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Execution trace with step-by-step details.
                </p>
                <p className="text-xs text-muted-foreground">
                  Use from replay page per execution.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 p-4">
                <p className="mb-2 text-sm font-semibold">Evaluation</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Metric scores, weights, and failure analysis.
                </p>
                <p className="text-xs text-muted-foreground">
                  Use from replay page per execution.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Quick exports</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={exporting === "summary-csv"}
                onClick={() => handleExport(
                  "summary-csv",
                  "/api/analytics/summary",
                  "analytics_summary.json",
                )}
              >
                <Download className="mr-2 size-3" />
                Download analytics summary
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
