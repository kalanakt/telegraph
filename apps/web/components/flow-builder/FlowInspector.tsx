"use client";

import { Trash2 } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { TriggerType } from "@telegram-builder/shared";
import { Button } from "@/components/ui/button";
import { normalizeActionNodeData } from "./utils";
import { StartInspector } from "./inspector/StartInspector";
import { ConditionInspector } from "./inspector/ConditionInspector";
import { ActionInspector } from "./inspector/ActionInspector";
import type { ActionEditorData, ConditionEditorData, RuleOption } from "./types";

type Props = {
  selectedNode: Node | null;
  trigger: TriggerType;
  selectedRule: RuleOption | null;
  onTriggerChange: (trigger: TriggerType) => void;
  onUpdateNodeData: (partial: Record<string, unknown>) => void;
  onReplaceAction: (next: ActionEditorData) => void;
  onUpdateActionParams: (partial: Record<string, unknown>) => void;
  onDeleteNode: () => void;
};

export function FlowInspector({
  selectedNode,
  trigger,
  selectedRule,
  onTriggerChange,
  onUpdateNodeData,
  onReplaceAction,
  onUpdateActionParams,
  onDeleteNode,
}: Props) {
  const selectedAction =
    selectedNode?.type === "action"
      ? normalizeActionNodeData(selectedNode.data)
      : null;

  return (
    <div className="builder-inspector space-y-3 xl:sticky xl:top-6 xl:h-fit">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">Inspector</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDeleteNode}
          disabled={!selectedNode || selectedNode.type === "start"}
        >
          <Trash2 className="h-4 w-4" />
          Delete node
        </Button>
      </div>

      {!selectedNode ? (
        <div className="rounded-md border border-dashed border-border/80 bg-background/65 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">Select a node to edit it, or add one from the toolbar.</p>
        </div>
      ) : null}

      {selectedNode?.type === "start" ? (
        <StartInspector trigger={trigger} selectedRule={selectedRule} onTriggerChange={onTriggerChange} />
      ) : null}

      {selectedNode?.type === "condition" ? (
        <ConditionInspector
          data={(selectedNode.data as Record<string, unknown>) as ConditionEditorData}
          trigger={trigger}
          onUpdate={onUpdateNodeData}
        />
      ) : null}

      {selectedNode?.type === "action" && selectedAction ? (
        <ActionInspector
          action={selectedAction}
          trigger={trigger}
          onReplace={onReplaceAction}
          onUpdateParams={onUpdateActionParams}
        />
      ) : null}
    </div>
  );
}
