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
import type { ConditionEditorData, NodeCallbacks } from "../types";

const CONDITION_ICONS: Record<string, React.ElementType> = {
  text_contains: MessageSquare,
  text_equals: MessageSquare,
  from_user_id: User,
  from_username_equals: User,
  chat_id_equals: Hash,
  chat_type_equals: Users,
  message_source_equals: Globe,
  variable_equals: Variable,
  variable_exists: Variable,
  callback_data_equals: MousePointerClick,
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
  if (data.value !== undefined && data.value !== "") return String(data.value);
  return "Set value in inspector";
}

function formatConditionLabel(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function ConditionNode({ data }: { data: ConditionEditorData & NodeCallbacks }) {
  const type = data.type ?? "text_contains";
  const Icon = CONDITION_ICONS[type] ?? Filter;
  const summary = formatConditionSummary(data);

  return (
    <div className="builder-node builder-node-condition relative min-w-[250px] rounded-md px-3 py-3 text-xs">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-black !bg-white"
      />

      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-white/10 bg-white/6 text-white">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.12em] text-white/45">Condition</div>
          <div className="font-semibold leading-tight text-white">{formatConditionLabel(type)}</div>
          <div className="mt-1 truncate rounded-sm border border-white/8 bg-white/4 px-1.5 py-1 font-mono text-[9px] text-white/58">
            {summary}
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-[32%] -translate-y-1/2">
        <span className="rounded-sm border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] font-semibold text-white/62">
          true
        </span>
      </div>
      <div className="absolute right-4 top-[72%] -translate-y-1/2">
        <span className="rounded-sm border border-white/10 bg-white/5 px-1 py-0.5 text-[9px] font-semibold text-white/62">
          false
        </span>
      </div>

      <Handle
        id="true"
        type="source"
        position={Position.Right}
        style={{ top: "35%" }}
        className="!h-2.5 !w-2.5 !border-black !bg-white"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Right}
        style={{ top: "72%" }}
        className="!h-2.5 !w-2.5 !border-black !bg-white"
      />
    </div>
  );
}
