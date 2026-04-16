"use client";

import { useMemo, useState } from "react";

import type { MetricDaily } from "@/types/skinnia";

export function useMetrics(initialMetrics: MetricDaily[]) {
  const [metrics] = useState(initialMetrics);

  const summary = useMemo(() => metrics.at(-1) ?? null, [metrics]);

  return {
    metrics,
    summary
  };
}
