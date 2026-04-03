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
import type { RuleOption } from "../types";
import { getTriggerIcon, formatTriggerLabel } from "../TriggerPickerModal";

type Props = {
  trigger: TriggerType;
  selectedRule: RuleOption | null;
  onTriggerChange: (trigger: TriggerType) => void;
};

export function StartInspector({ trigger, selectedRule, onTriggerChange }: Props) {
  const Icon = getTriggerIcon(trigger);
  const groups = getTriggerGroups();
  const endpoint = selectedRule?.webhookEndpoint;
  const endpointUrl =
    endpoint && typeof window !== "undefined"
      ? new URL(`/api/flow-webhooks/${endpoint.endpointId}`, window.location.origin).toString()
      : null;

  return (
    <div className="builder-section space-y-3">
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
            className="nodrag nopan h-8 w-[240px] max-w-full border-border/80 bg-background/90 px-3 py-1 text-xs"
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

      {trigger === "webhook.received" ? (
        <div className="space-y-2 rounded-md border border-border/80 bg-background/65 px-3 py-3">
          <p className="text-xs font-semibold text-foreground">Inbound webhook</p>
          {endpointUrl ? (
            <>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Endpoint</p>
                <p className="break-all font-mono text-[11px] text-foreground">{endpointUrl}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Signature header</p>
                <p className="font-mono text-[11px] text-foreground">{endpoint?.signatureHeaderName ?? "disabled"}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Sample request</p>
                <pre className="overflow-x-auto rounded-sm border border-border/70 bg-secondary/40 p-2 text-[10px] text-foreground">{`curl -X POST \\
  -H "${endpoint?.signatureHeaderName ?? "x-telegraph-flow-secret"}: <secret>" \\
  -H "content-type: application/json" \\
  -d '{"message":"hello"}' \\
  "${endpointUrl}"`}</pre>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Save this flow to generate its inbound webhook URL and secret.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
