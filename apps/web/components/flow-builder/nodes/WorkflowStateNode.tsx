"use client";

import { Handle, Position } from "@xyflow/react";
import { CreditCard, FormInput, Hand, Package, Plus, RefreshCcw, Trash2, UserRound, Waypoints } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BuilderNodeMeta, BuilderRuntimeData } from "../types";

const ICONS = {
  await_message: Hand,
  await_callback: Waypoints,
  collect_contact: UserRound,
  collect_shipping: Package,
  form_step: FormInput,
  upsert_customer: UserRound,
  upsert_order: Package,
  create_invoice: CreditCard,
  order_transition: RefreshCcw,
} as const;

function describe(type: string, data: Record<string, unknown>) {
  switch (type) {
    case "await_message":
      return `Pause until a user sends the next message${typeof data.store_as === "string" && data.store_as ? ` and store it in vars.${data.store_as}` : ""}.`;
    case "await_callback":
      return `Pause until an inline button callback${typeof data.callback_prefix === "string" && data.callback_prefix ? ` starting with "${data.callback_prefix}"` : ""}.`;
    case "collect_contact":
      return "Pause until the user shares contact details, then update the customer profile.";
    case "collect_shipping":
      return "Pause until Telegram sends a shipping query and attach it to the open order.";
    case "form_step":
      return `Capture ${typeof data.field === "string" ? data.field : "input"} from ${typeof data.source === "string" ? data.source : "text"}.`;
    case "upsert_customer":
      return "Merge mapped fields into the persistent customer profile.";
    case "upsert_order":
      return "Create or update the active commerce order with mapped values.";
    case "create_invoice":
      return `Create invoice state for ${typeof data.currency === "string" ? data.currency : "currency"} ${typeof data.total_amount === "number" ? data.total_amount : 0}.`;
    case "order_transition":
      return `Move the order to ${typeof data.status === "string" ? data.status : "the next"} status.`;
    default:
      return "Workflow state step.";
  }
}

export function WorkflowStateNode({
  data,
}: {
  data: Record<string, unknown> & { __meta?: BuilderNodeMeta; __runtime?: BuilderRuntimeData; __kind?: string; id?: string };
}) {
  const type = typeof data.__kind === "string" ? data.__kind : "";
  const label = data.__meta?.label?.trim() || "Workflow step";
  const runtime = data.__runtime;
  const nodeId = data.id ?? "";
  const Icon = ICONS[type as keyof typeof ICONS] ?? Waypoints;

  return (
    <div className="builder-node builder-node-action relative min-w-[300px] max-w-[380px] rounded-sm text-xs">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-white !bg-primary" />

      <div className="px-3 pb-2 pt-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-muted-foreground">Commerce</div>
            <div className="font-semibold leading-tight text-foreground">{label}</div>
            <div className="mt-2 text-[11px] leading-5 text-foreground/76">{describe(type, data)}</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  runtime?.onQuickAdd?.(nodeId, "default", {
                    x: rect.left + rect.width / 2,
                    y: rect.bottom,
                  });
                }}
              >
                <Plus className="h-3 w-3" />
                Add next
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  runtime?.onDeleteNode?.(nodeId);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/80 px-3 py-2">
        <span className="text-[9px] uppercase text-muted-foreground">Next</span>
        <Handle id="default" type="source" position={Position.Right} className="!h-3 !w-3 !border-white !bg-primary" />
      </div>
    </div>
  );
}
