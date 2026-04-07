"use client";

import { GitFork, Plus } from "lucide-react";
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
        onClick={(event) => {
          event.stopPropagation();
          runtime?.onAddNext?.(nodeId, sourceHandle, {
            x: event.clientX,
            y: event.clientY,
          });
        }}
      >
        <Plus className="h-3 w-3" />
        Add next
      </Button>
      <Button
        type="button"
        size="xs"
        variant={runtime?.connectState === "source" ? "secondary" : "outline"}
        onClick={(event) => {
          event.stopPropagation();
          runtime?.onConnectExisting?.(nodeId, sourceHandle);
        }}
      >
        <GitFork className="h-3 w-3" />
        Connect existing
      </Button>
    </div>
  );
}
