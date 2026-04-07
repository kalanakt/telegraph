"use client";

import { Button } from "@/components/ui/button";
import type { BuilderRuntimeData } from "../types";

export function NodeConnectActions({
  nodeId,
  sourceHandle,
  runtime,
  compact = false,
}: {
  nodeId: string;
  sourceHandle?: string;
  runtime?: BuilderRuntimeData;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${compact ? "" : "mt-2"}`}>
      <Button
        type="button"
        size="xs"
        variant="outline"
        className="h-6 rounded-sm px-2 text-[10px] font-medium"
        onClick={(event) => {
          event.stopPropagation();
          runtime?.onAddNext?.(nodeId, sourceHandle, {
            x: event.clientX,
            y: event.clientY,
          });
        }}
      >
        Add next
      </Button>
      <Button
        type="button"
        size="xs"
        variant={runtime?.connectState === "source" ? "secondary" : "outline"}
        className="h-6 rounded-sm px-2 text-[10px] font-medium"
        onClick={(event) => {
          event.stopPropagation();
          runtime?.onConnectExisting?.(nodeId, sourceHandle);
        }}
      >
        Connect existing
      </Button>
    </div>
  );
}
