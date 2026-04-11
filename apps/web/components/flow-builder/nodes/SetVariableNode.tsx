"use client";

import { Handle, Position } from "@xyflow/react";
import { Plus, Trash2, Variable } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BuilderNodeMeta, BuilderRuntimeData, SetVariableEditorData } from "../types";

export function SetVariableNode({ data }: { data: SetVariableEditorData & { __meta?: BuilderNodeMeta; __runtime?: BuilderRuntimeData; id?: string } }) {
  const label = data.__meta?.label?.trim() || "Set Variable";
  const runtime = data.__runtime;
  const nodeId = data.id ?? "";

  return (
    <div className="builder-node builder-node-action relative min-w-[300px] max-w-[380px] rounded-sm text-xs">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-white !bg-primary" />

      <div className="px-3 pb-2 pt-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-sm border border-border/85 bg-secondary/70 text-foreground">
            <Variable className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase text-muted-foreground">Variable</div>
            <div className="font-semibold leading-tight text-foreground">{label}</div>
            <div className="mt-2 rounded-sm border border-border/80 bg-secondary/55 px-2 py-1.5 font-mono text-[10px] text-muted-foreground">
              {data.path}
            </div>
            <div className="mt-2 text-[11px] text-foreground/74">Stores a reusable value for the rest of the workflow.</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  runtime?.onQuickAdd?.(nodeId, "default", {
                    x: rect.left + rect.width / 2,
                    y: rect.bottom,
                  });
                }}
              >
                <Plus className="h-3 w-3" />
                Add next
              </Button>
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  runtime?.onDeleteNode?.(nodeId);
                }}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative border-t border-border/80 px-3 py-2">
        <span className="text-[9px] uppercase text-muted-foreground">Next</span>
        <Handle id="default" type="source" position={Position.Right} className="!h-3 !w-3 !border-white !bg-primary" />
      </div>
    </div>
  );
}
