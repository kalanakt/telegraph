"use client";

import type { TriggerType } from "@telegram-builder/shared";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONDITION_OPTIONS, type ConditionEditorData } from "../types";

type Props = {
  data: ConditionEditorData;
  trigger: TriggerType;
  onUpdate: (partial: Record<string, unknown>) => void;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function ConditionInspector({ data, trigger, onUpdate }: Props) {
  const conditionType = String(data.type ?? "text_contains");
  const requiresNoValue =
    conditionType.startsWith("message_has_");

  return (
    <>
      <div className="builder-section">
        <p className="builder-kicker">Trigger context</p>
        <p className="text-xs text-foreground/70">
          Current flow trigger is <span className="font-semibold">{trigger}</span>. Keep condition values compatible with this event shape.
        </p>
      </div>

      <label className="builder-label">
        <span>Condition type</span>
        <select
          className="builder-field"
          value={conditionType}
          onChange={(e) => onUpdate({ type: e.target.value })}
        >
          {CONDITION_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      {conditionType === "all" || conditionType === "any" ? (
        <label className="builder-label">
          <span>Nested conditions JSON array</span>
          <Textarea
            rows={5}
            value={asString(data.conditionsJson ?? "[]")}
            onChange={(e) => onUpdate({ conditionsJson: e.target.value })}
          />
        </label>
      ) : requiresNoValue ? (
        <div className="builder-section">
          <p className="builder-kicker">Condition value</p>
          <p className="text-xs text-foreground/70">This condition does not require a value.</p>
        </div>
      ) : (
        <label className="builder-label">
          <span>
            {conditionType === "variable_equals" || conditionType === "variable_exists"
              ? "Key"
              : "Value"}
          </span>
          {conditionType === "message_source_equals" ? (
            <select
              className="builder-field"
              value={asString(data.value ?? "user")}
              onChange={(e) => onUpdate({ value: e.target.value })}
            >
              <option value="user">user</option>
              <option value="group">group</option>
              <option value="channel">channel</option>
            </select>
          ) : (
            <Input
              value={asString(data.value ?? data.key ?? "")}
              placeholder={
                conditionType === "callback_data_equals"
                  ? "e.g. confirm_yes"
                  : conditionType === "from_user_id"
                  ? "Telegram user ID"
                  : conditionType === "target_user_id_equals"
                  ? "Target user ID"
                  : "Value"
              }
              onChange={(e) => {
                if (conditionType === "variable_equals" || conditionType === "variable_exists") {
                  onUpdate({ key: e.target.value });
                  return;
                }
                const val =
                  conditionType === "from_user_id" || conditionType === "target_user_id_equals"
                    ? Number(e.target.value || 0)
                    : e.target.value;
                onUpdate({ value: val });
              }}
            />
          )}
        </label>
      )}

      {conditionType === "variable_equals" ? (
        <label className="builder-label">
          <span>Equals</span>
          <Input
            value={asString(data.value ?? "")}
            onChange={(e) => onUpdate({ value: e.target.value })}
          />
        </label>
      ) : null}

      {conditionType === "callback_data_equals" ? (
        <div className="rounded-md border border-border/80 bg-background/65 px-3 py-2">
          <p className="text-[10px] font-semibold text-foreground/78">Callback query tip</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Use this when the trigger is <code className="rounded-sm bg-secondary/70 px-0.5">callback_query_received</code> and you want to branch explicitly from a real condition node.
          </p>
        </div>
      ) : null}
    </>
  );
}
