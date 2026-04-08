"use client";

import { Handle, Position } from "@xyflow/react";
import type { TriggerType } from "@telegram-builder/shared";
import { formatTriggerLabel } from "@/lib/flow-builder";
import { Button } from "@/components/ui/button";
import type { BuilderNodeMeta, BuilderRuntimeData } from "../types";
import { getTriggerIcon } from "../TriggerPickerModal";

type StartNodeData = {
  id?: string;
  trigger?: TriggerType;
  __meta?: BuilderNodeMeta;
  __runtime?: BuilderRuntimeData;
};

export function StartNode({ data }: { data: StartNodeData }) {
  const trigger = data.trigger ?? "message_received";
  const Icon = getTriggerIcon(trigger);
  const label = data.__meta?.label?.trim() || "Trigger";
  const runtime = data.__runtime;
  const nodeId = data.id ?? "";

  return (
    <div
      className={`builder-node builder-node-start relative min-w-[300px] max-w-[360px] rounded-sm px-3 py-3 text-xs ${trigger ? "builder-node-start-configured" : ""}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Trigger</div>
          <div className="font-semibold leading-tight text-foreground">{label}</div>
          <div className="mt-0.5 text-[10px] text-foreground/80">{formatTriggerLabel(trigger)}</div>
          <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{trigger}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                runtime?.onTriggerSelect?.(trigger);
              }}
            >
              Edit trigger
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
                runtime?.onQuickAdd?.(nodeId, undefined, {
                  x: rect.left + rect.width / 2,
                  y: rect.bottom,
                });
              }}
            >
              Add next
            </Button>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">Pick a trigger, then connect the rest of the graph.</div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-white !bg-primary"
      />
    </div>
  );
}
