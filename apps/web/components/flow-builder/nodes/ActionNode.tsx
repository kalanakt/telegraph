"use client";

import { Handle, Position } from "@xyflow/react";
import { ExternalLink, FileText, Image, Link2, Plus, Send, Video, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCapabilityLabel, migrateLegacyActionData, summarizeAction } from "@/lib/flow-builder";
import { getInlineKeyboard } from "../utils";
import type { ActionEditorData, BuilderNodeMeta, BuilderRuntimeData } from "../types";
import { NodeConnectActions } from "./NodeConnectActions";

const ACTION_ICONS: Record<string, React.ElementType> = {
  "telegram.sendMessage": Send,
  "telegram.sendPhoto": Image,
  "telegram.sendVideo": Video,
  "telegram.sendDocument": FileText,
};

function getUploadedPhotoUrl(payload: { type: string; params: Record<string, unknown> }): string | null {
  if (payload.type !== "telegram.sendPhoto") return null;

  const raw = payload.params.photo;
  if (typeof raw !== "string") return null;

  const value = raw.trim();
  if (!value || value.includes("{{")) return null;
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) return value;

  return null;
}

export function ActionNode({ data }: { data: ActionEditorData & { __meta?: BuilderNodeMeta } }) {
  const payload = migrateLegacyActionData(data);
  const Icon = ACTION_ICONS[payload.type] ?? Zap;
  const label = getCapabilityLabel(payload.type);
  const summary = summarizeAction(payload);
  const photoUrl = getUploadedPhotoUrl(payload as unknown as { type: string; params: Record<string, unknown> });
  const isMedia =
    payload.type === "telegram.sendPhoto" ||
    payload.type === "telegram.sendVideo" ||
    payload.type === "telegram.sendDocument";
  const nodeLabel = data.__meta?.label?.trim() || label;
  const runtime = (data as ActionEditorData & { __runtime?: BuilderRuntimeData; id?: string }).__runtime;
  const nodeId = (data as ActionEditorData & { id?: string }).id ?? "";
  const inlineButtons = getInlineKeyboard(payload.params);

  return (
    <div className={`builder-node builder-node-action relative min-w-[320px] max-w-[420px] rounded-sm text-xs ${runtime?.connectState === "source" ? "builder-node-connect-source" : ""} ${runtime?.canConnectToPending ? "builder-node-connect-target" : ""}`}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-white !bg-primary" />

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
            <div className="font-semibold leading-tight text-foreground">{nodeLabel}</div>
            <div className="mt-0.5 text-[10px] text-foreground/80">{label}</div>
          </div>
        </div>

        {isMedia ? (
          <div className="mt-3 flex items-center gap-2 rounded-sm border border-border/80 bg-background/55 px-2 py-2">
            {photoUrl ? (
              <span className="builder-node-media-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </span>
            ) : (
              <span className="builder-node-media-icon h-6 w-6">
                <Icon className="h-3.5 w-3.5" />
              </span>
            )}
            <span className="line-clamp-2 text-[11px] text-foreground/76">{summary}</span>
          </div>
        ) : (
          <p className="mt-3 line-clamp-3 rounded-sm border border-border/80 bg-background/55 px-2 py-2 text-[11px] leading-5 text-foreground/76">
            &ldquo;{summary}&rdquo;
          </p>
        )}

        {inlineButtons.length > 0 ? (
          <div className="mt-3 space-y-2 border-t border-border/80 pt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Inline buttons
              </p>
              <Badge variant="outline" className="h-5 rounded-sm border-border/80 bg-background/80 px-1.5 text-[9px] text-foreground/72">
                {inlineButtons.reduce((count, row) => count + row.length, 0)} buttons
              </Badge>
            </div>

            {inlineButtons.map((row, rowIndex) => (
              <div key={`row-${rowIndex}`} className="flex flex-wrap gap-2">
                {row.map((button, buttonIndex) => {
                  const linked = runtime?.linkedCallbackFlows?.find(
                    (item) => item.token === button.callback_data && item.buttonLabel === button.text,
                  );

                  return (
                    <div key={`${button.text}-${buttonIndex}`} className="min-w-[140px] flex-1 rounded-sm border border-border/80 bg-background/65 px-2 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[11px] font-semibold text-foreground">{button.text}</span>
                        {button.url ? <ExternalLink className="h-3 w-3 text-muted-foreground" /> : null}
                      </div>
                      <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                        {button.callback_data || button.url || "No callback_data yet"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            runtime?.onLinkCallbackFlow?.(nodeId, rowIndex, buttonIndex);
                          }}
                        >
                          <Link2 className="h-3 w-3" />
                          {linked ? "Open link" : "Link callback"}
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            runtime?.onCreateCallbackFlow?.(nodeId, rowIndex, buttonIndex);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                          Create callback
                        </Button>
                      </div>
                      {linked ? (
                        <div className="mt-2 text-[10px] text-emerald-700">
                          Linked to {linked.ruleName}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative border-t border-border/80 px-3 py-2">
        <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Next</span>
        <NodeConnectActions nodeId={nodeId} runtime={runtime} />
        <Handle id="default" type="source" position={Position.Right} className="!h-3 !w-3 !border-white !bg-primary" />
      </div>
    </div>
  );
}
