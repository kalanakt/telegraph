"use client";

import dynamic from "next/dynamic";

const LandingFlowPreview = dynamic(
  () => import("@/components/marketing/LandingFlowPreview").then((mod) => mod.LandingFlowPreview),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(var(--primary)/0.12),transparent_32%)]" />
  }
);

export function LandingFlowPreviewClient() {
  return <LandingFlowPreview />;
}
