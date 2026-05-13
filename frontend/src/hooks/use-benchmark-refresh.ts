"use client";

import { useEffect } from "react";

import { subscribeToBenchmarkRunCompleted } from "@/services/live-updates";

export function useBenchmarkRefresh(callback: () => void) {
  useEffect(() => {
    return subscribeToBenchmarkRunCompleted(() => {
      callback();
    });
  }, [callback]);
}
