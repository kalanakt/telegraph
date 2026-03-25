"use client";

import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  type Connection,
  type Edge,
  type IsValidConnection,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { TriggerType } from "@telegram-builder/shared";
import { StartNode } from "./nodes/StartNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { ActionNode } from "./nodes/ActionNode";
import { defaultEdgeOptions } from "./utils";
import { formatTriggerLabel, getTriggerIcon } from "./TriggerPickerModal";

const nodeTypes = {
  start: StartNode,
  condition: ConditionNode,
  action: ActionNode,
};

type Props = {
  nodes: Node[];
  edges: Edge[];
  trigger: TriggerType;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onSelectionChange: (params: { nodes: Node[] }) => void;
  isValidConnection: IsValidConnection;
};

export function FlowCanvas({
  nodes,
  edges,
  trigger,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectionChange,
  isValidConnection,
}: Props) {
  const TriggerIcon = getTriggerIcon(trigger);

  return (
    <div className="builder-canvas h-[720px] overflow-hidden rounded-2xl border border-slate-200/90">
      <ReactFlow
        className="builder-flow"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        isValidConnection={isValidConnection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
        fitViewOptions={{ padding: 0.16, includeHiddenNodes: false }}
        proOptions={{ hideAttribution: true }}
      >
        <Panel
          position="top-left"
          className="flex items-center gap-2 rounded-lg border border-slate-200/80 bg-white/92 px-2.5 py-1.5 text-xs text-slate-700"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-100 text-indigo-600">
            <TriggerIcon className="h-3 w-3" />
          </span>
          {formatTriggerLabel(trigger)}
        </Panel>

        <MiniMap
          pannable
          zoomable
          className="!rounded-lg !border !border-slate-200 !bg-white/90"
          nodeBorderRadius={12}
          maskColor="rgba(15, 23, 42, 0.08)"
        />
        <Controls showInteractive={false} position="bottom-left" />
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1.1}
          color="#cdd5e6"
        />
      </ReactFlow>
    </div>
  );
}
