import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Card className="border-rose-100">
      <CardContent className="flex min-h-44 flex-col items-start justify-center gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-rose-700">Unable to load data</h3>
          <p className="text-sm text-rose-600">{message}</p>
        </div>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
