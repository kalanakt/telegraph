"use client";

import { Handle, Position } from "@xyflow/react";
import { Variable } from "lucide-react";
import type { BuilderNodeMeta, BuilderRuntimeData, SetVariableEditorData } from "../types";
import { NodeConnectActions } from "./NodeConnectActions";

export function SetVariableNode({ data }: { data: SetVariableEditorData & { __meta?: BuilderNodeMeta } }) {
  const label = data.__meta?.label?.trim() || "Set Variable";
  const runtime = (data as SetVariableEditorData & { __runtime?: BuilderRuntimeData; id?: string }).__runtime;
  const nodeId = (data as SetVariableEditorData & { id?: string }).id ?? "";

  return (
    <div className={`builder-node builder-node-action relative min-w-[300px] max-w-[380px] rounded-sm text-xs ${runtime?.connectState === "source" ? "builder-node-connect-source" : ""} ${runtime?.canConnectToPending ? "builder-node-connect-target" : ""}`}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-white !bg-primary" />

      <div className="px-3 pb-2 pt-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
            <Variable className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Variable</div>
            <div className="font-semibold leading-tight text-foreground">{label}</div>
            <div className="mt-2 rounded-sm border border-border/80 bg-secondary/55 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
              {data.path}
            </div>
            <div className="mt-2 text-[11px] text-foreground/74">Stores a reusable value for the rest of the workflow.</div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/80 px-3 py-2">
        <span className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground">Next</span>
        <NodeConnectActions nodeId={nodeId} runtime={runtime} />
        <Handle id="default" type="source" position={Position.Right} className="!h-3 !w-3 !border-white !bg-primary" />
      </div>
    </div>
  );
}
