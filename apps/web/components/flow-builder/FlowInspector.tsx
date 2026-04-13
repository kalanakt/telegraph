"use client";

import { Trash2 } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { TriggerType } from "@telegram-builder/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getNodeMeta,
  normalizeActionNodeData,
  normalizeDelayNodeData,
  normalizeSetVariableNodeData,
  normalizeSwitchNodeData,
} from "./utils";
import { StartInspector } from "./inspector/StartInspector";
import { ConditionInspector } from "./inspector/ConditionInspector";
import { ActionInspector } from "./inspector/ActionInspector";
import { SwitchInspector } from "./inspector/SwitchInspector";
import { SetVariableInspector } from "./inspector/SetVariableInspector";
import { DelayInspector } from "./inspector/DelayInspector";
import { CommerceNodeInspector } from "./inspector/CommerceNodeInspector";
import { TokenBrowser } from "./inspector/TokenBrowser";
import type {
  ActionEditorData,
  ConditionEditorData,
  DelayEditorData,
  RuleOption,
  SetVariableEditorData,
  SwitchEditorData,
} from "./types";

const COMMERCE_NODE_TYPES = [
  "await_message",
  "await_callback",
  "collect_contact",
  "collect_shipping",
  "form_step",
  "upsert_customer",
  "upsert_order",
  "create_invoice",
  "order_transition",
] as const;

type Props = {
  selectedNode: Node | null;
  trigger: TriggerType;
  selectedRule: RuleOption | null;
  onTriggerChange: (trigger: TriggerType) => void;
  onUpdateNodeData: (partial: Record<string, unknown>) => void;
  onReplaceAction: (next: ActionEditorData) => void;
  onUpdateActionParams: (partial: Record<string, unknown>) => void;
  onDeleteNode: () => void;
  availableTokens: string[];
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
  availableTokens,
}: Props) {
  const selectedAction =
    selectedNode?.type === "action"
      ? normalizeActionNodeData(selectedNode.data)
      : null;
  const selectedSwitch =
    selectedNode?.type === "switch" ? normalizeSwitchNodeData(selectedNode.data) : null;
  const selectedVariable =
    selectedNode?.type === "set_variable" ? normalizeSetVariableNodeData(selectedNode.data) : null;
  const selectedDelay =
    selectedNode?.type === "delay" ? normalizeDelayNodeData(selectedNode.data) : null;
  const selectedCommerceNode =
    selectedNode && COMMERCE_NODE_TYPES.includes(selectedNode.type as (typeof COMMERCE_NODE_TYPES)[number])
      ? selectedNode
      : null;
  const selectedMeta = selectedNode ? getNodeMeta(selectedNode.data, { label: "Node", key: selectedNode.id }) : null;

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

      {selectedNode ? (
        <div className="builder-section">
          <p className="builder-kicker">Node settings</p>
          <label className="builder-label">
            <span>Label</span>
            <Input
              value={selectedMeta?.label ?? ""}
              onChange={(event) =>
                onUpdateNodeData({
                  __meta: {
                    ...(selectedMeta ?? {}),
                    label: event.target.value,
                  },
                })
              }
            />
          </label>
          <label className="builder-label mt-2">
            <span>Key</span>
            <Input
              value={selectedMeta?.key ?? ""}
              onChange={(event) =>
                onUpdateNodeData({
                  __meta: {
                    ...(selectedMeta ?? {}),
                    key: event.target.value,
                  },
                })
              }
            />
          </label>
        </div>
      ) : null}

      {selectedNode?.type === "condition" ? (
        <ConditionInspector
          data={(selectedNode.data as Record<string, unknown>) as ConditionEditorData}
          trigger={trigger}
          onUpdate={onUpdateNodeData}
        />
      ) : null}

      {selectedNode?.type === "switch" && selectedSwitch ? (
        <SwitchInspector data={selectedSwitch} onUpdate={onUpdateNodeData} />
      ) : null}

      {selectedNode?.type === "set_variable" && selectedVariable ? (
        <SetVariableInspector data={selectedVariable} onUpdate={onUpdateNodeData} />
      ) : null}

      {selectedNode?.type === "delay" && selectedDelay ? (
        <DelayInspector data={selectedDelay} onUpdate={onUpdateNodeData} />
      ) : null}

      {selectedCommerceNode ? (
        <CommerceNodeInspector
          type={String(selectedCommerceNode.type)}
          data={selectedCommerceNode.data as Record<string, unknown>}
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

      {selectedNode ? <TokenBrowser tokens={availableTokens} /> : null}
    </div>
  );
}
