import { useCallback } from "react";
import { addEdge, type Connection, type Edge, type Node } from "@xyflow/react";
import { type TriggerType } from "@telegram-builder/shared";
import {
  canCreateConnection,
  createFlowNode,
  createBuilderEdge,
  normalizeActionNodeData,
} from "../utils";
import type { ActionEditorData, FlowNodeKind } from "../types";

type FlowState = {
  nodes: Node[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  edges: Edge[];
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  selectedNodeId: string | null;
  setSelectedNodeId: React.Dispatch<React.SetStateAction<string | null>>;
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
      options?: {
        actionType?: import("@telegram-builder/shared").ActionPayload["type"];
        trigger?: TriggerType;
        position?: { x: number; y: number };
      },
    ) => {
      if (kind === "start" && nodes.some((node) => node.type === "start")) {
        setStatus("Only one trigger node is allowed in a flow.");
        return;
      }

      const newNode = createFlowNode(kind, nodes, viewportCenter, options);
      setNodes((curr) => [...curr, newNode]);
      setSelectedNodeId(newNode.id);
      setStatus("");
      return newNode;
    },
    [nodes, setNodes, setSelectedNodeId, setStatus],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!canCreateConnection(connection, nodes, edges)) {
        setStatus("Connection blocked: branch already used, duplicate edge, or invalid.");
        return;
      }

      const edge: Edge = createBuilderEdge(connection);

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

  const deleteNodeById = useCallback(
    (nodeId: string) => {
      const node = nodes.find((item) => item.id === nodeId);
      if (!node || node.type === "start") return;

      const incoming = edges.filter((edge) => edge.target === nodeId);
      const outgoing = edges.filter((edge) => edge.source === nodeId);
      const remainingNodes = nodes.filter((item) => item.id !== nodeId);
      const remainingEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);

      let nextEdges = remainingEdges;
      const isLinearPassthrough =
        (
          node.type === "action" ||
          node.type === "set_variable" ||
          node.type === "delay" ||
          node.type === "await_message" ||
          node.type === "await_callback" ||
          node.type === "collect_contact" ||
          node.type === "collect_shipping" ||
          node.type === "form_step" ||
          node.type === "upsert_customer" ||
          node.type === "upsert_order" ||
          node.type === "create_invoice" ||
          node.type === "order_transition"
        ) && outgoing.length === 1;

      if (isLinearPassthrough) {
        const downstream = outgoing[0];
        if (!downstream) {
          setNodes(remainingNodes);
          setEdges(nextEdges);
          setSelectedNodeId((current) => (current === nodeId ? null : current));
          setStatus("Node removed.");
          return;
        }
        const additions: Edge[] = [];

        for (const edge of incoming) {
          const candidate = createBuilderEdge({
            source: edge.source,
            sourceHandle: edge.sourceHandle ?? null,
            target: downstream.target,
            targetHandle: downstream.targetHandle ?? null,
          });

          if (
            candidate.source !== candidate.target &&
            canCreateConnection(candidate, remainingNodes, [...nextEdges, ...additions])
          ) {
            additions.push(candidate);
          }
        }

        nextEdges = [...nextEdges, ...additions];
      }

      setNodes(remainingNodes);
      setEdges(nextEdges);
      setSelectedNodeId((current) => (current === nodeId ? null : current));
      setStatus("Node removed.");
    },
    [edges, nodes, setEdges, setNodes, setSelectedNodeId, setStatus],
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) return;
    deleteNodeById(selectedNodeId);
  }, [deleteNodeById, selectedNodeId]);

  return {
    setTrigger,
    addNode,
    onConnect,
    updateSelectedNodeData,
    replaceSelectedAction,
    updateSelectedActionParams,
    deleteNodeById,
    deleteSelectedNode,
  };
}
