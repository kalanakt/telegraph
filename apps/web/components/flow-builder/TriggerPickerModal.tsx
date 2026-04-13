"use client";

import { useState } from "react";
import {
  MessageCircle,
  MessageSquare,
  Terminal,
  MousePointerClick,
  Users,
  UserPlus,
  Heart,
  ShoppingCart,
  CreditCard,
  BarChart2,
  CheckSquare,
  Zap,
  Radio,
  X,
  Webhook,
} from "lucide-react";
import type { TriggerType } from "@telegram-builder/shared";
import { formatTriggerLabel, getTriggerGroups } from "@/lib/flow-builder";
import { Input } from "@/components/ui/input";

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  message_received: MessageCircle,
  message_edited: MessageSquare,
  channel_post_received: MessageCircle,
  channel_post_edited: MessageSquare,
  command_received: Terminal,
  callback_query_received: MousePointerClick,
  inline_query_received: Radio,
  chosen_inline_result_received: Radio,
  chat_member_updated: Users,
  my_chat_member_updated: Users,
  chat_join_request_received: UserPlus,
  message_reaction_updated: Heart,
  message_reaction_count_updated: Heart,
  shipping_query_received: ShoppingCart,
  pre_checkout_query_received: CreditCard,
  poll_received: BarChart2,
  poll_answer_received: CheckSquare,
  update_received: Zap,
  "cryptopay.invoice_paid": CreditCard,
  "webhook.received": Webhook,
};

export function getTriggerIcon(trigger: string): React.ElementType {
  return TRIGGER_ICONS[trigger] ?? Radio;
}

type Props = {
  open: boolean;
  currentTrigger: TriggerType;
  onSelect: (trigger: TriggerType) => void;
  onClose: () => void;
};

export function TriggerPickerModal({ open, currentTrigger, onSelect, onClose }: Props) {
  const [search, setSearch] = useState("");
  const groups = getTriggerGroups();

  if (!open) return null;

  const filtered = groups
    .map((group) => ({
      ...group,
      triggers: group.triggers.filter((t) =>
        t.toLowerCase().includes(search.toLowerCase()),
      ),
    }))
    .filter((group) => group.triggers.length > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/22 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-sm border border-border/85 bg-background/85 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Choose a trigger</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3">
          <Input
            placeholder="Search triggers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-80 overflow-y-auto px-3 pb-3">
          {filtered.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No triggers match your search.</p>
          ) : (
            filtered.map((group) => (
              <div key={group.id} className="mb-3">
                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.triggers.map((trigger) => {
                    const Icon = getTriggerIcon(trigger);
                    const isActive = trigger === currentTrigger;
                    return (
                      <button
                        key={trigger}
                        type="button"
                        onClick={() => {
                          onSelect(trigger);
                          onClose();
                        }}
                        className={`flex w-full items-center gap-3 rounded-sm px-3 py-2 text-left text-xs ${
                          isActive
                            ? "border border-border bg-secondary/80 text-foreground shadow-sm"
                            : "text-foreground/78"
                        }`}
                      >
                        <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-sm border border-border/80 ${isActive ? "bg-white" : "bg-secondary/65"}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium">{formatTriggerLabel(trigger)}</span>
                        <span className="ml-auto font-mono text-[9px] text-muted-foreground">{trigger}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
