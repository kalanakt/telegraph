import {
  MarkerType,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  conditionSchema,
  type FlowDelayNodeData,
  type FlowDefinition,
  type FlowNodeMeta,
  type FlowSetVariableNodeData,
  type FlowSwitchNodeData,
  type TriggerType,
} from "@telegram-builder/shared";
import {
  createActionTemplate,
  getConditionOptions,
  migrateLegacyActionData,
} from "@/lib/flow-builder";
import type {
  ActionEditorData,
  BuilderNodeMeta,
  ConditionEditorData,
  DelayEditorData,
  FlowNodeKind,
  InlineKeyboardButton,
  ReplyKeyboardButton,
  SetVariableEditorData,
  SwitchEditorData,
} from "./types";

export const EDGE_STYLE = { stroke: "rgba(14, 165, 233, 0.46)", strokeWidth: 1.5 };

export const defaultEdgeOptions = {
  type: "bezier",
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
      : "Delay";

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
        data: withNodeMeta(trigger ? { ...node.data, trigger } : { ...node.data }, meta),
      };
    }

    if (node.type === "condition" || node.type === "switch" || node.type === "set_variable" || node.type === "delay") {
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: withNodeMeta(node.data as Record<string, unknown>, meta),
      };
    }

    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: withNodeMeta(migrateLegacyActionData(node.data) as Record<string, unknown>, meta),
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
): Node {
  const id = `${kind}_${Date.now()}`;
  const data = getDefaultNodeData(kind) as Record<string, unknown>;
  data.__meta = sanitizeNodeMeta((data as { __meta?: BuilderNodeMeta }).__meta, buildDefaultNodeMeta(kind, id));
  return {
    id,
    type: kind,
    position: getNextNodePosition(nodes, kind, viewportCenter),
    data,
  };
}

export function makeEdgeId(connection: Connection) {
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
