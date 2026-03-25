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
  Plus,
} from "lucide-react";
import type { AddBranch, AddKind, ConditionEditorData, NodeCallbacks } from "../types";

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

function AddButtons({
  onAdd,
  branch = "next",
}: {
  onAdd?: (branch: AddBranch, kind: AddKind) => void;
  branch?: AddBranch;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className="nodrag nopan inline-flex h-6 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        onClick={() => onAdd?.(branch, "condition")}
      >
        <Plus className="h-3 w-3" /> Condition
      </button>
      <button
        type="button"
        className="nodrag nopan inline-flex h-6 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        onClick={() => onAdd?.(branch, "action")}
      >
        <Plus className="h-3 w-3" /> Action
      </button>
    </div>
  );
}

export function ConditionNode({ data }: { data: ConditionEditorData & NodeCallbacks }) {
  const type = data.type ?? "text_contains";
  const Icon = CONDITION_ICONS[type] ?? Filter;
  const summary = formatConditionSummary(data);

  return (
    <div className="builder-node builder-node-condition relative min-w-[250px] rounded-xl px-3 py-2.5 text-xs text-amber-950">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-white !bg-amber-500"
      />

      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.08em] text-amber-700/80">Condition</div>
          <div className="font-semibold leading-tight">{formatConditionLabel(type)}</div>
          <div className="mt-0.5 truncate rounded bg-amber-100/60 px-1 py-0.5 font-mono text-[9px] text-amber-800">
            {summary}
          </div>
        </div>
      </div>

      {/* True branch label */}
      <div className="absolute right-3 top-[32%] -translate-y-1/2">
        <span className="rounded-sm bg-emerald-100 px-1 py-0.5 text-[9px] font-semibold text-emerald-700">
          ✓ true
        </span>
      </div>
      {/* False branch label */}
      <div className="absolute right-3 top-[72%] -translate-y-1/2">
        <span className="rounded-sm bg-rose-100 px-1 py-0.5 text-[9px] font-semibold text-rose-600">
          ✗ false
        </span>
      </div>

      <Handle
        id="true"
        type="source"
        position={Position.Right}
        style={{ top: "35%" }}
        className="!h-2.5 !w-2.5 !border-white !bg-emerald-500"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Right}
        style={{ top: "72%" }}
        className="!h-2.5 !w-2.5 !border-white !bg-rose-500"
      />

      <div className="absolute -right-[188px] top-[33%] -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="true" />
      </div>
      <div className="absolute -right-[188px] top-[70%] -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="false" />
      </div>
    </div>
  );
}
