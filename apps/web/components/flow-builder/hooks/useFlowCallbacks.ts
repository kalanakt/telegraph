import { useCallback } from "react";
import { addEdge, type Connection, type Edge, type Node } from "@xyflow/react";
import { type TriggerType } from "@telegram-builder/shared";
import {
  canCreateConnection,
  createFlowNode,
  defaultEdgeOptions,
  makeEdgeId,
  normalizeActionNodeData,
} from "../utils";
import type { ActionEditorData, FlowNodeKind } from "../types";

type FlowState = {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  selectedNode: Node | null;
};

export function useFlowCallbacks(state: FlowState, setStatus: (msg: string) => void) {
  const { nodes, setNodes, edges, setEdges, selectedNodeId, setSelectedNodeId, selectedNode } = state;

  const setTrigger = useCallback(
    (trigger: TriggerType) => {
      setNodes((curr) =>
        curr.map((node) => {
          if (node.type !== "start") return node;
          return { ...node, data: { ...node.data, trigger } };
        }),
      );
    },
    [setNodes],
  );

  const addNode = useCallback(
    (
      kind: FlowNodeKind,
      viewportCenter?: { x: number; y: number },
    ) => {
      if (kind === "start" && nodes.some((node) => node.type === "start")) {
        setStatus("Only one trigger node is allowed in a flow.");
        return;
      }

      const newNode = createFlowNode(kind, nodes, viewportCenter);
      setNodes((curr) => [...curr, newNode]);
      setSelectedNodeId(newNode.id);
      setStatus("");
    },
    [nodes, setNodes, setSelectedNodeId, setStatus],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!canCreateConnection(connection, nodes, edges)) {
        setStatus("Connection blocked: branch already used, duplicate edge, or invalid.");
        return;
      }

      const edge: Edge = {
        id: makeEdgeId(connection),
        source: connection.source ?? "",
        target: connection.target ?? "",
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        label:
          connection.sourceHandle === "true" || connection.sourceHandle === "false"
            ? connection.sourceHandle
            : undefined,
        ...defaultEdgeOptions,
      };

      setStatus("");
      setEdges((current) => addEdge(edge, current));
    },
    [edges, nodes, setEdges, setNodes, setSelectedNodeId, setStatus],
  );

  const updateSelectedNodeData = useCallback(
    (partial: Record<string, unknown>) => {
      if (!selectedNodeId) return;
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== selectedNodeId) return node;
          return { ...node, data: { ...(node.data as Record<string, unknown>), ...partial } };
        }),
      );
    },
    [selectedNodeId, setNodes],
  );

  const replaceSelectedAction = useCallback(
    (nextAction: ActionEditorData) => {
      if (!selectedNodeId) return;
      setNodes((current) =>
        current.map((node) => {
          if (node.id !== selectedNodeId || node.type !== "action") return node;
          return { ...node, data: nextAction };
        }),
      );
    },
    [selectedNodeId, setNodes],
  );

  const updateSelectedActionParams = useCallback(
    (partial: Record<string, unknown>) => {
      const selectedAction =
        selectedNode?.type === "action"
          ? normalizeActionNodeData(selectedNode.data)
          : null;
      if (!selectedAction) return;
      replaceSelectedAction({
        ...selectedAction,
        params: { ...selectedAction.params, ...partial },
      });
    },
    [replaceSelectedAction, selectedNode],
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) =>
      current.filter(
        (edge) => edge.source !== selectedNodeId && edge.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
    setStatus("Node removed.");
  }, [selectedNodeId, setEdges, setNodes, setSelectedNodeId, setStatus]);

  return {
    setTrigger,
    addNode,
    onConnect,
    updateSelectedNodeData,
    replaceSelectedAction,
    updateSelectedActionParams,
    deleteSelectedNode,
  };
}
