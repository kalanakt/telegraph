import { FlowGraph as FlowGraphSchema } from './flow-graph.js';
import { ExecutionPlan as ExecutionPlanSchema } from './plan.js';
export function validateFlowGraph(data) {
    const result = FlowGraphSchema.safeParse(data);
    if (result.success)
        return { success: true, data: result.data };
    return { success: false, error: result.error.message };
}
export function validateExecutionPlan(data) {
    const result = ExecutionPlanSchema.safeParse(data);
    if (result.success)
        return { success: true, data: result.data };
    return { success: false, error: result.error.message };
}
//# sourceMappingURL=validators.js.map