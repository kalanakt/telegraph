"use client";

import type { TriggerType } from "@telegram-builder/shared";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getConditionOptions } from "@/lib/flow-builder";
import type { ConditionEditorData } from "../types";

type Props = {
  data: ConditionEditorData;
  trigger: TriggerType;
  onUpdate: (partial: Record<string, unknown>) => void;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function ConditionInspector({ data, trigger, onUpdate }: Props) {
  const options = getConditionOptions(trigger);
  const optionMap = new Map(options.map((item) => [item.type, item]));
  const requestedType = String(data.type ?? "");
  const conditionType = optionMap.has(requestedType as never) ? requestedType : options[0]?.type ?? "text_contains";
  const current = optionMap.get(conditionType as never);

  const requiresNoValue = conditionType.startsWith("message_has_");
  const usesKeyOnly =
    conditionType === "variable_exists" ||
    conditionType === "webhook_header_exists" ||
    conditionType === "webhook_body_path_exists";
  const usesKeyAndValue =
    conditionType === "variable_equals" ||
    conditionType === "webhook_header_equals" ||
    conditionType === "webhook_query_equals" ||
    conditionType === "webhook_query_contains" ||
    conditionType === "webhook_body_path_equals" ||
    conditionType === "webhook_body_path_contains";

  return (
    <>
      <div className="builder-section">
        <p className="builder-kicker">Trigger context</p>
        <p className="text-xs text-foreground/70">
          Current flow trigger is <span className="font-semibold">{trigger}</span>. Only compatible conditions are shown.
        </p>
      </div>

      <div className="builder-label">
        <span>Condition type</span>
        <Select
          value={conditionType}
          onValueChange={(value) => onUpdate({ type: value })}
        >
          <SelectTrigger className="builder-field">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.type} value={option.type}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {current ? <p className="text-[11px] text-muted-foreground">{current.description}</p> : null}
      </div>

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
      ) : usesKeyOnly ? (
        <label className="builder-label">
          <span>Key / path</span>
          <Input
            value={asString(data.key ?? data.value ?? "")}
            placeholder={conditionType.includes("body_path") ? "payload.customer.email" : "x-source"}
            onChange={(e) => onUpdate({ key: e.target.value })}
          />
        </label>
      ) : (
        <div className="builder-label">
          <span>{usesKeyAndValue ? "Key / path" : "Value"}</span>
          {conditionType === "message_source_equals" ? (
            <Select
              value={asString(data.value ?? "user")}
              onValueChange={(value) => onUpdate({ value })}
            >
              <SelectTrigger className="builder-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">user</SelectItem>
                <SelectItem value="group">group</SelectItem>
                <SelectItem value="channel">channel</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={asString(usesKeyAndValue ? data.key ?? "" : data.value ?? "")}
              placeholder={
                conditionType === "text_matches_regex"
                  ? "^hello"
                  : conditionType.includes("body_path")
                  ? "payload.customer.email"
                  : conditionType.includes("header")
                  ? "x-source"
                  : conditionType.includes("query")
                  ? "status"
                  : conditionType === "from_user_id"
                  ? "Telegram user ID"
                  : "Value"
              }
              onChange={(e) => {
                if (usesKeyAndValue) {
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
        </div>
      )}

      {usesKeyAndValue ? (
        <label className="builder-label">
          <span>Value</span>
          <Input
            value={asString(data.value ?? "")}
            onChange={(e) => onUpdate({ value: e.target.value })}
          />
        </label>
      ) : null}

      {trigger === "webhook.received" ? (
        <div className="rounded-md border border-border/80 bg-background/65 px-3 py-2">
          <p className="text-[10px] font-semibold text-foreground/78">Webhook tips</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Use body paths like <code className="rounded-sm bg-secondary/70 px-0.5">payload.customer.email</code> when the request body is JSON.
          </p>
        </div>
      ) : null}
    </>
  );
}
