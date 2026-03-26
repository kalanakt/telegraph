"use client";

import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { ChevronDown } from "lucide-react";
import type { TriggerType } from "@telegram-builder/shared";
import { TriggerPickerModal, getTriggerIcon, formatTriggerLabel } from "../TriggerPickerModal";
import type { NodeCallbacks } from "../types";

type StartNodeData = NodeCallbacks & {
  trigger?: TriggerType;
};

export function StartNode({ data }: { data: StartNodeData }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const trigger = data.trigger ?? "message_received";
  const Icon = getTriggerIcon(trigger);

  return (
    <>
      <div
        className={`builder-node builder-node-start relative min-w-[220px] rounded-md px-3 py-3 text-xs ${trigger ? "builder-node-start-configured" : ""}`}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-white/10 bg-white/6 text-white">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">Trigger</div>
            <div className="font-semibold leading-tight text-white">{formatTriggerLabel(trigger)}</div>
            <div className="mt-0.5 font-mono text-[9px] text-white/38">{trigger}</div>
          </div>
        </div>

        <button
          type="button"
          className="nodrag nopan mt-3 flex w-full items-center gap-1 rounded-sm border border-white/12 bg-white/5 px-2 py-1.5 text-[10px] font-medium text-white/72 transition hover:bg-white/10"
          onClick={() => setPickerOpen(true)}
        >
          <ChevronDown className="h-3 w-3" />
          Change trigger
        </button>

        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-black !bg-white"
        />
      </div>

      <TriggerPickerModal
        open={pickerOpen}
        currentTrigger={trigger}
        onSelect={(t) => data.onTriggerChange?.(t)}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
