"use client";

import { Input } from "@/components/ui/input";
import type { DelayEditorData } from "../types";

type Props = {
  data: DelayEditorData;
  onUpdate: (partial: Record<string, unknown>) => void;
};

export function DelayInspector({ data, onUpdate }: Props) {
  return (
    <div className="builder-section">
      <p className="builder-kicker">Delay</p>
      <label className="builder-label">
        <span>Milliseconds</span>
        <Input
          type="number"
          min={1}
          value={data.delay_ms}
          onChange={(event) => onUpdate({ delay_ms: Number(event.target.value || 0) })}
        />
      </label>
    </div>
  );
}
