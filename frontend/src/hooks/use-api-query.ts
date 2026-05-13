"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseApiQueryOptions<T> = {
  enabled?: boolean;
  pollIntervalMs?: number;
  initialData?: T | null;
  onSuccess?: (result: T) => void;
};

export function useApiQuery<T>(
  queryKey: string,
  fetcher: () => Promise<T>,
  options: UseApiQueryOptions<T> = {},
) {
  const { enabled = true, pollIntervalMs, initialData = null, onSuccess } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const refetch = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading((current) => current || data === null);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [data, enabled, fetcher, onSuccess]);

  useEffect(() => {
    clearTimer();

    if (!enabled) {
      return;
    }

    window.setTimeout(() => {
      void refetch();
    }, 0);

    if (!pollIntervalMs) {
      return;
    }

    const loop = () => {
      timerRef.current = window.setTimeout(async () => {
        await refetch();
        loop();
      }, pollIntervalMs);
    };

    loop();

    return clearTimer;
  }, [clearTimer, enabled, pollIntervalMs, queryKey, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
    setData,
  };
}
