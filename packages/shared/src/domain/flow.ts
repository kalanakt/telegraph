import type { ExecutablePayload, FlowDefinition, JsonValue, NormalizedEvent, WorkflowContext } from "../types/workflow.js";
import { evaluateCondition } from "./evaluator.js";
import { getPathValue, toTemplateString } from "./object-path.js";
import { createEmptyWorkflowContext, getContextScopeValue } from "./runtime-state.js";

export type DerivedFlowAction = {
  actionId: string;
  payload: ExecutablePayload;
};

function isExecutableNode(node: FlowDefinition["nodes"][number]) {
  return (
    node.type === "action" ||
    node.type === "set_variable" ||
    node.type === "delay" ||
    node.type === "await_message" ||
    node.type === "await_callback" ||
    node.type === "collect_contact" ||
    node.type === "collect_shipping" ||
    node.type === "form_step" ||
    node.type === "upsert_customer" ||
    node.type === "upsert_order" ||
    node.type === "create_invoice" ||
    node.type === "order_transition"
  );
}

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
    .filter((node) => isExecutableNode(node))
    .map((node) => ({
      actionId: node.id,
      payload: toExecutablePayload(node)
    }));
}

function toExecutablePayload(node: FlowDefinition["nodes"][number]): ExecutablePayload {
  if (node.type === "action") {
    return node.data;
  }

  if (node.type === "set_variable") {
    return {
      type: "workflow.setVariable",
      params: {
        path: node.data.path,
        value: node.data.value
      }
    };
  }

  if (node.type === "await_message") {
    return {
      type: "workflow.awaitMessage",
      params: {
        timeout_ms: node.data.timeout_ms,
        store_as: node.data.store_as
      }
    };
  }

  if (node.type === "await_callback") {
    return {
      type: "workflow.awaitCallback",
      params: {
        timeout_ms: node.data.timeout_ms,
        callback_prefix: node.data.callback_prefix,
        store_as: node.data.store_as
      }
    };
  }

  if (node.type === "collect_contact") {
    return {
      type: "workflow.collectContact",
      params: {
        timeout_ms: node.data.timeout_ms
      }
    };
  }

  if (node.type === "collect_shipping") {
    return {
      type: "workflow.collectShipping",
      params: {
        timeout_ms: node.data.timeout_ms
      }
    };
  }

  if (node.type === "form_step") {
    return {
      type: "workflow.formStep",
      params: {
        field: node.data.field,
        source: node.data.source,
        prompt: node.data.prompt,
        timeout_ms: node.data.timeout_ms
      }
    };
  }

  if (node.type === "upsert_customer") {
    return {
      type: "workflow.upsertCustomer",
      params: {
        profile: node.data.profile
      }
    };
  }

  if (node.type === "upsert_order") {
    return {
      type: "workflow.upsertOrder",
      params: {
        external_id: node.data.external_id,
        invoice_payload: node.data.invoice_payload,
        currency: node.data.currency,
        total_amount: node.data.total_amount,
        status: node.data.status,
        data: node.data.data
      }
    };
  }

  if (node.type === "create_invoice") {
    return {
      type: "workflow.createInvoice",
      params: {
        invoice_payload: node.data.invoice_payload,
        title: node.data.title,
        description: node.data.description,
        currency: node.data.currency,
        total_amount: node.data.total_amount,
        data: node.data.data
      }
    };
  }

  if (node.type === "order_transition") {
    return {
      type: "workflow.orderTransition",
      params: {
        status: node.data.status,
        note: node.data.note
      }
    };
  }

  return {
    type: "workflow.delay",
    params: {
      delay_ms: node.type === "delay" ? node.data.delay_ms : 0
    }
  };
}

function resolveSwitchValue(event: NormalizedEvent, context: WorkflowContext, path: string): JsonValue | undefined {
  if (path === "event") {
    return event as unknown as JsonValue;
  }

  if (path.startsWith("event.")) {
    return getPathValue(event, path.replace(/^event\./, "")) as JsonValue | undefined;
  }

  return getContextScopeValue(context, path);
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

    if (isExecutableNode(node)) {
      if (!seenActionIds.has(node.id)) {
        seenActionIds.add(node.id);
        actions.push({
          actionId: node.id,
          payload: toExecutablePayload(node)
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

    if (node.type === "switch") {
      const resolved = resolveSwitchValue(event, context, node.data.path);
      const match = node.data.cases.find((item) => toTemplateString(resolved) === item.value);
      const handle = match?.id ?? "default";
      const nextEdge = out.find((edge) => (edge.sourceHandle ?? "default") === handle);
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

  return getFrontierActions(flow, startNode.id, event, createEmptyWorkflowContext({
    variables: { ...(event.variables ?? {}) }
  }));
}
