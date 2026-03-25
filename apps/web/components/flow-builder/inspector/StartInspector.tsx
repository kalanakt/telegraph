"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { TriggerType } from "@telegram-builder/shared";
import { TriggerPickerModal, getTriggerIcon, formatTriggerLabel } from "../TriggerPickerModal";

type Props = {
  trigger: TriggerType;
  onTriggerChange: (trigger: TriggerType) => void;
};

export function StartInspector({ trigger, onTriggerChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const Icon = getTriggerIcon(trigger);

  return (
    <>
      <div className="builder-section space-y-2">
        <p className="builder-kicker">Trigger</p>
        <div className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-indigo-800">{formatTriggerLabel(trigger)}</p>
            <p className="font-mono text-[9px] text-indigo-500">{trigger}</p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="nodrag nopan flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2 py-1 text-[10px] font-medium text-indigo-700 transition hover:bg-indigo-50"
          >
            <ChevronDown className="h-3 w-3" />
            Change
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          The trigger is set on the Start node. You can also change it by clicking the start node on the canvas.
        </p>
      </div>

      <TriggerPickerModal
        open={pickerOpen}
        currentTrigger={trigger}
        onSelect={onTriggerChange}
        onClose={() => setPickerOpen(false)}
      />
    </>
  );
}
