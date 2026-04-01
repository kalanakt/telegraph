"use client";

import { Handle, Position } from "@xyflow/react";
import type { TriggerType } from "@telegram-builder/shared";
import { getTriggerIcon, formatTriggerLabel } from "../TriggerPickerModal";

type StartNodeData = {
  trigger?: TriggerType;
};

export function StartNode({ data }: { data: StartNodeData }) {
  const trigger = data.trigger ?? "message_received";
  const Icon = getTriggerIcon(trigger);

  return (
    <div
      className={`builder-node builder-node-start relative min-w-[220px] rounded-sm px-3 py-3 text-xs ${trigger ? "builder-node-start-configured" : ""}`}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Trigger</div>
          <div className="font-semibold leading-tight text-foreground">{formatTriggerLabel(trigger)}</div>
          <div className="mt-0.5 font-mono text-[9px] text-muted-foreground">{trigger}</div>
          <div className="mt-2 text-[10px] text-muted-foreground">Change in inspector →</div>
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
