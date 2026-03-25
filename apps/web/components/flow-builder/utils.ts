import {
  MarkerType,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import {
  conditionSchema,
  type FlowDefinition,
  type TriggerType,
} from "@telegram-builder/shared";
import {
  migrateLegacyActionData,
} from "@/lib/flow-builder";
import type {
  ActionEditorData,
  AddBranch,
  ButtonHandleSpec,
  ConditionEditorData,
  InlineKeyboardButton,
  ReplyKeyboardButton,
} from "./types";
import { CONDITION_OPTIONS } from "./types";

export const EDGE_STYLE = { stroke: "#4f46e5", strokeWidth: 1.6 };

export const defaultEdgeOptions = {
  type: "smoothstep",
  style: EDGE_STYLE,
  markerEnd: { type: MarkerType.ArrowClosed, color: "#4f46e5" },
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
    nodes: [
      { id: "start_1", type: "start", position: { x: 80, y: 220 }, data: {} },
    ],
    edges: [],
  };
}

export function toCanvasNodes(flow: FlowDefinition, legacyTrigger?: TriggerType): Node[] {
  return flow.nodes.map((node) => {
    if (node.type === "start") {
      // Inject legacy trigger into start node data during migration
      const trigger = (node.data as Record<string, unknown>).trigger ?? legacyTrigger;
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: trigger ? { ...node.data, trigger } : { ...node.data },
      };
    }

    if (node.type !== "action") {
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      };
    }

    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: migrateLegacyActionData(node.data),
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
    label: edge.label ??
      (edge.sourceHandle === "true" || edge.sourceHandle === "false"
        ? edge.sourceHandle
        : undefined),
    ...defaultEdgeOptions,
  }));
}

export function normalizeConditionNodeData(data: Record<string, unknown>) {
  const type = String(data.type ?? "text_contains");

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

  if (type === "message_source_equals") {
    const raw = String(data.value ?? "user");
    const value = raw === "channel" || raw === "group" ? raw : "user";
    return { type, value };
  }

  return {
    type: CONDITION_OPTIONS.includes(type as (typeof CONDITION_OPTIONS)[number])
      ? type
      : "text_contains",
    value: String(data.value ?? ""),
  };
}

export function normalizeActionNodeData(data: unknown): ActionEditorData {
  const normalized = migrateLegacyActionData(data);
  return {
    type: normalized.type,
    params: normalized.params as Record<string, unknown>,
  };
}

export function toFlowDefinition(nodes: Node[], edges: Edge[]): FlowDefinition {
  const flowNodes = nodes.map((node) => {
    if (node.type === "start") {
      return {
        id: node.id,
        type: "start" as const,
        position: node.position,
        data: {},
      };
    }

    if (node.type === "condition") {
      return {
        id: node.id,
        type: "condition" as const,
        position: node.position,
        data: normalizeConditionNodeData(node.data as Record<string, unknown>),
      };
    }

    return {
      id: node.id,
      type: "action" as const,
      position: node.position,
      data: normalizeActionNodeData(node.data) as import("@telegram-builder/shared").ActionPayload,
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

export function makeEdgeId(connection: Connection) {
  return `${connection.source}_${connection.sourceHandle ?? "default"}_${connection.target}_${connection.targetHandle ?? "default"}_${Date.now()}`;
}

export function defaultConditionData(): ConditionEditorData {
  return { type: "text_contains", value: "keyword" };
}

export function canCreateConnection(
  connection: Connection | Edge,
  nodes: Node[],
  edges: Edge[],
  branch?: AddBranch,
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

  // Button handles can only have one outgoing connection per button
  if (connection.sourceHandle?.startsWith("button-")) {
    const existingButtonEdge = edges.some(
      (edge) =>
        edge.source === connection.source &&
        edge.sourceHandle === connection.sourceHandle,
    );
    if (existingButtonEdge) return false;
  }

  return true;
}

// ─── Keyboard helpers ───────────────────────────────────────────────────────

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

export function deriveButtonHandles(params: Record<string, unknown>): ButtonHandleSpec[] {
  const rows = getInlineKeyboard(params);
  return rows.flatMap((row, r) =>
    row.flatMap((btn, b) =>
      btn.callback_data
        ? [{ id: `button-${r}-${b}`, label: btn.text, callbackData: btn.callback_data }]
        : [],
    ),
  );
}
