import type { ActionPayload, FlowDefinition, NormalizedEvent, WorkflowContext } from "../types/workflow.js";
import { evaluateCondition } from "./evaluator.js";

export type DerivedFlowAction = {
  actionId: string;
  payload: ActionPayload;
};

function toOutgoingEdgeMap(flow: FlowDefinition) {
  const map = new Map<string, Array<{ target: string; sourceHandle?: string }>>();
  for (const edge of flow.edges) {
    const list = map.get(edge.source) ?? [];
    list.push({ target: edge.target, sourceHandle: edge.sourceHandle });
    map.set(edge.source, list);
  }
  return map;
}

export function deriveActionsFromFlow(flow: FlowDefinition, event: NormalizedEvent): DerivedFlowAction[] {
  const startNode = flow.nodes.find((node) => node.type === "start");
  if (!startNode) {
    return [];
  }

  const nodeMap = new Map(flow.nodes.map((node) => [node.id, node]));
  const outgoing = toOutgoingEdgeMap(flow);
  const stack = [startNode.id];
  const seenActionNodeIds = new Set<string>();
  const orderedActions: DerivedFlowAction[] = [];
  const context: WorkflowContext = {
    variables: { ...(event.variables ?? {}) }
  };

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId) {
      continue;
    }

    const node = nodeMap.get(nodeId);
    if (!node) {
      continue;
    }

    if (node.type === "action" && !seenActionNodeIds.has(node.id)) {
      seenActionNodeIds.add(node.id);
      const payload = node.data as ActionPayload;
      orderedActions.push({
        actionId: node.id,
        payload
      });
    }

    const out = outgoing.get(node.id) ?? [];
    if (node.type === "condition") {
      const passed = evaluateCondition(event, node.data, context);
      const nextEdge = out.find((edge) => edge.sourceHandle === (passed ? "true" : "false"));
      if (nextEdge) {
        stack.push(nextEdge.target);
      }
      continue;
    }

    // Reverse-push to keep traversal deterministic with original edge order.
    for (let i = out.length - 1; i >= 0; i -= 1) {
      const edge = out[i];
      if (edge) {
        stack.push(edge.target);
      }
    }
  }

  return orderedActions;
}
