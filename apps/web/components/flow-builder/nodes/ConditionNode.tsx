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
import type { BuilderNodeMeta, BuilderRuntimeData, ConditionEditorData } from "../types";
import { NodeConnectActions } from "./NodeConnectActions";

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

export function ConditionNode({ data }: { data: ConditionEditorData & { __meta?: BuilderNodeMeta } }) {
  const type = data.type ?? "text_contains";
  const Icon = CONDITION_ICONS[type] ?? Filter;
  const summary = formatConditionSummary(data);
  const label = data.__meta?.label?.trim() || formatConditionLabel(type);
  const runtime = (data as ConditionEditorData & { __runtime?: BuilderRuntimeData; id?: string }).__runtime;
  const nodeId = (data as ConditionEditorData & { id?: string }).id ?? "";

  return (
    <div className={`builder-node builder-node-condition relative min-w-[320px] max-w-[380px] rounded-sm px-3 py-3 text-xs ${runtime?.connectState === "source" ? "builder-node-connect-source" : ""} ${runtime?.canConnectToPending ? "builder-node-connect-target" : ""}`}>
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
          <div className="font-semibold leading-tight text-foreground">{label}</div>
          <div className="mt-0.5 text-[10px] text-foreground/80">{formatConditionLabel(type)}</div>
          <div className="mt-2 rounded-sm border border-border/80 bg-secondary/55 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
            {summary}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-border/80 pt-3 pr-8">
        {[
          { handle: "true", label: "True branch", tone: "bg-emerald-50 text-emerald-700" },
          { handle: "false", label: "False branch", tone: "bg-rose-50 text-rose-700" },
        ].map((branch, index) => (
          <div key={branch.handle} className="relative rounded-sm border border-border/80 bg-background/60 px-2 py-2">
            <div className="flex items-center gap-2">
              <span className={`rounded-sm border border-border/80 px-1.5 py-0.5 text-[9px] font-semibold ${branch.tone}`}>
                {branch.handle}
              </span>
              <span className="text-[11px] font-medium text-foreground">{branch.label}</span>
            </div>
            <NodeConnectActions nodeId={nodeId} sourceHandle={branch.handle} runtime={runtime} compact />
            <Handle
              id={branch.handle}
              type="source"
              position={Position.Right}
              style={{ top: "50%" }}
              className="!h-3 !w-3 !border-white !bg-primary"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
