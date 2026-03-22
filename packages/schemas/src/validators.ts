import type { FlowGraph, FlowGraphV2 } from './flow-graph.js';
import {
  FlowGraphV1 as FlowGraphV1Schema,
  FlowGraphV2 as FlowGraphV2Schema,
} from './flow-graph.js';
import type { ExecutionPlan } from './plan.js';
import { ExecutionPlan as ExecutionPlanSchema } from './plan.js';

export function validateFlowGraph(
  data: unknown,
): { success: true; data: FlowGraph } | { success: false; error: string } {
  const migrated = migrateFlowGraph(data);
  if (!migrated.success) return migrated;
  return { success: true, data: migrated.data };
}

export function validateFlowGraphV2(
  data: unknown,
): { success: true; data: FlowGraphV2 } | { success: false; error: string } {
  const result = FlowGraphV2Schema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.message };
}

export function migrateFlowGraph(
  data: unknown,
): { success: true; data: FlowGraph } | { success: false; error: string } {
  const v2 = FlowGraphV2Schema.safeParse(data);
  if (v2.success) return { success: true, data: v2.data };

  const v1 = FlowGraphV1Schema.safeParse(data);
  if (v1.success) {
    return {
      success: true,
      data: {
        schemaVersion: 2,
        nodes: v1.data.nodes,
        edges: v1.data.edges,
      },
    };
  }

  return {
    success: false,
    error: v2.error.message,
  };
}

export function validateExecutionPlan(
  data: unknown,
): { success: true; data: ExecutionPlan } | { success: false; error: string } {
  const result = ExecutionPlanSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.message };
}
