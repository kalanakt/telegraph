import { useCallback } from "react";
import { addEdge, type Connection, type Edge, type Node } from "@xyflow/react";
import { type TriggerType } from "@telegram-builder/shared";
import { createActionTemplate } from "@/lib/flow-builder";
import {
  canCreateConnection,
  defaultConditionData,
  defaultEdgeOptions,
  deriveButtonHandles,
  makeEdgeId,
  normalizeActionNodeData,
} from "../utils";
import type { ActionEditorData, AddBranch, AddKind } from "../types";

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

  const addFromNode = useCallback(
    (parentId: string, branch: AddBranch, kind: AddKind) => {
      const parent = nodes.find((node) => node.id === parentId);
      if (!parent) return;

      const idPrefix = kind === "condition" ? "condition" : "action";
      const newId = `${idPrefix}_${Date.now()}`;
      const parentX = parent.position.x;
      const parentY = parent.position.y;
      const branchOffset = branch === "true" ? -100 : branch === "false" ? 100 : 0;

      const newNode: Node = {
        id: newId,
        type: kind,
        position: { x: parentX + 320, y: parentY + branchOffset },
        data:
          kind === "condition"
            ? defaultConditionData()
            : createActionTemplate("telegram.sendMessage"),
      };

      const newEdge: Edge = {
        id: `${parentId}_${branch}_${newId}_${Date.now()}`,
        source: parentId,
        target: newId,
        sourceHandle:
          parent.type === "condition" && (branch === "true" || branch === "false")
            ? branch
            : undefined,
        label:
          parent.type === "condition" && (branch === "true" || branch === "false")
            ? branch
            : undefined,
        ...defaultEdgeOptions,
      };

      setNodes((curr) => [...curr, newNode]);
      setEdges((curr) => [...curr, newEdge]);
      setSelectedNodeId(newId);
    },
    [nodes, setEdges, setNodes, setSelectedNodeId],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!canCreateConnection(connection, nodes, edges)) {
        setStatus("Connection blocked: branch already used, duplicate edge, or invalid.");
        return;
      }

      // Handle button callback connections — auto-insert a callback_data_equals condition
      if (connection.sourceHandle?.startsWith("button-")) {
        const sourceNode = nodes.find((n) => n.id === connection.source);
        if (sourceNode) {
          const params = (sourceNode.data as Record<string, unknown>)?.params as Record<string, unknown> ?? {};
          const handles = deriveButtonHandles(params);
          const buttonSpec = handles.find((h) => h.id === connection.sourceHandle);

          if (buttonSpec) {
            const conditionId = `condition_${Date.now()}`;
            const conditionNode: Node = {
              id: conditionId,
              type: "condition",
              position: {
                x: (sourceNode.position.x ?? 0) + 320,
                y: sourceNode.position.y ?? 0,
              },
              data: { type: "callback_data_equals", value: buttonSpec.callbackData },
            };

            const edgeToCondition: Edge = {
              id: makeEdgeId(connection),
              source: connection.source ?? "",
              target: conditionId,
              sourceHandle: connection.sourceHandle ?? undefined,
              label: buttonSpec.label,
              ...defaultEdgeOptions,
            };

            // Edge from condition true branch to the actual target
            const edgeFromCondition: Edge = {
              id: `${conditionId}_true_${connection.target}_${Date.now()}`,
              source: conditionId,
              target: connection.target ?? "",
              sourceHandle: "true",
              label: "true",
              ...defaultEdgeOptions,
            };

            setNodes((curr) => [...curr, conditionNode]);
            setEdges((curr) => [...curr, edgeToCondition, edgeFromCondition]);
            setSelectedNodeId(conditionId);
            setStatus("");
            return;
          }
        }
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
    addFromNode,
    onConnect,
    updateSelectedNodeData,
    replaceSelectedAction,
    updateSelectedActionParams,
    deleteSelectedNode,
  };
}
