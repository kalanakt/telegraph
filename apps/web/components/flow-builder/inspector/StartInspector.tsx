"use client";

import type { TriggerType } from "@telegram-builder/shared";
import { getTriggerGroups } from "@/lib/flow-builder";
import { getTriggerIcon, formatTriggerLabel } from "../TriggerPickerModal";

type Props = {
  trigger: TriggerType;
  onTriggerChange: (trigger: TriggerType) => void;
};

export function StartInspector({ trigger, onTriggerChange }: Props) {
  const Icon = getTriggerIcon(trigger);
  const groups = getTriggerGroups();

  return (
    <div className="builder-section space-y-2">
      <p className="builder-kicker">Trigger</p>
      <div className="flex items-center gap-2 rounded-sm border border-border/80 bg-background/65 px-3 py-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-sm border border-border/80 bg-secondary/70 text-foreground">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-foreground">{formatTriggerLabel(trigger)}</p>
          <p className="font-mono text-[9px] text-muted-foreground">{trigger}</p>
        </div>
        <select
          className="builder-field nodrag nopan h-8 max-w-[220px] py-1 text-xs"
          value={trigger}
          onChange={(e) => onTriggerChange(e.target.value as TriggerType)}
        >
          {groups.map((group) => (
            <optgroup key={group.id} label={group.label}>
              {group.triggers.map((t) => (
                <option key={t} value={t}>
                  {formatTriggerLabel(t)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
      <p className="text-[11px] text-muted-foreground">
        This flow must contain exactly one trigger node. Use it as the entry point for the rest of the graph.
      </p>
    </div>
  );
}
