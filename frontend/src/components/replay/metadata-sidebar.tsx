"use client";

import { Cpu, Clock, Hash, CheckCircle2, XCircle, Info, BarChart3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatMs, titleCase } from "@/lib/format";
import type { AgentExecutionResult, TaskEvaluationResult } from "@/types/api";

export function MetadataSidebar({
  execution,
  evaluation,
}: {
  execution: AgentExecutionResult;
  evaluation?: TaskEvaluationResult | null;
}) {
  const toolCalls = execution.execution_trace.filter((s) => s.selected_tool !== null).length;
  const totalSteps = execution.execution_trace.length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-4 text-primary" />
            Execution Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Execution ID</p>
            <p className="break-all font-mono text-sm font-medium">{execution.execution_id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Task ID</p>
            <p className="font-mono text-sm">{execution.task_id}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <div>
              {execution.success_status ? (
                <Badge variant="success">Success</Badge>
              ) : (
                <Badge variant="destructive">Failed</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-secondary/70 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" />
                Total latency
              </div>
              <p className="mt-1 text-lg font-semibold">{formatMs(execution.total_latency)}</p>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Hash className="size-3" />
                Steps
              </div>
              <p className="mt-1 text-lg font-semibold">{totalSteps}</p>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Cpu className="size-3" />
                Tool calls
              </div>
              <p className="mt-1 text-lg font-semibold">{toolCalls}</p>
            </div>
            <div className="rounded-2xl bg-secondary/70 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {execution.success_status ? <CheckCircle2 className="size-3 text-emerald-600" /> : <XCircle className="size-3 text-rose-600" />}
                Outcome
              </div>
              <p className="mt-1 text-lg font-semibold">{execution.success_status ? "Pass" : "Fail"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="size-4 text-primary" />
            Model
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-2xl bg-secondary/70 p-3">
            <p className="text-xs text-muted-foreground">Model used</p>
            <p className="mt-1 font-mono text-sm font-medium">{execution.model_used}</p>
          </div>
          {execution.tools_used.length > 0 ? (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Tools used</p>
              <div className="flex flex-wrap gap-1.5">
                {execution.tools_used.map((tool) => (
                  <Badge key={tool} variant="default">{titleCase(tool)}</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {evaluation ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-secondary/70 p-3">
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="mt-1 text-lg font-semibold">{evaluation.score.toFixed(3)}</p>
              </div>
              <div className="rounded-2xl bg-secondary/70 p-3">
                <p className="text-xs text-muted-foreground">Passed</p>
                <p className="mt-1 text-lg font-semibold">{evaluation.passed ? "Yes" : "No"}</p>
              </div>
            </div>
            {evaluation.evaluated_at ? (
              <p className="text-xs text-muted-foreground">Evaluated: {formatDate(evaluation.evaluated_at)}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {execution.error_message ? (
        <Card className="border-rose-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-rose-700">
              <XCircle className="size-4" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-rose-600">{execution.error_message}</p>
          </CardContent>
        </Card>
      ) : null}

      {execution.final_answer ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Final answer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7">{execution.final_answer}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
