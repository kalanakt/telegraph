"use client";

import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ActionNode } from "@/components/flow-builder/nodes/ActionNode";
import { ConditionNode } from "@/components/flow-builder/nodes/ConditionNode";
import { StartNode } from "@/components/flow-builder/nodes/StartNode";
import { defaultEdgeOptions } from "@/components/flow-builder/utils";
import { cn } from "@/lib/utils";

const nodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
  start: StartNode,
};

const previewNodes: Node[] = [
  {
    id: "start",
    type: "start",
    position: { x: 300, y: 200 },
    data: {
      trigger: "message_received",
    },
  },
  {
    id: "condition",
    type: "condition",
    position: { x: 400, y: 368 },
    data: {
      type: "text_contains",
      value: "pricing",
    },
  },
  {
    id: "plans",
    type: "action",
    position: { x: 744, y: 256 },
    data: {
      type: "telegram.sendMessage",
      params: {
        chat_id: "{{event.chatId}}",
        text: "Send pricing options and a book-a-demo link",
      },
    },
  },
  {
    id: "notify",
    type: "action",
    position: { x: 1060, y: 256 },
    data: {
      type: "telegram.sendMessage",
      params: {
        chat_id: "{{ops.salesRoomId}}",
        text: "New sales-qualified lead in Telegram. Review and follow up.",
      },
    },
  },
  {
    id: "faq",
    type: "action",
    position: { x: 744, y: 468 },
    data: {
      type: "telegram.sendMessage",
      params: {
        chat_id: "{{event.chatId}}",
        text: "Share the quick-start menu and route to support answers",
      },
    },
  },
];

const previewEdges: Edge[] = [
  {
    id: "start-condition",
    source: "start",
    target: "condition",
    ...defaultEdgeOptions,
  },
  {
    id: "condition-plans",
    source: "condition",
    sourceHandle: "true",
    target: "plans",
    label: "true",
    ...defaultEdgeOptions,
  },
  {
    id: "plans-notify",
    source: "plans",
    target: "notify",
    ...defaultEdgeOptions,
  },
  {
    id: "condition-faq",
    source: "condition",
    sourceHandle: "false",
    target: "faq",
    label: "false",
    ...defaultEdgeOptions,
  },
];

export function LandingFlowPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "landing-flow-shell builder-canvas absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(var(--primary)/0.12),transparent_32%),radial-gradient(circle_at_top_right,oklch(var(--accent)/0.12),transparent_34%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(var(--border)/0.22)_1px,transparent_1px),linear-gradient(to_bottom,oklch(var(--border)/0.22)_1px,transparent_1px)] bg-[size:34px_34px]" />
      <div className="relative h-full">
        <ReactFlow
          className="builder-flow"
          nodes={previewNodes}
          edges={previewEdges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          defaultViewport={{ x: 380, y: 48, zoom: 0.74 }}
          minZoom={0.6}
          maxZoom={1.1}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          nodesFocusable={false}
          panOnDrag={false}
          zoomOnDoubleClick={false}
          zoomOnPinch={false}
          zoomOnScroll={false}
          preventScrolling={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Lines}
            gap={34}
            size={0.65}
            color="rgba(148, 163, 184, 0.14)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
