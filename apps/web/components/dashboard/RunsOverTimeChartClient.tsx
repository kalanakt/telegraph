"use client";

import dynamic from "next/dynamic";
import type { RunsOverTimePoint } from "@/components/dashboard/RunsOverTimeChart";

const RunsOverTimeChart = dynamic(
  () => import("@/components/dashboard/RunsOverTimeChart").then((mod) => mod.RunsOverTimeChart),
  {
    ssr: false,
    loading: () => <div className="h-72 rounded-lg border border-border/70 bg-muted/20" />
  }
);

export function RunsOverTimeChartClient({ points }: { points: RunsOverTimePoint[] }) {
  return <RunsOverTimeChart points={points} />;
}
