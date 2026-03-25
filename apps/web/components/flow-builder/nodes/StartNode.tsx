"use client";

import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { ChevronDown, Plus } from "lucide-react";
import type { TriggerType } from "@telegram-builder/shared";
import { TriggerPickerModal, getTriggerIcon, formatTriggerLabel } from "../TriggerPickerModal";
import type { AddBranch, AddKind, NodeCallbacks } from "../types";

type StartNodeData = NodeCallbacks & {
  trigger?: TriggerType;
};

function AddButtons({
  onAdd,
  branch = "next",
}: {
  onAdd?: (branch: AddBranch, kind: AddKind) => void;
  branch?: AddBranch;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className="nodrag nopan inline-flex h-6 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        onClick={() => onAdd?.(branch, "condition")}
      >
        <Plus className="h-3 w-3" /> Condition
      </button>
      <button
        type="button"
        className="nodrag nopan inline-flex h-6 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        onClick={() => onAdd?.(branch, "action")}
      >
        <Plus className="h-3 w-3" /> Action
      </button>
    </div>
  );
}

export function StartNode({ data }: { data: StartNodeData }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const trigger = data.trigger ?? "message_received";
  const Icon = getTriggerIcon(trigger);

  return (
    <>
      <div
        className={`builder-node builder-node-start relative min-w-[220px] rounded-xl px-3 py-2.5 text-xs text-slate-900 ${trigger ? "builder-node-start-configured" : ""}`}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.08em] text-slate-500">Trigger</div>
            <div className="font-semibold leading-tight">{formatTriggerLabel(trigger)}</div>
            <div className="mt-0.5 font-mono text-[9px] text-slate-400">{trigger}</div>
          </div>
        </div>

        <button
          type="button"
          className="nodrag nopan mt-2 flex w-full items-center gap-1 rounded-lg border border-slate-200/80 bg-white/80 px-2 py-1 text-[10px] font-medium text-slate-600 transition hover:bg-slate-50"
          onClick={() => setPickerOpen(true)}
        >
          <ChevronDown className="h-3 w-3" />
          Change trigger
        </button>

        <Handle
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-white !bg-indigo-500"
        />
        <div className="absolute -right-[188px] top-1/2 -translate-y-1/2">
          <AddButtons onAdd={data.onAdd} branch="next" />
        </div>
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
