import type { FlowGraph } from "@telegraph/schemas";
import { migrateFlowGraph, validateFlowGraphV2 } from "@telegraph/schemas";

export function normalizeFlowGraph(input: unknown): {
  ok: true;
  graph: FlowGraph;
} | {
  ok: false;
  error: string;
} {
  const migrated = migrateFlowGraph(input);
  if (!migrated.success) {
    return { ok: false, error: migrated.error };
  }

  const validated = validateFlowGraphV2(migrated.data);
  if (!validated.success) {
    return { ok: false, error: validated.error };
  }

  return { ok: true, graph: validated.data };
}
