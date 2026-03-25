"use client";

import { Handle, Position } from "@xyflow/react";
import { Image, FileText, Video, Send, Zap, Plus, Link } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCapabilityLabel, migrateLegacyActionData, summarizeAction } from "@/lib/flow-builder";
import { deriveButtonHandles, getReplyMarkupKind } from "../utils";
import type { ActionEditorData, AddBranch, AddKind, NodeCallbacks } from "../types";

const ACTION_ICONS: Record<string, React.ElementType> = {
  "telegram.sendMessage": Send,
  "telegram.sendPhoto": Image,
  "telegram.sendVideo": Video,
  "telegram.sendDocument": FileText,
};

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

export function ActionNode({ data }: { data: ActionEditorData & NodeCallbacks }) {
  const payload = migrateLegacyActionData(data);
  const params = payload.params as Record<string, unknown>;
  const Icon = ACTION_ICONS[payload.type] ?? Zap;
  const label = getCapabilityLabel(payload.type);
  const summary = summarizeAction(payload);
  const buttonHandles = deriveButtonHandles(params);
  const replyMarkupKind = getReplyMarkupKind(params);
  const hasButtons = buttonHandles.length > 0;
  const isMedia = payload.type === "telegram.sendPhoto" || payload.type === "telegram.sendVideo" || payload.type === "telegram.sendDocument";

  // Calculate default handle top offset — below all button handles
  // Each button row is ~28px + 4px gap, starts at ~80px from top
  const buttonHandleAreaHeight = hasButtons ? buttonHandles.length * 32 + 8 : 0;
  const defaultHandleOffset = hasButtons ? undefined : undefined; // handled via className

  return (
    <div className="builder-node builder-node-action relative min-w-[280px] rounded-xl text-xs text-sky-950">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-white !bg-sky-500"
      />

      {/* Header */}
      <div className="px-3 pt-2.5 pb-2">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="text-[10px] uppercase tracking-[0.08em] text-sky-700/80">Action</div>
              <Badge variant="secondary" className="h-4 px-1 text-[9px] font-mono">
                {payload.type.replace("telegram.", "")}
              </Badge>
            </div>
            <div className="font-semibold leading-tight">{label}</div>
          </div>
        </div>

        {/* Content preview */}
        {isMedia ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="builder-node-media-icon h-6 w-6">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="line-clamp-1 font-mono text-[9px] text-sky-700/70">{summary}</span>
          </div>
        ) : (
          <p className="mt-1.5 line-clamp-2 text-[11px] text-sky-900/80 italic">&ldquo;{summary}&rdquo;</p>
        )}
      </div>

      {/* Inline keyboard button handles */}
      {hasButtons && (
        <div className="border-t border-sky-100 px-3 pb-2 pt-1.5 space-y-1">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-sky-500/70 mb-1">
            {replyMarkupKind === "inline" ? "Inline buttons" : "Reply buttons"}
          </p>
          {buttonHandles.map((btn, idx) => (
            <div key={btn.id} className="builder-button-handle-row">
              <span className="truncate font-medium">{btn.label}</span>
              <span className="flex items-center gap-1 font-mono text-[8px] text-indigo-500/70 truncate max-w-[80px]">
                {btn.callbackData}
              </span>
              {/* The handle appears on the right edge of the row */}
              <Handle
                id={btn.id}
                type="source"
                position={Position.Right}
                className="!h-2.5 !w-2.5 !border-white !bg-indigo-400"
                style={{ right: -8, position: "absolute", top: "50%", transform: "translateY(-50%)" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Default next handle + add buttons */}
      <div className="relative">
        {hasButtons && (
          <div className="border-t border-sky-100/60 px-3 py-1.5">
            <span className="text-[9px] text-sky-400">Default flow</span>
          </div>
        )}
        <Handle
          id="default"
          type="source"
          position={Position.Right}
          className="!h-2.5 !w-2.5 !border-white !bg-sky-500"
        />
        <div className="absolute -right-[188px] top-1/2 -translate-y-1/2">
          <AddButtons onAdd={data.onAdd} branch="next" />
        </div>
      </div>
    </div>
  );
}
