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
        <div className="flex items-center gap-2 rounded-md border border-border/80 bg-white/65 px-3 py-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-border/80 bg-secondary/70 text-foreground">
            <Icon className="h-3.5 w-3.5" />
          </span>
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground">{formatTriggerLabel(trigger)}</p>
            <p className="font-mono text-[9px] text-muted-foreground">{trigger}</p>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="nodrag nopan flex items-center gap-1 rounded-sm border border-border/80 bg-secondary/70 px-2 py-1 text-[10px] font-medium text-foreground/75 transition hover:bg-secondary"
          >
            <ChevronDown className="h-3 w-3" />
            Change
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          This builder must contain exactly one trigger node. Use it as the entry point for the rest of the graph.
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
