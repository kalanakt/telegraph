"use client";

import { useCallback, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  type ReactFlowInstance,
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
  onViewportCenterChange: (center: { x: number; y: number }) => void;
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
  onViewportCenterChange,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const TriggerIcon = getTriggerIcon(trigger);

  const syncViewportCenter = useCallback(
    (instance: ReactFlowInstance) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;
      onViewportCenterChange(
        instance.screenToFlowPosition({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        }),
      );
    },
    [onViewportCenterChange],
  );

  return (
    <div
      ref={wrapperRef}
      className="builder-canvas relative h-[720px] overflow-hidden rounded-sm border border-border/80"
    >
      {nodes.length === 0 ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
          <div className="max-w-sm rounded-sm border border-border/85 bg-background/80 px-4 py-3 text-center text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
            Add a trigger, condition, or action from the toolbar, then connect them with lines.
          </div>
        </div>
      ) : null}

      <ReactFlow
        className="builder-flow"
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Strict}
        connectionLineType={ConnectionLineType.Bezier}
        isValidConnection={isValidConnection}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onNodeClick={(_, node) => onSelectionChange({ nodes: [node] })}
        onPaneClick={() => onSelectionChange({ nodes: [] })}
        connectionRadius={26}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
        fitViewOptions={{ padding: 0.16, includeHiddenNodes: false }}
        proOptions={{ hideAttribution: true }}
        onInit={(instance) => {
          instanceRef.current = instance;
          syncViewportCenter(instance);
        }}
        onMoveEnd={() => {
          if (instanceRef.current) {
            syncViewportCenter(instanceRef.current);
          }
        }}
      >
        <Panel
          position="top-left"
          className="flex items-center gap-2 rounded-sm border border-border/85 bg-background/80 px-2.5 py-1.5 text-xs text-foreground shadow-sm backdrop-blur-sm"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-sm border border-border/80 bg-secondary/70 text-foreground">
            <TriggerIcon className="h-3 w-3" />
          </span>
          {formatTriggerLabel(trigger)}
        </Panel>

        <MiniMap
          pannable
          zoomable
          className="!rounded-sm !border !border-border/85 !bg-background/80"
          nodeBorderRadius={4}
          maskColor="rgba(148, 163, 184, 0.18)"
        />
        <Controls showInteractive={false} position="bottom-left" />
        <Background
          variant={BackgroundVariant.Lines}
          gap={26}
          size={0.6}
          color="rgba(148, 163, 184, 0.18)"
        />
      </ReactFlow>
    </div>
  );
}
