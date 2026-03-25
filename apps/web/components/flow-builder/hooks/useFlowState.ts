import { useMemo, useState } from "react";
import { useEdgesState, useNodesState, type Edge, type Node } from "@xyflow/react";
import { type FlowDefinition, type TriggerType } from "@telegram-builder/shared";
import { toCanvasEdges, toCanvasNodes, defaultFlowDefinition, extractTriggerFromNodes } from "../utils";

export function useFlowState(initialFlow?: FlowDefinition, initialTrigger?: TriggerType) {
  const flow = initialFlow ?? defaultFlowDefinition();
  const [nodes, setNodes, onNodesChange] = useNodesState(
    toCanvasNodes(flow, initialTrigger),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(toCanvasEdges(flow));
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const trigger = useMemo(() => extractTriggerFromNodes(nodes), [nodes]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId],
  );

  function loadFlow(flow: FlowDefinition, legacyTrigger?: TriggerType) {
    setNodes(toCanvasNodes(flow, legacyTrigger));
    setEdges(toCanvasEdges(flow));
    setSelectedNodeId(null);
  }

  return {
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
  };
}
