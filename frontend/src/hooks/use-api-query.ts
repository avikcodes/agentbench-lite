"use client";

import { useCallback, useEffect, useState } from "react";

export function useApiQuery<T>(
  queryKey: string,
  fetcher: () => Promise<T>,
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [queryKey, refetch]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
