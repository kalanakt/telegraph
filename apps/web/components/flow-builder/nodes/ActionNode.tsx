"use client";

import { Handle, Position } from "@xyflow/react";
import { Image, FileText, Video, Send, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCapabilityLabel, migrateLegacyActionData, summarizeAction } from "@/lib/flow-builder";
import type { ActionEditorData } from "../types";

const ACTION_ICONS: Record<string, React.ElementType> = {
  "telegram.sendMessage": Send,
  "telegram.sendPhoto": Image,
  "telegram.sendVideo": Video,
  "telegram.sendDocument": FileText,
};

export function ActionNode({ data }: { data: ActionEditorData }) {
  const payload = migrateLegacyActionData(data);
  const Icon = ACTION_ICONS[payload.type] ?? Zap;
  const label = getCapabilityLabel(payload.type);
  const summary = summarizeAction(payload);
  const isMedia =
    payload.type === "telegram.sendPhoto" ||
    payload.type === "telegram.sendVideo" ||
    payload.type === "telegram.sendDocument";

  return (
    <div className="builder-node builder-node-action relative min-w-[280px] rounded-sm text-xs">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-white !bg-primary"
      />

      <div className="px-3 pb-2 pt-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Action</div>
              <Badge
                variant="secondary"
                className="h-4 rounded-sm border border-border/80 bg-secondary/75 px-1 text-[9px] font-mono text-foreground/72"
              >
                {payload.type.replace("telegram.", "")}
              </Badge>
            </div>
            <div className="font-semibold leading-tight text-foreground">{label}</div>
          </div>
        </div>

        {isMedia ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="builder-node-media-icon h-6 w-6">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <span className="line-clamp-1 font-mono text-[9px] text-muted-foreground">{summary}</span>
          </div>
        ) : (
          <p className="mt-2 line-clamp-2 text-[11px] text-foreground/76">&ldquo;{summary}&rdquo;</p>
        )}
      </div>

      <div className="relative border-t border-border/80 px-3 py-2">
        <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Next</span>
        <Handle
          id="default"
          type="source"
          position={Position.Right}
          className="!h-3 !w-3 !border-white !bg-primary"
        />
      </div>
    </div>
  );
}
