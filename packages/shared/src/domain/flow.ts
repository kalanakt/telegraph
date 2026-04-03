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

function getNodeMap(flow: FlowDefinition) {
  return new Map(flow.nodes.map((node) => [node.id, node]));
}

export function listFlowActions(flow: FlowDefinition): DerivedFlowAction[] {
  return flow.nodes
    .filter((node) => node.type === "action")
    .map((node) => ({
      actionId: node.id,
      payload: node.data as ActionPayload
    }));
}

export function getFrontierActions(
  flow: FlowDefinition,
  originNodeId: string,
  event: NormalizedEvent,
  context: WorkflowContext
): DerivedFlowAction[] {
  const nodeMap = getNodeMap(flow);
  const outgoing = toOutgoingEdgeMap(flow);
  const stack = [...(outgoing.get(originNodeId) ?? []).map((edge) => edge.target).reverse()];
  const visited = new Set<string>();
  const actions: DerivedFlowAction[] = [];
  const seenActionIds = new Set<string>();

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId || visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) {
      continue;
    }

    if (node.type === "action") {
      if (!seenActionIds.has(node.id)) {
        seenActionIds.add(node.id);
        actions.push({
          actionId: node.id,
          payload: node.data as ActionPayload
        });
      }
      continue;
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

    for (let i = out.length - 1; i >= 0; i -= 1) {
      const edge = out[i];
      if (edge) {
        stack.push(edge.target);
      }
    }
  }

  return actions;
}

export function deriveActionsFromFlow(flow: FlowDefinition, event: NormalizedEvent): DerivedFlowAction[] {
  const startNode = flow.nodes.find((node) => node.type === "start");
  if (!startNode) {
    return [];
  }

  return getFrontierActions(flow, startNode.id, event, {
    variables: { ...(event.variables ?? {}) }
  });
}
