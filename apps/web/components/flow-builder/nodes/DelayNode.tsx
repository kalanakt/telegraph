"use client";

import { Handle, Position } from "@xyflow/react";
import { TimerReset } from "lucide-react";
import type { BuilderNodeMeta, DelayEditorData } from "../types";

function formatDelay(ms: number) {
  if (ms % 3_600_000 === 0) return `${ms / 3_600_000}h`;
  if (ms % 60_000 === 0) return `${ms / 60_000}m`;
  if (ms % 1_000 === 0) return `${ms / 1_000}s`;
  return `${ms}ms`;
}

export function DelayNode({ data }: { data: DelayEditorData & { __meta?: BuilderNodeMeta } }) {
  const label = data.__meta?.label?.trim() || "Delay";

  return (
    <div className="builder-node builder-node-action relative min-w-[260px] rounded-sm text-xs">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-white !bg-primary"
      />

      <div className="px-3 pb-2 pt-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
            <TimerReset className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Delay</div>
            <div className="font-semibold leading-tight text-foreground">{label}</div>
            <div className="mt-1 text-[11px] text-foreground/76">Wait {formatDelay(data.delay_ms)} before continuing</div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/80 px-3 py-2">
        <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Next</span>
        <Handle
          id="default"
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-white !bg-primary"
        />
      </div>
    </div>
  );
}
