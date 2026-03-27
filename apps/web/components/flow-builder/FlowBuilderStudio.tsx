"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { IsValidConnection, Node } from "@xyflow/react";
import { flowDefinitionSchema } from "@telegram-builder/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useFlowState } from "./hooks/useFlowState";
import { useFlowCallbacks } from "./hooks/useFlowCallbacks";
import { canCreateConnection, defaultFlowDefinition, toFlowDefinition } from "./utils";
import { FlowToolbar } from "./FlowToolbar";
import { FlowCanvas } from "./FlowCanvas";
import { FlowInspector } from "./FlowInspector";
import type { BotOption, RuleOption } from "./types";

type Props = {
  bots: BotOption[];
  rules: RuleOption[];
  initialRuleId?: string;
};

export function FlowBuilderStudio({ bots, rules, initialRuleId }: Props) {
  const [botId, setBotId] = useState(bots[0]?.id ?? "");
  const [name, setName] = useState("Flow");
  const [selectedRuleId, setSelectedRuleId] = useState<string>(initialRuleId ?? "new");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [viewportCenter, setViewportCenter] = useState({ x: 220, y: 180 });

  const flowState = useFlowState(defaultFlowDefinition());
  const {
    nodes,
    setNodes,
    onNodesChange,
    edges,
    setEdges,
    onEdgesChange,
    selectedNodeId,
    setSelectedNodeId,
    selectedNode,
    trigger,
    loadFlow,
  } = flowState;

  const callbacks = useFlowCallbacks(
    { nodes, setNodes, edges, setEdges, selectedNodeId, setSelectedNodeId, selectedNode },
    setStatus,
  );

  const {
    setTrigger,
    addNode,
    onConnect,
    updateSelectedNodeData,
    replaceSelectedAction,
    updateSelectedActionParams,
    deleteSelectedNode,
  } = callbacks;

  useEffect(() => {
    setSelectedRuleId(initialRuleId ?? "new");
  }, [initialRuleId]);

  // Load rule when selectedRuleId changes
  useEffect(() => {
    const existing = rules.find((rule) => rule.id === selectedRuleId);
    if (!existing) {
      loadFlow(defaultFlowDefinition());
      setBotId(bots[0]?.id ?? "");
      setName("Flow");
      return;
    }
    setBotId(existing.botId);
    setName(existing.name);
    loadFlow(existing.flowDefinition, existing.trigger);
  }, [bots, rules, selectedRuleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...(node.data as Record<string, unknown>),
          onTriggerChange: setTrigger,
        },
      })),
    [nodes, setTrigger],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => canCreateConnection(connection, nodes, edges),
    [edges, nodes],
  );

  const onSelectionChange = useCallback(
    ({ nodes: selected }: { nodes: Node[] }) => {
      setSelectedNodeId(selected[0]?.id ?? null);
    },
    [setSelectedNodeId],
  );

  async function saveFlow() {
    setIsSaving(true);
    setStatus("Validating...");

    const flowDefinition = toFlowDefinition(nodes, edges);
    const parsed = flowDefinitionSchema.safeParse(flowDefinition);
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Flow graph is invalid.";
      const friendlyMessage =
        message === "Flow must include exactly one start node."
          ? "Add exactly one trigger node before saving."
          : message.includes("not reachable from the start node")
          ? "Connect every condition and action to the trigger flow before saving."
          : message;
      setStatus(friendlyMessage);
      setIsSaving(false);
      return;
    }

    const body: Record<string, unknown> = {
      botId,
      name,
      trigger,
      flowDefinition: parsed.data,
    };

    const isUpdating = selectedRuleId !== "new";
    if (isUpdating) body.ruleId = selectedRuleId;

    setStatus(isUpdating ? "Updating flow..." : "Creating flow...");

    const res = await fetch("/api/flows", {
      method: isUpdating ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) {
      const issueMessage =
        Array.isArray(json.issues) && json.issues.length > 0
          ? `${json.issues[0]?.path || "flow"}: ${json.issues[0]?.message || "invalid"}`
          : null;
      setStatus(issueMessage ?? json.error ?? "Could not save flow.");
      setIsSaving(false);
      return;
    }

    setStatus(isUpdating ? "Flow updated." : "Flow created.");
    setIsSaving(false);
    const nextId = (json.rule?.id as string | undefined) ?? selectedRuleId;
    window.location.href = `/flows?edit=${nextId}`;
  }

  if (bots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create Flow</CardTitle>
          <CardDescription>Add a Telegram bot first to enable flow creation.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="surface-panel border-white/70 bg-white/95">
      <CardHeader>
        <CardTitle className="text-xl">Flows Studio</CardTitle>
        <CardDescription>
          Add trigger, condition, and action nodes from the toolbar, connect them on the canvas, then configure the selected node in the inspector.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FlowToolbar
          botId={botId}
          bots={bots}
          name={name}
          selectedRuleId={selectedRuleId}
          rules={rules}
          isSaving={isSaving}
          status={status}
          nodeCount={nodes.length}
          edgeCount={edges.length}
          hasTrigger={nodes.some((node) => node.type === "start")}
          onBotChange={setBotId}
          onNameChange={setName}
          onRuleChange={setSelectedRuleId}
          onAddNode={(kind) => addNode(kind, viewportCenter)}
          onSave={saveFlow}
        />

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          <FlowCanvas
            nodes={displayNodes}
            edges={edges}
            trigger={trigger}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            isValidConnection={isValidConnection}
            onViewportCenterChange={setViewportCenter}
          />

          <FlowInspector
            selectedNode={selectedNode}
            trigger={trigger}
            onTriggerChange={setTrigger}
            onUpdateNodeData={updateSelectedNodeData}
            onReplaceAction={replaceSelectedAction}
            onUpdateActionParams={updateSelectedActionParams}
            onDeleteNode={deleteSelectedNode}
          />
        </div>
      </CardContent>
    </Card>
  );
}
