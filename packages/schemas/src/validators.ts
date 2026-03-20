import type { FlowGraph } from './flow-graph.js';
import { FlowGraph as FlowGraphSchema } from './flow-graph.js';
import type { ExecutionPlan } from './plan.js';
import { ExecutionPlan as ExecutionPlanSchema } from './plan.js';

export function validateFlowGraph(
  data: unknown,
): { success: true; data: FlowGraph } | { success: false; error: string } {
  const result = FlowGraphSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.message };
}

export function validateExecutionPlan(
  data: unknown,
): { success: true; data: ExecutionPlan } | { success: false; error: string } {
  const result = ExecutionPlanSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.message };
}
