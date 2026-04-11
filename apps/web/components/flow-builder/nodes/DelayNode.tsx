"use client";

import { Handle, Position } from "@xyflow/react";
import { Plus, TimerReset, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BuilderNodeMeta, BuilderRuntimeData, DelayEditorData } from "../types";

function formatDelay(ms: number) {
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000}h`;
  if (ms % 60_000 === 0) return `${ms / 60_000}m`;
  if (ms % 1_000 === 0) return `${ms / 1_000}s`;
  return `${ms}ms`;
}

export function DelayNode({ data }: { data: DelayEditorData & { __meta?: BuilderNodeMeta; __runtime?: BuilderRuntimeData; id?: string } }) {
  const label = data.__meta?.label?.trim() || "Delay";
  const runtime = data.__runtime;
  const nodeId = data.id ?? "";

  return (
    <div className="builder-node builder-node-action relative min-w-[300px] max-w-[360px] rounded-sm text-xs">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-white !bg-primary" />

      <div className="px-3 pb-2 pt-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
            <TimerReset className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-muted-foreground">Delay</div>
            <div className="font-semibold leading-tight text-foreground">{label}</div>
            <div className="mt-2 text-[11px] leading-5 text-foreground/76">Wait {formatDelay(data.delay_ms)} before continuing to the next node.</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  runtime?.onQuickAdd?.(nodeId, "default", {
                    x: rect.left + rect.width / 2,
                    y: rect.bottom,
                  });
                }}
              >
                <Plus className="h-3 w-3" />
                Add next
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  runtime?.onDeleteNode?.(nodeId);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/80 px-3 py-2">
        <span className="text-[9px] uppercase text-muted-foreground">Next</span>
        <Handle id="default" type="source" position={Position.Right} className="!h-3 !w-3 !border-white !bg-primary" />
      </div>
    </div>
  );
}
