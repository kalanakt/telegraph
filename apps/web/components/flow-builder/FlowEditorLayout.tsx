"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  hasInspector: boolean;
  palette?: ReactNode;
  canvas: ReactNode;
  inspector: ReactNode;
};

export function FlowEditorLayout({ hasInspector, palette = null, canvas, inspector }: Props) {
  return (
    <div
      className={cn(
        "grid gap-4 xl:gap-4",
        hasInspector
          ? "lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_400px]"
          : "lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]",
      )}
    >
      <div className="min-w-0">{palette}</div>
      <div className="min-w-0">{canvas}</div>

      {hasInspector ? (
        <div className="min-w-0">
          <div className="w-full xl:w-[400px]">{inspector}</div>
        </div>
      ) : null}
    </div>
  );
}
