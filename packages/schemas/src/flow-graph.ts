import { z } from 'zod';

import { FlowNode } from './node-types.js';

export const FlowEdge = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  label: z.string().optional(),
});
export type FlowEdge = z.infer<typeof FlowEdge>;

export const FlowGraphV1 = z.object({
  nodes: z.array(FlowNode),
  edges: z.array(FlowEdge),
});
export type FlowGraphV1 = z.infer<typeof FlowGraphV1>;

export const FlowGraphV2 = z.object({
  schemaVersion: z.literal(2),
  nodes: z.array(FlowNode),
  edges: z.array(FlowEdge),
});
export type FlowGraphV2 = z.infer<typeof FlowGraphV2>;

// Canonical graph contract moving forward.
export type FlowGraph = FlowGraphV2;
