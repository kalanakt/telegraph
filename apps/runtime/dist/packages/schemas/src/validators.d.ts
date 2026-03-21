import type { FlowGraph } from './flow-graph.js';
import type { ExecutionPlan } from './plan.js';
export declare function validateFlowGraph(data: unknown): {
    success: true;
    data: FlowGraph;
} | {
    success: false;
    error: string;
};
export declare function validateExecutionPlan(data: unknown): {
    success: true;
    data: ExecutionPlan;
} | {
    success: false;
    error: string;
};
//# sourceMappingURL=validators.d.ts.map