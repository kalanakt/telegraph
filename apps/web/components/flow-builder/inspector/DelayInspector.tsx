"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DelayEditorData } from "../types";

type Props = {
  data: DelayEditorData;
  onUpdate: (partial: Record<string, unknown>) => void;
};

export function DelayInspector({ data, onUpdate }: Props) {
  const normalized = useMemo(() => {
    if (data.delay_ms % (24 * 60 * 60 * 1000) === 0) {
      return { value: data.delay_ms / (24 * 60 * 60 * 1000), unit: "days" };
    }

    if (data.delay_ms % (60 * 60 * 1000) === 0) {
      return { value: data.delay_ms / (60 * 60 * 1000), unit: "hours" };
    }

    return { value: Math.max(1, Math.round(data.delay_ms / (60 * 1000))), unit: "minutes" };
  }, [data.delay_ms]);

  function toDelayMs(value: number, unit: string) {
    if (unit === "days") return value * 24 * 60 * 60 * 1000;
    if (unit === "hours") return value * 60 * 60 * 1000;
    return value * 60 * 1000;
  }

  return (
    <div className="builder-section">
      <p className="builder-kicker">Delay</p>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
        <label className="builder-label">
          <span>Amount</span>
          <Input
            type="number"
            min={1}
            max={normalized.unit === "days" ? 120 : undefined}
            value={normalized.value}
            onChange={(event) => onUpdate({ delay_ms: toDelayMs(Number(event.target.value || 0), normalized.unit) })}
          />
        </label>
        <label className="builder-label">
          <span>Unit</span>
          <Select
            value={normalized.unit}
            onValueChange={(unit) => onUpdate({ delay_ms: toDelayMs(normalized.value, unit) })}
          >
            <SelectTrigger className="builder-field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutes</SelectItem>
              <SelectItem value="hours">Hours</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      <p className="text-[11px] text-muted-foreground">Stored internally as milliseconds. Long delays can run up to 120 days.</p>
    </div>
  );
}
