"use client";

import type { TriggerType } from "@telegram-builder/shared";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
        <Select
          value={trigger}
          onValueChange={(value) => onTriggerChange(value as TriggerType)}
        >
          <SelectTrigger
            size="sm"
            className="nodrag nopan h-8 w-[220px] max-w-full border-border/80 bg-background/90 px-3 py-1 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectGroup key={group.id}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.triggers.map((item) => (
                  <SelectItem key={item} value={item}>
                    {formatTriggerLabel(item)}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-[11px] text-muted-foreground">
        This flow must contain exactly one trigger node. Use it as the entry point for the rest of the graph.
      </p>
    </div>
  );
}
