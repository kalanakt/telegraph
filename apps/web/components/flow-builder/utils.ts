import {
  MarkerType,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  type ActionPayload,
  conditionSchema,
  type FlowAwaitCallbackNodeData,
  type FlowAwaitMessageNodeData,
  type FlowCollectContactNodeData,
  type FlowCollectShippingNodeData,
  type FlowCreateInvoiceNodeData,
  type FlowDelayNodeData,
  type FlowDefinition,
  type FlowFormStepNodeData,
  type FlowNodeMeta,
  type FlowOrderTransitionNodeData,
  type FlowSetVariableNodeData,
  type FlowSwitchNodeData,
  type FlowUpsertCustomerNodeData,
  type FlowUpsertOrderNodeData,
  type TriggerType,
} from "@telegram-builder/shared";
import {
  createActionTemplate,
  formatTriggerLabel,
  getConditionOptions,
  migrateLegacyActionData,
} from "@/lib/flow-builder";
import type {
  ActionEditorData,
  AwaitCallbackEditorData,
  AwaitMessageEditorData,
  CollectContactEditorData,
  CollectShippingEditorData,
  BuilderNodeMeta,
  CreateInvoiceEditorData,
  ConditionEditorData,
  DelayEditorData,
  FormStepEditorData,
  FlowNodeKind,
  InlineKeyboardButton,
  LinkedCallbackFlow,
  OrderTransitionEditorData,
  RuleOption,
  ReplyKeyboardButton,
  SetVariableEditorData,
  SwitchEditorData,
  UpsertCustomerEditorData,
  UpsertOrderEditorData,
} from "./types";

export const EDGE_STYLE = { stroke: "rgba(14, 165, 233, 0.46)", strokeWidth: 1.5 };

export const defaultEdgeOptions = {
  type: "builder-edge",
  style: EDGE_STYLE,
  markerEnd: { type: MarkerType.ArrowClosed, color: "rgba(14, 165, 233, 0.56)" },
  animated: false,
};

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function defaultFlowDefinition(): FlowDefinition {
  return {
    nodes: [],
    edges: [],
  };
}

function slugifyNodeKey(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const base = normalized || "node";
  return /^[a-z]/.test(base) ? base : `node_${base}`;
}

function toCommerceStatus(value: unknown): FlowUpsertOrderNodeData["status"] {
  const normalized = asString(value);
  return normalized === "awaiting_shipping" ||
    normalized === "awaiting_payment" ||
    normalized === "paid" ||
    normalized === "fulfilled" ||
    normalized === "canceled" ||
    normalized === "draft"
    ? normalized
    : "draft";
}

function buildDefaultNodeMeta(kind: FlowNodeKind, id: string): BuilderNodeMeta {
  const readable =
    kind === "start"
      ? "Trigger"
      : kind === "condition"
      ? "Condition"
      : kind === "action"
      ? "Action"
      : kind === "switch"
      ? "Switch"
      : kind === "set_variable"
      ? "Set Variable"
      : kind === "delay"
      ? "Delay"
      : kind === "await_message"
      ? "Await Message"
      : kind === "await_callback"
      ? "Await Callback"
      : kind === "collect_contact"
      ? "Collect Contact"
      : kind === "collect_shipping"
      ? "Collect Shipping"
      : kind === "form_step"
      ? "Form Step"
      : kind === "upsert_customer"
      ? "Upsert Customer"
      : kind === "upsert_order"
      ? "Upsert Order"
      : kind === "create_invoice"
      ? "Create Invoice"
      : "Order Transition";

  return {
    label: readable,
    key: slugifyNodeKey(`${kind}_${id.replace(/[^a-zA-Z0-9]+/g, "_")}`),
  };
}

export function sanitizeNodeMeta(meta: unknown, fallback: BuilderNodeMeta): FlowNodeMeta {
  const raw = typeof meta === "object" && meta !== null ? (meta as BuilderNodeMeta) : {};
  const label = typeof raw.label === "string" && raw.label.trim() ? raw.label.trim() : fallback.label;
  const keySource = typeof raw.key === "string" && raw.key.trim() ? raw.key.trim() : fallback.key ?? fallback.label ?? "node";
  return {
    label,
    key: slugifyNodeKey(keySource),
  };
}

export function getNodeMeta(data: unknown, fallback: BuilderNodeMeta): FlowNodeMeta {
  if (!data || typeof data !== "object") {
    return sanitizeNodeMeta(undefined, fallback);
  }

  return sanitizeNodeMeta((data as { __meta?: BuilderNodeMeta }).__meta, fallback);
}

function withNodeMeta<T extends Record<string, unknown>>(data: T, meta: FlowNodeMeta): T & { __meta: FlowNodeMeta } {
  return {
    ...data,
    __meta: meta,
  };
}

function stripNodeMeta<T extends Record<string, unknown>>(data: T): T {
  const { __meta: _ignored, ...rest } = data as T & { __meta?: FlowNodeMeta };
  return rest as T;
}

export function toCanvasNodes(flow: FlowDefinition, legacyTrigger?: TriggerType): Node[] {
  return flow.nodes.map((node) => {
    const meta = sanitizeNodeMeta(node.meta, buildDefaultNodeMeta(node.type, node.id));

    if (node.type === "start") {
      // Inject legacy trigger into start node data during migration
      const trigger = (node.data as Record<string, unknown>).trigger ?? legacyTrigger;
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: { __kind: node.type, ...withNodeMeta(trigger ? { ...node.data, trigger } : { ...node.data }, meta) },
      };
    }

    if (
      node.type === "condition" ||
      node.type === "switch" ||
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
    ) {
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: { __kind: node.type, ...withNodeMeta(node.data as Record<string, unknown>, meta) },
      };
    }

    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: { __kind: node.type, ...withNodeMeta(migrateLegacyActionData(node.data) as Record<string, unknown>, meta) },
    };
  });
}

export function toCanvasEdges(flow: FlowDefinition): Edge[] {
  return flow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.label ?? (edge.sourceHandle && edge.sourceHandle !== "default" ? edge.sourceHandle : undefined),
    ...defaultEdgeOptions,
  }));
}

export function normalizeConditionNodeData(data: Record<string, unknown>) {
  const type = String(data.type ?? "text_contains");
  const availableTypes = new Set(getConditionOptions("message_received").map((item) => item.type));
  const webhookTypes = getConditionOptions("webhook.received").map((item) => item.type);
  for (const item of webhookTypes) {
    availableTypes.add(item);
  }

  if (type === "all" || type === "any") {
    let parsedConditions: unknown = [];
    try {
      parsedConditions = JSON.parse(String(data.conditionsJson ?? "[]"));
    } catch {
      parsedConditions = [];
    }
    const safe = Array.isArray(parsedConditions)
      ? parsedConditions
          .map((item) => conditionSchema.safeParse(item))
          .filter((result) => result.success)
          .map((result) => result.data)
      : [];
    return {
      type,
      conditions: safe.length > 0 ? safe : [{ type: "text_contains", value: "keyword" }],
    };
  }

  if (type === "variable_equals") {
    return { type, key: String(data.key ?? "flag"), value: String(data.value ?? "true") };
  }

  if (type === "variable_exists") {
    return { type, key: String(data.key ?? "flag") };
  }

  if (type === "event_path_exists") {
    return { type, key: String(data.key ?? "text") };
  }

  if (type === "event_path_equals" || type === "event_path_contains" || type === "event_path_matches_regex") {
    return {
      type,
      key: String(data.key ?? "text"),
      value: String(data.value ?? ""),
    };
  }

  if (type === "from_user_id") {
    return { type, value: Number(data.value ?? 0) };
  }

  if (type === "target_user_id_equals") {
    return { type, value: Number(data.value ?? 0) };
  }

  if (type === "message_source_equals") {
    const raw = String(data.value ?? "user");
    const value = raw === "channel" || raw === "group" ? raw : "user";
    return { type, value };
  }

  if (type.startsWith("message_has_")) {
    return { type };
  }

  return {
    type: availableTypes.has(type as never) ? type : "text_contains",
    value: String(data.value ?? ""),
  };
}

export function normalizeActionNodeData(data: unknown): ActionEditorData {
  const meta = getNodeMeta(data, buildDefaultNodeMeta("action", "action"));
  const normalized = migrateLegacyActionData(stripNodeMeta((data ?? {}) as Record<string, unknown>));
  return {
    type: normalized.type,
    params: normalized.params as Record<string, unknown>,
    __meta: meta,
  };
}

export function normalizeSwitchNodeData(data: unknown): SwitchEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    path: asString(record.path) || "event.text",
    cases: Array.isArray(record.cases) && record.cases.length > 0
      ? record.cases.map((item, index) => {
          const value = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
          const caseId = asString(value.id) || `case_${index + 1}`;
          return {
            id: slugifyNodeKey(caseId),
            value: asString(value.value),
            label: asString(value.label) || `Case ${index + 1}`,
          };
        })
      : [{ id: "match", value: "match", label: "Match" }],
    __meta: getNodeMeta(data, buildDefaultNodeMeta("switch", "switch")),
  };
}

export function normalizeSetVariableNodeData(data: unknown): SetVariableEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    path: asString(record.path) || "result.value",
    value: (record.value ?? "") as import("@telegram-builder/shared").JsonValue,
    __meta: getNodeMeta(data, buildDefaultNodeMeta("set_variable", "set_variable")),
  };
}

export function normalizeDelayNodeData(data: unknown): DelayEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    delay_ms: asNumber(record.delay_ms) || 60000,
    __meta: getNodeMeta(data, buildDefaultNodeMeta("delay", "delay")),
  };
}

export function normalizeAwaitMessageNodeData(data: unknown): AwaitMessageEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    timeout_ms: asNumber(record.timeout_ms) || 0 || undefined,
    store_as: asString(record.store_as) || "last_reply",
    __meta: getNodeMeta(data, buildDefaultNodeMeta("await_message", "await_message"))
  };
}

export function normalizeAwaitCallbackNodeData(data: unknown): AwaitCallbackEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    timeout_ms: asNumber(record.timeout_ms) || 0 || undefined,
    callback_prefix: asString(record.callback_prefix) || "",
    store_as: asString(record.store_as) || "last_callback",
    __meta: getNodeMeta(data, buildDefaultNodeMeta("await_callback", "await_callback"))
  };
}

export function normalizeCollectContactNodeData(data: unknown): CollectContactEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    timeout_ms: asNumber(record.timeout_ms) || 0 || undefined,
    __meta: getNodeMeta(data, buildDefaultNodeMeta("collect_contact", "collect_contact"))
  };
}

export function normalizeCollectShippingNodeData(data: unknown): CollectShippingEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    timeout_ms: asNumber(record.timeout_ms) || 0 || undefined,
    __meta: getNodeMeta(data, buildDefaultNodeMeta("collect_shipping", "collect_shipping"))
  };
}

export function normalizeFormStepNodeData(data: unknown): FormStepEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  const source = asString(record.source);
  return {
    field: asString(record.field) || "customer_input",
    source:
      source === "contact_phone" || source === "contact_payload" || source === "shipping_address" ? source : "text",
    prompt: asString(record.prompt) || "",
    timeout_ms: asNumber(record.timeout_ms) || 0 || undefined,
    __meta: getNodeMeta(data, buildDefaultNodeMeta("form_step", "form_step"))
  };
}

export function normalizeUpsertCustomerNodeData(data: unknown): UpsertCustomerEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    profile:
      typeof record.profile === "object" && record.profile !== null
        ? (record.profile as FlowUpsertCustomerNodeData["profile"])
        : {
            username: "{{event.fromUsername}}",
            phoneNumber: "{{event.contactPhoneNumber}}"
          },
    __meta: getNodeMeta(data, buildDefaultNodeMeta("upsert_customer", "upsert_customer"))
  };
}

export function normalizeUpsertOrderNodeData(data: unknown): UpsertOrderEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    external_id: asString(record.external_id),
    invoice_payload: asString(record.invoice_payload),
    currency: asString(record.currency) || "USD",
    total_amount: asNumber(record.total_amount) || 1000,
    status: toCommerceStatus(record.status),
    data: typeof record.data === "undefined" ? { lineItems: [] } : (record.data as FlowUpsertOrderNodeData["data"]),
    __meta: getNodeMeta(data, buildDefaultNodeMeta("upsert_order", "upsert_order"))
  };
}

export function normalizeCreateInvoiceNodeData(data: unknown): CreateInvoiceEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    invoice_payload: asString(record.invoice_payload) || "{{event.updateId}}",
    title: asString(record.title) || "Telegram order",
    description: asString(record.description) || "Telegram commerce checkout",
    currency: asString(record.currency) || "USD",
    total_amount: asNumber(record.total_amount) || 1000,
    data: typeof record.data === "undefined" ? { lineItems: [] } : (record.data as FlowCreateInvoiceNodeData["data"]),
    __meta: getNodeMeta(data, buildDefaultNodeMeta("create_invoice", "create_invoice"))
  };
}

export function normalizeOrderTransitionNodeData(data: unknown): OrderTransitionEditorData {
  const record = typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return {
    status: toCommerceStatus(record.status ?? "awaiting_payment") as FlowOrderTransitionNodeData["status"],
    note: asString(record.note) || "",
    __meta: getNodeMeta(data, buildDefaultNodeMeta("order_transition", "order_transition"))
  };
}

export function toFlowDefinition(nodes: Node[], edges: Edge[]): FlowDefinition {
  const flowNodes = nodes.map((node) => {
    const meta = getNodeMeta(node.data, buildDefaultNodeMeta(node.type as FlowNodeKind, node.id));

    if (node.type === "start") {
      return {
        id: node.id,
        type: "start" as const,
        position: node.position,
        meta,
        data: {},
      };
    }

    if (node.type === "condition") {
      return {
        id: node.id,
        type: "condition" as const,
        position: node.position,
        meta,
        data: normalizeConditionNodeData(stripNodeMeta(node.data as Record<string, unknown>)),
      };
    }

    if (node.type === "switch") {
      const normalized = normalizeSwitchNodeData(node.data);
      return {
        id: node.id,
        type: "switch" as const,
        position: node.position,
        meta,
        data: {
          path: normalized.path,
          cases: normalized.cases.map((item) => ({
            id: slugifyNodeKey(item.id),
            value: item.value,
            label: item.label,
          })),
        },
      };
    }

    if (node.type === "set_variable") {
      const normalized = normalizeSetVariableNodeData(node.data);
      return {
        id: node.id,
        type: "set_variable" as const,
        position: node.position,
        meta,
        data: {
          path: normalized.path,
          value: normalized.value,
        },
      };
    }

    if (node.type === "delay") {
      const normalized = normalizeDelayNodeData(node.data);
      return {
        id: node.id,
        type: "delay" as const,
        position: node.position,
        meta,
        data: {
          delay_ms: normalized.delay_ms,
        },
      };
    }

    if (node.type === "await_message") {
      const normalized = normalizeAwaitMessageNodeData(node.data);
      return { id: node.id, type: "await_message" as const, position: node.position, meta, data: { timeout_ms: normalized.timeout_ms, store_as: normalized.store_as } };
    }

    if (node.type === "await_callback") {
      const normalized = normalizeAwaitCallbackNodeData(node.data);
      return {
        id: node.id,
        type: "await_callback" as const,
        position: node.position,
        meta,
        data: { timeout_ms: normalized.timeout_ms, callback_prefix: normalized.callback_prefix || undefined, store_as: normalized.store_as }
      };
    }

    if (node.type === "collect_contact") {
      const normalized = normalizeCollectContactNodeData(node.data);
      return { id: node.id, type: "collect_contact" as const, position: node.position, meta, data: { timeout_ms: normalized.timeout_ms } };
    }

    if (node.type === "collect_shipping") {
      const normalized = normalizeCollectShippingNodeData(node.data);
      return { id: node.id, type: "collect_shipping" as const, position: node.position, meta, data: { timeout_ms: normalized.timeout_ms } };
    }

    if (node.type === "form_step") {
      const normalized = normalizeFormStepNodeData(node.data);
      return {
        id: node.id,
        type: "form_step" as const,
        position: node.position,
        meta,
        data: { field: normalized.field, source: normalized.source, prompt: normalized.prompt || undefined, timeout_ms: normalized.timeout_ms }
      };
    }

    if (node.type === "upsert_customer") {
      const normalized = normalizeUpsertCustomerNodeData(node.data);
      return { id: node.id, type: "upsert_customer" as const, position: node.position, meta, data: { profile: normalized.profile } };
    }

    if (node.type === "upsert_order") {
      const normalized = normalizeUpsertOrderNodeData(node.data);
      return {
        id: node.id,
        type: "upsert_order" as const,
        position: node.position,
        meta,
        data: {
          external_id: normalized.external_id || undefined,
          invoice_payload: normalized.invoice_payload || undefined,
          currency: normalized.currency || undefined,
          total_amount: normalized.total_amount,
          status: normalized.status as FlowUpsertOrderNodeData["status"],
          data: normalized.data
        }
      };
    }

    if (node.type === "create_invoice") {
      const normalized = normalizeCreateInvoiceNodeData(node.data);
      return {
        id: node.id,
        type: "create_invoice" as const,
        position: node.position,
        meta,
        data: {
          invoice_payload: normalized.invoice_payload,
          title: normalized.title || undefined,
          description: normalized.description || undefined,
          currency: normalized.currency,
          total_amount: normalized.total_amount,
          data: normalized.data
        }
      };
    }

    if (node.type === "order_transition") {
      const normalized = normalizeOrderTransitionNodeData(node.data);
      return {
        id: node.id,
        type: "order_transition" as const,
        position: node.position,
        meta,
        data: {
          status: normalized.status as FlowOrderTransitionNodeData["status"],
          note: normalized.note || undefined
        }
      };
    }

    return {
      id: node.id,
      type: "action" as const,
      position: node.position,
      meta,
      data: (() => {
        const normalized = normalizeActionNodeData(node.data);
        return {
          type: normalized.type,
          params: normalized.params,
        } as import("@telegram-builder/shared").ActionPayload;
      })(),
    };
  });

  return {
    nodes: flowNodes as FlowDefinition["nodes"],
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
      label: typeof edge.label === "string" ? edge.label : undefined,
    })),
  };
}

export function extractTriggerFromNodes(nodes: Node[]): TriggerType {
  const start = nodes.find((n) => n.type === "start");
  return ((start?.data as Record<string, unknown>)?.trigger as TriggerType) ?? "message_received";
}

export function getDefaultNodeData(kind: FlowNodeKind) {
  if (kind === "start") return withNodeMeta({}, buildDefaultNodeMeta(kind, kind));
  if (kind === "condition") return withNodeMeta(defaultConditionData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "switch") return withNodeMeta(defaultSwitchData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "set_variable") return withNodeMeta(defaultSetVariableData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "delay") return withNodeMeta(defaultDelayData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "await_message") return withNodeMeta(defaultAwaitMessageData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "await_callback") return withNodeMeta(defaultAwaitCallbackData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "collect_contact") return withNodeMeta(defaultCollectContactData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "collect_shipping") return withNodeMeta(defaultCollectShippingData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "form_step") return withNodeMeta(defaultFormStepData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "upsert_customer") return withNodeMeta(defaultUpsertCustomerData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "upsert_order") return withNodeMeta(defaultUpsertOrderData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "create_invoice") return withNodeMeta(defaultCreateInvoiceData(), buildDefaultNodeMeta(kind, kind));
  if (kind === "order_transition") return withNodeMeta(defaultOrderTransitionData(), buildDefaultNodeMeta(kind, kind));
  return withNodeMeta(createActionTemplate("telegram.sendMessage"), buildDefaultNodeMeta(kind, kind));
}

export function getNextNodePosition(
  nodes: Node[],
  kind: FlowNodeKind,
  viewportCenter?: { x: number; y: number },
) {
  const base = viewportCenter ?? { x: 200, y: 180 };
  const sameTypeNodes = nodes.filter((node) => node.type === kind);
  const typeIndex = sameTypeNodes.length;
  const totalIndex = nodes.length;
  const laneOffset =
    kind === "start"
      ? -160
      : kind === "condition"
      ? 0
      : kind === "switch"
      ? 80
      : kind === "set_variable"
      ? 160
      : kind === "delay"
      ? 240
      : kind === "await_message" || kind === "await_callback"
      ? 320
      : kind === "collect_contact" || kind === "collect_shipping" || kind === "form_step"
      ? 400
      : kind === "upsert_customer" || kind === "upsert_order" || kind === "create_invoice" || kind === "order_transition"
      ? 480
      : 120;

  return {
    x: Math.round((base.x + totalIndex * 40 + typeIndex * 16) / 20) * 20,
    y: Math.round((base.y + laneOffset + typeIndex * 28) / 20) * 20,
  };
}

export function createFlowNode(
  kind: FlowNodeKind,
  nodes: Node[],
  viewportCenter?: { x: number; y: number },
  options?: {
    actionType?: ActionPayload["type"];
    trigger?: TriggerType;
    position?: { x: number; y: number };
  },
): Node {
  const id = `${kind}_${Date.now()}`;
  const data = (
    kind === "action" && options?.actionType
      ? withNodeMeta(createActionTemplate(options.actionType), buildDefaultNodeMeta(kind, kind))
      : kind === "start" && options?.trigger
      ? withNodeMeta({ trigger: options.trigger }, buildDefaultNodeMeta(kind, kind))
      : getDefaultNodeData(kind)
  ) as Record<string, unknown>;
  data.__meta = sanitizeNodeMeta((data as { __meta?: BuilderNodeMeta }).__meta, buildDefaultNodeMeta(kind, id));
  data.__kind = kind;
  return {
    id,
    type: kind,
    position: options?.position ?? getNextNodePosition(nodes, kind, viewportCenter),
    data,
  };
}

export function createBuilderEdge(
  connection: {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    label?: string;
  },
): Edge {
  return {
    id: makeEdgeId(connection),
    source: connection.source ?? "",
    target: connection.target ?? "",
    sourceHandle: connection.sourceHandle ?? undefined,
    targetHandle: connection.targetHandle ?? undefined,
    label:
      connection.label ??
      (connection.sourceHandle && connection.sourceHandle !== "default" ? connection.sourceHandle : undefined),
    ...defaultEdgeOptions,
  };
}

export function getBranchHandleForInsertedNode(kind: FlowNodeKind): string | undefined {
  if (kind === "condition") return "true";
  if (kind === "switch") return "default";
  return undefined;
}

export function getEdgeMidpoint(edge: Edge, nodes: Node[]) {
  const sourceNode = nodes.find((node) => node.id === edge.source);
  const targetNode = nodes.find((node) => node.id === edge.target);
  if (!sourceNode || !targetNode) {
    return { x: 240, y: 200 };
  }

  return {
    x: Math.round((sourceNode.position.x + targetNode.position.x) / 2 / 20) * 20,
    y: Math.round((sourceNode.position.y + targetNode.position.y) / 2 / 20) * 20,
  };
}

export function makeEdgeId(connection: {
  source?: string | null;
  target?: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}) {
  return `${connection.source}_${connection.sourceHandle ?? "default"}_${connection.target}_${connection.targetHandle ?? "default"}_${Date.now()}`;
}

export function defaultConditionData(): ConditionEditorData {
  return { type: "text_contains", value: "keyword" };
}

export function defaultSwitchData(): SwitchEditorData {
  return {
    path: "event.text",
    cases: [{ id: "match", value: "match", label: "Match" }],
  };
}

export function defaultSetVariableData(): SetVariableEditorData {
  return {
    path: "result.value",
    value: "{{event.text}}",
  };
}

export function defaultDelayData(): DelayEditorData {
  return {
    delay_ms: 60_000,
  };
}

export function defaultAwaitMessageData(): AwaitMessageEditorData {
  return {
    timeout_ms: 15 * 60_000,
    store_as: "last_reply",
  };
}

export function defaultAwaitCallbackData(): AwaitCallbackEditorData {
  return {
    timeout_ms: 15 * 60_000,
    callback_prefix: "",
    store_as: "last_callback",
  };
}

export function defaultCollectContactData(): CollectContactEditorData {
  return {
    timeout_ms: 15 * 60_000,
  };
}

export function defaultCollectShippingData(): CollectShippingEditorData {
  return {
    timeout_ms: 15 * 60_000,
  };
}

export function defaultFormStepData(): FormStepEditorData {
  return {
    field: "customer_input",
    source: "text",
    prompt: "",
    timeout_ms: 15 * 60_000,
  };
}

export function defaultUpsertCustomerData(): UpsertCustomerEditorData {
  return {
    profile: {
      username: "{{event.fromUsername}}",
      phoneNumber: "{{event.contactPhoneNumber}}",
    },
  };
}

export function defaultUpsertOrderData(): UpsertOrderEditorData {
  return {
    invoice_payload: "",
    currency: "USD",
    total_amount: 1000,
    status: "draft",
    data: { lineItems: [] },
  };
}

export function defaultCreateInvoiceData(): CreateInvoiceEditorData {
  return {
    invoice_payload: "{{event.updateId}}",
    title: "Telegram order",
    description: "Telegram commerce checkout",
    currency: "USD",
    total_amount: 1000,
    data: { lineItems: [] },
  };
}

export function defaultOrderTransitionData(): OrderTransitionEditorData {
  return {
    status: "awaiting_payment",
    note: "",
  };
}

export function canCreateConnection(
  connection: Connection | Edge,
  nodes: Node[],
  edges: Edge[],
) {
  if (!connection.source || !connection.target) return false;
  if (connection.source === connection.target) return false;

  const duplicate = edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      (edge.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
      (edge.targetHandle ?? null) === (connection.targetHandle ?? null),
  );
  if (duplicate) return false;

  const sourceNode = nodes.find((node) => node.id === connection.source);

  // Condition branch handles (true/false) can only have one outgoing connection
  if (
    sourceNode?.type === "condition" &&
    (connection.sourceHandle === "true" || connection.sourceHandle === "false")
  ) {
    const existingBranch = edges.some(
      (edge) =>
        edge.source === connection.source &&
        edge.sourceHandle === connection.sourceHandle,
    );
    if (existingBranch) return false;
  }

  if (sourceNode?.type === "switch") {
    const handle = connection.sourceHandle ?? "default";
    const existingBranch = edges.some(
      (edge) => edge.source === connection.source && (edge.sourceHandle ?? "default") === handle,
    );
    if (existingBranch) return false;
  }

  return true;
}

export function getInlineKeyboard(params: Record<string, unknown>): InlineKeyboardButton[][] {
  const replyMarkup = params.reply_markup;
  if (!replyMarkup || typeof replyMarkup !== "object") return [];
  const inlineKeyboard = (replyMarkup as { inline_keyboard?: unknown }).inline_keyboard;
  if (!Array.isArray(inlineKeyboard)) return [];

  const rows: InlineKeyboardButton[][] = [];
  for (const row of inlineKeyboard) {
    if (!Array.isArray(row)) continue;
    const buttons: InlineKeyboardButton[] = [];
    for (const button of row) {
      if (!button || typeof button !== "object") continue;
      const b = button as { text?: unknown; url?: unknown; callback_data?: unknown };
      const text = asString(b.text);
      if (!text) continue;
      buttons.push({
        text,
        url: asString(b.url) || undefined,
        callback_data: asString(b.callback_data) || undefined,
      });
    }
    if (buttons.length > 0) rows.push(buttons);
  }
  return rows;
}

export function buildCallbackToken({
  ruleId,
  nodeId,
  rowIndex,
  buttonIndex,
  buttonLabel,
}: {
  ruleId: string;
  nodeId: string;
  rowIndex: number;
  buttonIndex: number;
  buttonLabel: string;
}) {
  const slug = buttonLabel
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return [ruleId || "flow", nodeId, `r${rowIndex + 1}`, `b${buttonIndex + 1}`, slug || "button"].join(":");
}

export function getInlineButtonCallbackToken(
  params: Record<string, unknown>,
  rowIndex: number,
  buttonIndex: number,
) {
  return getInlineKeyboard(params)[rowIndex]?.[buttonIndex]?.callback_data?.trim() || null;
}

export function getInlineButtonLabel(
  params: Record<string, unknown>,
  rowIndex: number,
  buttonIndex: number,
) {
  return getInlineKeyboard(params)[rowIndex]?.[buttonIndex]?.text?.trim() || `Button ${rowIndex + 1}.${buttonIndex + 1}`;
}

export function setInlineButtonCallbackToken(
  params: Record<string, unknown>,
  rowIndex: number,
  buttonIndex: number,
  token: string,
) {
  const rows = getInlineKeyboard(params);
  if (!rows[rowIndex]?.[buttonIndex]) {
    return params;
  }

  const nextRows = rows.map((row, currentRowIndex) =>
    row.map((button, currentButtonIndex) =>
      currentRowIndex === rowIndex && currentButtonIndex === buttonIndex
        ? { ...button, callback_data: token }
        : button,
    ),
  );

  return {
    ...params,
    reply_markup: {
      ...(typeof params.reply_markup === "object" && params.reply_markup !== null
        ? (params.reply_markup as Record<string, unknown>)
        : {}),
      inline_keyboard: nextRows,
    },
  };
}

export function findLinkedCallbackFlows(
  rules: RuleOption[],
  params: Record<string, unknown>,
  rowIndex: number,
  buttonIndex: number,
): LinkedCallbackFlow[] {
  const token = getInlineButtonCallbackToken(params, rowIndex, buttonIndex);
  const buttonLabel = getInlineButtonLabel(params, rowIndex, buttonIndex);
  if (!token) return [];

  return rules.flatMap((rule) => {
    if (rule.trigger !== "callback_query_received") {
      return [];
    }

    const matchingCondition = rule.flowDefinition.nodes.find(
      (node) =>
        node.type === "condition" &&
        node.data.type === "callback_data_equals" &&
        String(node.data.value ?? "") === token,
    );

    if (!matchingCondition) {
      return [];
    }

    return [
      {
        token,
        buttonLabel,
        ruleId: rule.id,
        ruleName: rule.name,
      },
    ];
  });
}

export function describeInlineButtonLinks(params: Record<string, unknown>, rules: RuleOption[]) {
  const rows = getInlineKeyboard(params);
  return rows.flatMap((row, rowIndex) =>
    row.map((button, buttonIndex) => ({
      rowIndex,
      buttonIndex,
      button,
      linkedFlows: findLinkedCallbackFlows(rules, params, rowIndex, buttonIndex),
    })),
  );
}

export function describeTriggerSelection(trigger: TriggerType) {
  return formatTriggerLabel(trigger);
}

export function getReplyKeyboard(params: Record<string, unknown>): ReplyKeyboardButton[][] {
  const replyMarkup = params.reply_markup;
  if (!replyMarkup || typeof replyMarkup !== "object") return [];
  const keyboard = (replyMarkup as { keyboard?: unknown }).keyboard;
  if (!Array.isArray(keyboard)) return [];

  const rows: ReplyKeyboardButton[][] = [];
  for (const row of keyboard) {
    if (!Array.isArray(row)) continue;
    const buttons: ReplyKeyboardButton[] = [];
    for (const button of row) {
      if (!button || typeof button !== "object") continue;
      const b = button as { text?: unknown };
      const text = asString(b.text);
      if (text) buttons.push({ text });
    }
    if (buttons.length > 0) rows.push(buttons);
  }
  return rows;
}

export function getReplyMarkupKind(params: Record<string, unknown>): "none" | "inline" | "reply" {
  const replyMarkup = params.reply_markup;
  if (!replyMarkup || typeof replyMarkup !== "object") return "none";
  if (Array.isArray((replyMarkup as { inline_keyboard?: unknown }).inline_keyboard)) return "inline";
  if (Array.isArray((replyMarkup as { keyboard?: unknown }).keyboard)) return "reply";
  return "none";
}

const PARSE_MODE_ACTIONS = new Set<ActionPayload["type"]>([
  "telegram.sendMessage",
  "telegram.sendPhoto",
  "telegram.sendVideo",
  "telegram.sendDocument",
  "telegram.editMessageText",
]);

const DISABLE_WEB_PAGE_PREVIEW_ACTIONS = new Set<ActionPayload["type"]>([
  "telegram.sendMessage",
  "telegram.editMessageText",
]);

const REPLY_KEYBOARD_ACTIONS = new Set<ActionPayload["type"]>([
  "telegram.sendMessage",
  "telegram.sendPhoto",
  "telegram.sendVideo",
  "telegram.sendDocument",
]);

export function actionSupportsParseMode(actionType: ActionPayload["type"]) {
  return PARSE_MODE_ACTIONS.has(actionType);
}

export function actionSupportsDisableWebPagePreview(actionType: ActionPayload["type"]) {
  return DISABLE_WEB_PAGE_PREVIEW_ACTIONS.has(actionType);
}

export function actionSupportsReplyKeyboard(actionType: ActionPayload["type"]) {
  return REPLY_KEYBOARD_ACTIONS.has(actionType);
}

export function updateInlineKeyboard(
  rows: InlineKeyboardButton[][],
  rowIndex: number,
  buttonIndex: number,
  partial: Partial<InlineKeyboardButton>,
): InlineKeyboardButton[][] {
  return rows.map((row, rIndex) => {
    if (rIndex !== rowIndex) return row;
    return row.map((button, bIndex) => {
      if (bIndex !== buttonIndex) return button;
      return { ...button, ...partial };
    });
  });
}

export function updateReplyKeyboard(
  rows: ReplyKeyboardButton[][],
  rowIndex: number,
  buttonIndex: number,
  partial: Partial<ReplyKeyboardButton>,
): ReplyKeyboardButton[][] {
  return rows.map((row, rIndex) => {
    if (rIndex !== rowIndex) return row;
    return row.map((button, bIndex) => {
      if (bIndex !== buttonIndex) return button;
      return { ...button, ...partial };
    });
  });
}
