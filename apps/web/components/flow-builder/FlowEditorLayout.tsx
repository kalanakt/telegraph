"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  hasInspector: boolean;
  canvas: ReactNode;
  inspector: ReactNode;
};

export function FlowEditorLayout({ hasInspector, canvas, inspector }: Props) {
  return (
    <div
      className={cn(
        "grid gap-4 xl:gap-0 xl:transition-[grid-template-columns] xl:duration-300 xl:ease-out",
        hasInspector
          ? "xl:grid-cols-[minmax(0,1fr)_400px]"
          : "xl:grid-cols-[minmax(0,1fr)_0px]",
      )}
    >
      <div className="min-w-0">{canvas}</div>

      <div
        aria-hidden={!hasInspector}
        className={cn(
          "min-w-0 overflow-hidden transition-[opacity,transform,padding] duration-300 ease-out",
          hasInspector
            ? "opacity-100 translate-y-0 xl:translate-x-0 xl:pl-4"
            : "pointer-events-none opacity-0 max-xl:hidden xl:translate-x-3 xl:pl-0",
        )}
      >
        <div className="w-full xl:w-[400px]">{inspector}</div>
      </div>
    </div>
  );
}
