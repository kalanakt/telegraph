import {
  addEdge,
  Background,
  type Connection,
  Controls,
  type Edge,
  MiniMap,
  type Node,
  type NodeTypes,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import { DragEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useFlow, usePublishFlow, useSaveFlow } from "../api/flows";
import { FlowToolbar } from "../components/flow/FlowToolbar";
import { NodeConfigPanel } from "../components/flow/NodeConfigPanel";
import { NodePalette } from "../components/flow/NodePalette";
import { AiPromptNode } from "../components/flow/nodes/AiPromptNode";
import { CallbackTriggerNode } from "../components/flow/nodes/CallbackTriggerNode";
import { CommandTriggerNode } from "../components/flow/nodes/CommandTriggerNode";
import { ConditionNode } from "../components/flow/nodes/ConditionNode";
import { HttpRequestNode } from "../components/flow/nodes/HttpRequestNode";
import { MessageTriggerNode } from "../components/flow/nodes/MessageTriggerNode";
import { SendMediaNode } from "../components/flow/nodes/SendMediaNode";
import { SendMessageNode } from "../components/flow/nodes/SendMessageNode";
import { SetVariableNode } from "../components/flow/nodes/SetVariableNode";
import { WaitForInputNode } from "../components/flow/nodes/WaitForInputNode";

const nodeTypes: NodeTypes = {
  command_trigger: CommandTriggerNode,
  message_trigger: MessageTriggerNode,
  callback_trigger: CallbackTriggerNode,
  send_message: SendMessageNode,
  send_media: SendMediaNode,
  http_request: HttpRequestNode,
  ai_prompt: AiPromptNode,
  condition: ConditionNode,
  set_variable: SetVariableNode,
  wait_for_input: WaitForInputNode,
};

function generateNodeId() {
  return `node_${crypto.randomUUID().slice(0, 8)}`;
}

export function FlowEditor() {
  const { botId, flowId } = useParams<{ botId: string; flowId: string }>();
  const { data: flow } = useFlow(botId!, flowId!);
  const saveFlow = useSaveFlow();
  const publishFlow = usePublishFlow();

  const [nodes, setNodes, onNodesChangeDefault] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChangeDefault] = useEdgesState<Edge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [isDirty, setIsDirty] = useState(false);
  const selectedNode = useMemo(
    () => nodes.find((n) => n.selected),
    [nodes],
  );

  const onNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChangeDefault>[0]) => {
      setIsDirty(true);
      onNodesChangeDefault(changes);
    },
    [onNodesChangeDefault],
  );

  const onEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChangeDefault>[0]) => {
      setIsDirty(true);
      onEdgesChangeDefault(changes);
    },
    [onEdgesChangeDefault],
  );

  // Warn on unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Load flow data
  useEffect(() => {
    if (flow) {
      setNodes(flow.nodes.length > 0 ? flow.nodes : []);
      setEdges(flow.edges.length > 0 ? flow.edges : []);
      setIsDirty(false);
    }
  }, [flow, setNodes, setEdges]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: generateNodeId(),
        type,
        position,
        data: { label: type },
      };

      setNodes((nds) => [...nds, newNode]);
      setIsDirty(true);
    },
    [setNodes, screenToFlowPosition],
  );

  const handleSave = () => {
    saveFlow.mutate(
      { botId: botId!, flowId: flowId!, nodes, edges },
      { onSuccess: () => setIsDirty(false) },
    );
  };

  const handlePublish = () => {
    publishFlow.mutate({ botId: botId!, flowId: flowId! });
  };

  const handleNodeDataChange = useCallback(
    (id: string, data: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) => (n.id === id ? { ...n, data } : n)),
      );
    },
    [setNodes],
  );

  return (
    <div className="flex h-full flex-col">
      <FlowToolbar
        flowName={flow?.name ?? "Flow"}
        onSave={handleSave}
        onPublish={handlePublish}
        isSaving={saveFlow.isPending}
        isPublishing={publishFlow.isPending}
      />
      <div className="flex flex-1 overflow-hidden">
        <NodePalette />
        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onChange={handleNodeDataChange}
          />
        )}
      </div>
    </div>
  );
}
