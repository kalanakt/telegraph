"use client";

import { Handle, Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import type { BuilderNodeMeta, BuilderRuntimeData, SwitchEditorData } from "../types";
import { NodeConnectActions } from "./NodeConnectActions";

export function SwitchNode({ data }: { data: SwitchEditorData & { __meta?: BuilderNodeMeta } }) {
  const label = data.__meta?.label?.trim() || "Switch";
  const path = data.path || "event.text";
  const runtime = (data as SwitchEditorData & { __runtime?: BuilderRuntimeData; id?: string }).__runtime;
  const nodeId = (data as SwitchEditorData & { id?: string }).id ?? "";

  return (
    <div className={`builder-node builder-node-condition relative min-w-[340px] max-w-[420px] rounded-sm px-3 py-3 text-xs ${runtime?.connectState === "source" ? "builder-node-connect-source" : ""} ${runtime?.canConnectToPending ? "builder-node-connect-target" : ""}`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-white !bg-primary"
      />

      <div className="flex items-start gap-2">
        <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
          <GitBranch className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Switch</div>
          <div className="font-semibold leading-tight text-foreground">{label}</div>
          <div className="mt-1 truncate rounded-sm border border-border/80 bg-secondary/55 px-1.5 py-1 font-mono text-[9px] text-muted-foreground">
            {path}
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2 border-t border-border/80 pt-3 pr-8">
        {data.cases.map((item, index) => (
          <div key={item.id} className="relative rounded-sm border border-border/80 bg-background/60 px-2 py-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Branch</div>
            <div className="text-[11px] font-semibold text-foreground">{item.label || `Case ${index + 1}`}</div>
            <div className="font-mono text-[9px] text-muted-foreground">{item.value || "(empty)"}</div>
            <NodeConnectActions nodeId={nodeId} sourceHandle={item.id} runtime={runtime} compact />
            <Handle
              id={item.id}
              type="source"
              position={Position.Right}
              style={{ top: `${36 + index * 78}px` }}
              className="!h-3 !w-3 !border-white !bg-primary"
            />
          </div>
        ))}
        <div className="relative rounded-sm border border-dashed border-border/80 bg-background/45 px-2 py-2">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Fallback</div>
          <div className="text-[11px] font-semibold text-foreground">Default branch</div>
          <div className="font-mono text-[9px] text-muted-foreground">fallback branch</div>
          <NodeConnectActions nodeId={nodeId} sourceHandle="default" runtime={runtime} compact />
          <Handle
            id="default"
            type="source"
            position={Position.Right}
            style={{ top: `${36 + data.cases.length * 78}px` }}
            className="!h-3 !w-3 !border-white !bg-primary"
          />
        </div>
      </div>
    </div>
  );
}
