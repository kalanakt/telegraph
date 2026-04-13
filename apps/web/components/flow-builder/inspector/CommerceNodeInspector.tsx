"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  normalizeAwaitCallbackNodeData,
  normalizeAwaitMessageNodeData,
  normalizeCollectContactNodeData,
  normalizeCollectShippingNodeData,
  normalizeCreateInvoiceNodeData,
  normalizeFormStepNodeData,
  normalizeOrderTransitionNodeData,
  normalizeUpsertCustomerNodeData,
  normalizeUpsertOrderNodeData,
} from "../utils";

type Props = {
  type: string;
  data: Record<string, unknown>;
  onUpdate: (partial: Record<string, unknown>) => void;
};

export function CommerceNodeInspector({ type, data, onUpdate }: Props) {
  if (type === "await_message") {
    const normalized = normalizeAwaitMessageNodeData(data);
    return (
      <div className="builder-section">
        <p className="builder-kicker">Await message</p>
        <label className="builder-label">
          <span>Store as</span>
          <Input value={normalized.store_as ?? ""} onChange={(event) => onUpdate({ store_as: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Timeout (ms)</span>
          <Input value={String(normalized.timeout_ms ?? "")} onChange={(event) => onUpdate({ timeout_ms: Number(event.target.value || 0) || undefined })} />
        </label>
      </div>
    );
  }

  if (type === "await_callback") {
    const normalized = normalizeAwaitCallbackNodeData(data);
    return (
      <div className="builder-section">
        <p className="builder-kicker">Await callback</p>
        <label className="builder-label">
          <span>Callback prefix</span>
          <Input value={normalized.callback_prefix ?? ""} onChange={(event) => onUpdate({ callback_prefix: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Store as</span>
          <Input value={normalized.store_as ?? ""} onChange={(event) => onUpdate({ store_as: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Timeout (ms)</span>
          <Input value={String(normalized.timeout_ms ?? "")} onChange={(event) => onUpdate({ timeout_ms: Number(event.target.value || 0) || undefined })} />
        </label>
      </div>
    );
  }

  if (type === "collect_contact") {
    const normalized = normalizeCollectContactNodeData(data);
    return (
      <div className="builder-section">
        <p className="builder-kicker">Collect contact</p>
        <label className="builder-label">
          <span>Timeout (ms)</span>
          <Input value={String(normalized.timeout_ms ?? "")} onChange={(event) => onUpdate({ timeout_ms: Number(event.target.value || 0) || undefined })} />
        </label>
      </div>
    );
  }

  if (type === "collect_shipping") {
    const normalized = normalizeCollectShippingNodeData(data);
    return (
      <div className="builder-section">
        <p className="builder-kicker">Collect shipping</p>
        <label className="builder-label">
          <span>Timeout (ms)</span>
          <Input value={String(normalized.timeout_ms ?? "")} onChange={(event) => onUpdate({ timeout_ms: Number(event.target.value || 0) || undefined })} />
        </label>
      </div>
    );
  }

  if (type === "form_step") {
    const normalized = normalizeFormStepNodeData(data);
    return (
      <div className="builder-section">
        <p className="builder-kicker">Form step</p>
        <label className="builder-label">
          <span>Field</span>
          <Input value={normalized.field} onChange={(event) => onUpdate({ field: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Source</span>
          <Select value={normalized.source} onValueChange={(value) => onUpdate({ source: value })}>
            <SelectTrigger className="builder-field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">text</SelectItem>
              <SelectItem value="contact_phone">contact_phone</SelectItem>
              <SelectItem value="contact_payload">contact_payload</SelectItem>
              <SelectItem value="shipping_address">shipping_address</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="builder-label mt-2">
          <span>Timeout (ms)</span>
          <Input value={String(normalized.timeout_ms ?? "")} onChange={(event) => onUpdate({ timeout_ms: Number(event.target.value || 0) || undefined })} />
        </label>
        <div className="mt-2 rounded-md border border-border/80 bg-background/65 px-3 py-2">
          <p className="text-[10px] font-semibold text-foreground/78">Prompting note</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            This step stores the next reply. Send the question with a separate message node right before it.
          </p>
        </div>
      </div>
    );
  }

  if (type === "upsert_customer") {
    const normalized = normalizeUpsertCustomerNodeData(data);
    return (
      <div className="builder-section">
        <p className="builder-kicker">Upsert customer</p>
        <Textarea
          rows={8}
          value={JSON.stringify(normalized.profile, null, 2)}
          onChange={(event) => {
            try {
              onUpdate({ profile: JSON.parse(event.target.value) });
            } catch {
              // ignore parse errors while typing
            }
          }}
        />
      </div>
    );
  }

  if (type === "upsert_order") {
    const normalized = normalizeUpsertOrderNodeData(data);
    return (
      <div className="builder-section">
        <p className="builder-kicker">Upsert order</p>
        <label className="builder-label">
          <span>Invoice payload</span>
          <Input value={normalized.invoice_payload ?? ""} onChange={(event) => onUpdate({ invoice_payload: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Currency</span>
          <Input value={normalized.currency ?? ""} onChange={(event) => onUpdate({ currency: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Total amount</span>
          <Input value={String(normalized.total_amount ?? "")} onChange={(event) => onUpdate({ total_amount: Number(event.target.value || 0) || undefined })} />
        </label>
        <Textarea
          rows={6}
          className="mt-2"
          value={JSON.stringify(normalized.data ?? {}, null, 2)}
          onChange={(event) => {
            try {
              onUpdate({ data: JSON.parse(event.target.value) });
            } catch {
              // ignore parse errors while typing
            }
          }}
        />
      </div>
    );
  }

  if (type === "create_invoice") {
    const normalized = normalizeCreateInvoiceNodeData(data);
    return (
      <div className="builder-section">
        <p className="builder-kicker">Create invoice</p>
        <label className="builder-label">
          <span>Invoice payload</span>
          <Input value={normalized.invoice_payload} onChange={(event) => onUpdate({ invoice_payload: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Title</span>
          <Input value={normalized.title ?? ""} onChange={(event) => onUpdate({ title: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Description</span>
          <Textarea rows={3} value={normalized.description ?? ""} onChange={(event) => onUpdate({ description: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Currency</span>
          <Input value={normalized.currency} onChange={(event) => onUpdate({ currency: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Total amount</span>
          <Input value={String(normalized.total_amount)} onChange={(event) => onUpdate({ total_amount: Number(event.target.value || 0) || undefined })} />
        </label>
      </div>
    );
  }

  if (type === "order_transition") {
    const normalized = normalizeOrderTransitionNodeData(data);
    return (
      <div className="builder-section">
        <p className="builder-kicker">Order transition</p>
        <label className="builder-label">
          <span>Status</span>
          <Input value={normalized.status} onChange={(event) => onUpdate({ status: event.target.value })} />
        </label>
        <label className="builder-label mt-2">
          <span>Note</span>
          <Textarea rows={3} value={normalized.note ?? ""} onChange={(event) => onUpdate({ note: event.target.value })} />
        </label>
      </div>
    );
  }

  return null;
}
