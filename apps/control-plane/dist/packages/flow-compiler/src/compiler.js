import { nanoid } from 'nanoid';
export class CompileValidationError extends Error {
    errors;
    constructor(errors) {
        super(`Compilation failed with ${errors.length} error(s): ${errors.map((e) => e.message).join('; ')}`);
        this.name = 'CompileValidationError';
        this.errors = errors;
    }
}
const TRIGGER_TYPES = new Set([
    'command_trigger',
    'message_trigger',
    'callback_trigger',
]);
function isTrigger(node) {
    return TRIGGER_TYPES.has(node.type);
}
/** Validate the graph and return any errors. */
export function validate(graph) {
    const errors = [];
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
    const reachable = new Set();
    const adjacency = new Map();
    for (const edge of graph.edges) {
        const targets = adjacency.get(edge.source);
        if (targets) {
            targets.push(edge.target);
        }
        else {
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
        const current = queue[head++];
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
    errors.push(...detectCycles(graph));
    return errors;
}
/** Detect cycles in the graph using DFS from trigger nodes. */
function detectCycles(graph) {
    const errors = [];
    // Build adjacency list
    const adjacency = new Map();
    for (const edge of graph.edges) {
        const targets = adjacency.get(edge.source);
        if (targets) {
            targets.push(edge.target);
        }
        else {
            adjacency.set(edge.source, [edge.target]);
        }
    }
    const triggers = graph.nodes.filter((n) => TRIGGER_TYPES.has(n.type));
    const visited = new Set();
    const inStack = new Set();
    const reportedCycles = new Set();
    function dfs(nodeId, path) {
        if (inStack.has(nodeId)) {
            // Extract cycle from the path
            const cycleStart = path.indexOf(nodeId);
            const cyclePath = [...path.slice(cycleStart), nodeId];
            const key = cyclePath.join(' → ');
            if (!reportedCycles.has(key)) {
                reportedCycles.add(key);
                errors.push({
                    message: `Cycle detected: ${key}`,
                    nodeId,
                });
            }
            return;
        }
        if (visited.has(nodeId))
            return;
        visited.add(nodeId);
        inStack.add(nodeId);
        path.push(nodeId);
        const neighbors = adjacency.get(nodeId);
        if (neighbors) {
            for (const neighbor of neighbors) {
                dfs(neighbor, path);
            }
        }
        path.pop();
        inStack.delete(nodeId);
    }
    for (const trigger of triggers) {
        dfs(trigger.id, []);
    }
    return errors;
}
/** Resolve trigger nodes into TriggerMapping entries. */
function resolveTriggers(graph) {
    const triggers = [];
    for (const node of graph.nodes) {
        if (!isTrigger(node))
            continue;
        // Find the first outgoing edge to determine entryNodeId
        const outEdge = graph.edges.find((e) => e.source === node.id);
        const entryNodeId = outEdge ? outEdge.target : node.id;
        const config = node.config;
        switch (node.type) {
            case 'command_trigger':
                triggers.push({
                    type: 'command',
                    pattern: config['command'] ?? '',
                    entryNodeId,
                });
                break;
            case 'message_trigger':
                triggers.push({
                    type: 'message',
                    pattern: config['pattern'] ?? '',
                    matchType: config['matchType'] ?? 'exact',
                    entryNodeId,
                });
                break;
            case 'callback_trigger':
                triggers.push({
                    type: 'callback_query',
                    pattern: config['callbackData'] ?? '',
                    entryNodeId,
                });
                break;
        }
    }
    return triggers;
}
/** Build outgoing edges for a given node. */
function buildEdges(node, graphEdges) {
    const outgoing = graphEdges.filter((e) => e.source === node.id);
    if (node.type === 'condition') {
        const config = node.config;
        const rules = config['rules'] ?? [];
        const defaultEdgeId = config['defaultEdgeId'];
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
function compileNodes(graph) {
    const nodes = {};
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
export function compile(flowId, version, graph) {
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
    const callbackMap = {};
    for (const node of graph.nodes) {
        if (node.type === 'wait_for_input') {
            const token = `cb_${nanoid(16)}`;
            callbackMap[token] = { nodeId: node.id, planId };
        }
    }
    // 5. Emit plan
    const plan = {
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
//# sourceMappingURL=compiler.js.map