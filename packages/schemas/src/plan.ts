import { z } from 'zod';

import { NodeType } from './node-types.js';

export const PlanEdge = z.object({
  condition: z.string().optional(),
  targetNodeId: z.string().min(1),
});

export const PlanNode = z.object({
  id: z.string().min(1),
  type: NodeType,
  config: z.record(z.unknown()),
  edges: z.array(PlanEdge),
});
export type PlanNode = z.infer<typeof PlanNode>;

export const TriggerMapping = z.object({
  type: z.enum(['command', 'message', 'callback_query']),
  pattern: z.string(),
  entryNodeId: z.string().min(1),
  matchType: z.enum(['exact', 'contains', 'regex']).optional(),
});
export type TriggerMapping = z.infer<typeof TriggerMapping>;

export const ExecutionPlan = z.object({
  id: z.string(),
  flowId: z.string(),
  version: z.number(),
  triggers: z.array(TriggerMapping),
  nodes: z.record(PlanNode),
  metadata: z.object({
    compiledAt: z.string(),
    nodeCount: z.number(),
  }),
});
export type ExecutionPlan = z.infer<typeof ExecutionPlan>;

export const CallbackTokenMap = z.record(
  z.object({
    nodeId: z.string(),
    planId: z.string(),
  }),
);
export type CallbackTokenMap = z.infer<typeof CallbackTokenMap>;
