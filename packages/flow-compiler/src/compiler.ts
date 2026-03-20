import { nanoid } from 'nanoid';
import type {
  CallbackTokenMap,
  ExecutionPlan,
  FlowEdge,
  FlowGraph,
  FlowNode,
  PlanNode,
  TriggerMapping,
} from '@telegraph/schemas';

export interface CompileResult {
  plan: ExecutionPlan;
  callbackMap: CallbackTokenMap;
}

export interface CompileError {
  message: string;
  nodeId?: string;
}

export class CompileValidationError extends Error {
  readonly errors: CompileError[];

  constructor(errors: CompileError[]) {
    super(`Compilation failed with ${errors.length} error(s): ${errors.map((e) => e.message).join('; ')}`);
    this.name = 'CompileValidationError';
    this.errors = errors;
  }
}

const TRIGGER_TYPES: ReadonlySet<string> = new Set([
  'command_trigger',
  'message_trigger',
  'callback_trigger',
]);

function isTrigger(node: FlowNode): boolean {
  return TRIGGER_TYPES.has(node.type);
}

/** Validate the graph and return any errors. */
export function validate(graph: FlowGraph): CompileError[] {
  const errors: CompileError[] = [];
  const nodeIds = new Set(graph.nodes.map((n) => n.id));

  // Must have at least one trigger
  const triggers = graph.nodes.filter(isTrigger);
  if (triggers.length === 0) {
    errors.push({ message: 'Flow must have at least one trigger node' });
  }

  // Every edge must reference valid source and target
  for (const edge of graph.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({ message: `Edge "${edge.id}" references unknown source "${edge.source}"` });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({ message: `Edge "${edge.id}" references unknown target "${edge.target}"` });
    }
    // No self-referencing edges
    if (edge.source === edge.target) {
      errors.push({ message: `Edge "${edge.id}" is self-referencing on node "${edge.source}"` });
    }
  }

  // Check for orphan nodes: every non-trigger must be reachable from a trigger
  const reachable = new Set<string>();
  const adjacency = new Map<string, string[]>();
  for (const edge of graph.edges) {
    const targets = adjacency.get(edge.source);
    if (targets) {
      targets.push(edge.target);
    } else {
      adjacency.set(edge.source, [edge.target]);
    }
  }

  // BFS from all triggers
  const queue = triggers.map((t) => t.id);
  for (const id of queue) {
    reachable.add(id);
  }
  let head = 0;
  while (head < queue.length) {
    const current = queue[head++]!;
    const neighbors = adjacency.get(current);
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!reachable.has(neighbor)) {
          reachable.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
  }

  for (const node of graph.nodes) {
    if (!reachable.has(node.id)) {
      errors.push({
        message: `Node "${node.id}" is not reachable from any trigger`,
        nodeId: node.id,
      });
    }
  }

  return errors;
}

/** Resolve trigger nodes into TriggerMapping entries. */
function resolveTriggers(graph: FlowGraph): TriggerMapping[] {
  const triggers: TriggerMapping[] = [];

  for (const node of graph.nodes) {
    if (!isTrigger(node)) continue;

    // Find the first outgoing edge to determine entryNodeId
    const outEdge = graph.edges.find((e) => e.source === node.id);
    const entryNodeId = outEdge ? outEdge.target : node.id;

    const config = node.config as Record<string, unknown>;

    switch (node.type) {
      case 'command_trigger':
        triggers.push({
          type: 'command',
          pattern: (config['command'] as string) ?? '',
          entryNodeId,
        });
        break;
      case 'message_trigger':
        triggers.push({
          type: 'message',
          pattern: (config['pattern'] as string) ?? '',
          entryNodeId,
        });
        break;
      case 'callback_trigger':
        triggers.push({
          type: 'callback_query',
          pattern: (config['callbackData'] as string) ?? '',
          entryNodeId,
        });
        break;
    }
  }

  return triggers;
}

/** Build outgoing edges for a given node. */
function buildEdges(node: FlowNode, graphEdges: FlowEdge[]): PlanNode['edges'] {
  const outgoing = graphEdges.filter((e) => e.source === node.id);

  if (node.type === 'condition') {
    const config = node.config as Record<string, unknown>;
    const rules = (config['rules'] as Array<{ targetEdgeId: string }> | undefined) ?? [];
    const defaultEdgeId = config['defaultEdgeId'] as string | undefined;

    return outgoing.map((edge) => {
      // Check if this edge matches a rule
      const rule = rules.find((r) => r.targetEdgeId === edge.id);
      if (rule) {
        return { condition: edge.id, targetNodeId: edge.target };
      }
      // Check if it's the default edge
      if (defaultEdgeId === edge.id) {
        return { condition: undefined, targetNodeId: edge.target };
      }
      return { condition: edge.id, targetNodeId: edge.target };
    });
  }

  return outgoing.map((edge) => ({
    targetNodeId: edge.target,
  }));
}

/** Compile all nodes into PlanNode records keyed by node ID. */
function compileNodes(graph: FlowGraph): Record<string, PlanNode> {
  const nodes: Record<string, PlanNode> = {};

  for (const node of graph.nodes) {
    nodes[node.id] = {
      id: node.id,
      type: node.type,
      config: node.config,
      edges: buildEdges(node, graph.edges),
    };
  }

  return nodes;
}

/**
 * Compile a FlowGraph into an immutable ExecutionPlan and callback token map.
 */
export function compile(flowId: string, version: number, graph: FlowGraph): CompileResult {
  // 1. Validate
  const errors = validate(graph);
  if (errors.length > 0) {
    throw new CompileValidationError(errors);
  }

  // 2. Resolve triggers
  const triggers = resolveTriggers(graph);

  // 3. Compile nodes
  const nodes = compileNodes(graph);

  // 4. Generate callback tokens for wait_for_input nodes
  const planId = nanoid();
  const callbackMap: CallbackTokenMap = {};

  for (const node of graph.nodes) {
    if (node.type === 'wait_for_input') {
      const token = `cb_${nanoid(16)}`;
      callbackMap[token] = { nodeId: node.id, planId };
    }
  }

  // 5. Emit plan
  const plan: ExecutionPlan = {
    id: planId,
    flowId,
    version,
    triggers,
    nodes,
    metadata: {
      compiledAt: new Date().toISOString(),
      nodeCount: Object.keys(nodes).length,
    },
  };

  return { plan, callbackMap };
}
