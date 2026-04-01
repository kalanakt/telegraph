"use client";

import { Handle, Position } from "@xyflow/react";
import {
  Filter,
  MessageSquare,
  User,
  Hash,
  Users,
  Globe,
  Variable,
  GitBranch,
  MousePointerClick,
} from "lucide-react";
import type { ConditionEditorData } from "../types";

const CONDITION_ICONS: Record<string, React.ElementType> = {
  text_contains: MessageSquare,
  text_equals: MessageSquare,
  text_starts_with: MessageSquare,
  text_ends_with: MessageSquare,
  from_user_id: User,
  from_username_equals: User,
  chat_id_equals: Hash,
  chat_type_equals: Users,
  message_source_equals: Globe,
  variable_equals: Variable,
  variable_exists: Variable,
  callback_data_equals: MousePointerClick,
  callback_data_contains: MousePointerClick,
  command_equals: MessageSquare,
  command_args_contains: MessageSquare,
  inline_query_contains: MessageSquare,
  target_user_id_equals: Users,
  old_status_equals: Users,
  new_status_equals: Users,
  message_has_photo: MessageSquare,
  message_has_video: MessageSquare,
  message_has_document: MessageSquare,
  message_has_sticker: MessageSquare,
  message_has_location: MessageSquare,
  message_has_contact: MessageSquare,
  all: GitBranch,
  any: GitBranch,
};

function formatConditionSummary(data: ConditionEditorData): string {
  const type = data.type ?? "text_contains";
  if (type === "variable_equals") return `${data.key ?? "key"} = "${data.value ?? ""}"`;
  if (type === "variable_exists") return `${data.key ?? "key"} exists`;
  if (type === "all") return "All conditions match";
  if (type === "any") return "Any condition matches";
  if (type === "callback_data_equals") return `data = "${data.value ?? ""}"`;
  if (type === "callback_data_contains") return `data contains "${data.value ?? ""}"`;
  if (type === "command_equals") return `command = "${data.value ?? ""}"`;
  if (type === "command_args_contains") return `args contains "${data.value ?? ""}"`;
  if (type === "inline_query_contains") return `query contains "${data.value ?? ""}"`;
  if (type === "target_user_id_equals") return `target = ${data.value ?? ""}`;
  if (type === "old_status_equals") return `old = "${data.value ?? ""}"`;
  if (type === "new_status_equals") return `new = "${data.value ?? ""}"`;
  if (type.startsWith("message_has_")) return type.replace("message_has_", "has ");
  if (data.value !== undefined && data.value !== "") return String(data.value);
  return "Set value in inspector";
}

function formatConditionLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ConditionNode({ data }: { data: ConditionEditorData }) {
  const type = data.type ?? "text_contains";
  const Icon = CONDITION_ICONS[type] ?? Filter;
  const summary = formatConditionSummary(data);

  return (
    <div className="builder-node builder-node-condition relative min-w-[250px] rounded-sm px-3 py-3 text-xs">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-white !bg-primary"
      />

      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Condition</div>
          <div className="font-semibold leading-tight text-foreground">{formatConditionLabel(type)}</div>
          <div className="mt-1 truncate rounded-sm border border-border/80 bg-secondary/55 px-1.5 py-1 font-mono text-[9px] text-muted-foreground">
            {summary}
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-[32%] -translate-y-1/2">
        <span className="rounded-sm border border-border/80 bg-emerald-50 px-1 py-0.5 text-[9px] font-semibold text-emerald-700">
          true
        </span>
      </div>
      <div className="absolute right-4 top-[72%] -translate-y-1/2">
        <span className="rounded-sm border border-border/80 bg-rose-50 px-1 py-0.5 text-[9px] font-semibold text-rose-700">
          false
        </span>
      </div>

      <Handle
        id="true"
        type="source"
        position={Position.Right}
        style={{ top: "35%" }}
        className="!h-3 !w-3 !border-white !bg-primary"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Right}
        style={{ top: "72%" }}
        className="!h-3 !w-3 !border-white !bg-primary"
      />
    </div>
  );
}
