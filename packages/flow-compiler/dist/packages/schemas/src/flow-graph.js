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
export const FlowGraph = z.object({
    nodes: z.array(FlowNode),
    edges: z.array(FlowEdge),
});
//# sourceMappingURL=flow-graph.js.map