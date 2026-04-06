"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SetVariableEditorData } from "../types";

type Props = {
  data: SetVariableEditorData;
  onUpdate: (partial: Record<string, unknown>) => void;
};

export function SetVariableInspector({ data, onUpdate }: Props) {
  return (
    <>
      <div className="builder-section">
        <p className="builder-kicker">Target variable</p>
        <Input
          value={data.path}
          placeholder="customer.email"
          onChange={(event) => onUpdate({ path: event.target.value })}
        />
        <p className="text-[11px] text-muted-foreground">
          Stored under <code className="rounded-sm bg-secondary/70 px-0.5">{`{{vars.${data.path || "customer.email"}}}`}</code>
        </p>
      </div>

      <div className="builder-section">
        <p className="builder-kicker">Value</p>
        <Textarea
          rows={6}
          value={typeof data.value === "string" ? data.value : JSON.stringify(data.value ?? "", null, 2)}
          onChange={(event) => {
            const nextValue = event.target.value;
            try {
              onUpdate({ value: JSON.parse(nextValue) });
            } catch {
              onUpdate({ value: nextValue });
            }
          }}
        />
      </div>
    </>
  );
}
