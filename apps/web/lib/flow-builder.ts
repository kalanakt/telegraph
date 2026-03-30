import {
  TELEGRAM_CAPABILITIES_MANIFEST,
  TELEGRAM_TRIGGER_TYPES,
  flowDefinitionSchema,
  type ActionPayload,
  type ConditionPayload,
  type FlowDefinition,
  type TriggerType
} from "@telegram-builder/shared";

type LegacyNodeData = Record<string, unknown>;
export type ActionTemplate = { type: ActionPayload["type"]; params: Record<string, unknown> };

type TriggerGroupId = "message" | "query" | "membership" | "commerce" | "poll" | "fallback";

export type TriggerGroup = {
  id: TriggerGroupId;
  label: string;
  triggers: TriggerType[];
};

const triggerGroupConfig: Record<TriggerGroupId, { label: string; triggers: TriggerType[] }> = {
  message: {
    label: "Message events",
    triggers: ["message_received", "message_edited", "channel_post_received", "channel_post_edited"]
  },
  query: {
    label: "Queries",
    triggers: ["command_received", "callback_query_received", "inline_query_received", "chosen_inline_result_received"]
  },
  membership: {
    label: "Membership",
    triggers: ["chat_member_updated", "my_chat_member_updated", "chat_join_request_received", "message_reaction_updated", "message_reaction_count_updated"]
  },
  commerce: {
    label: "Commerce",
    triggers: ["shipping_query_received", "pre_checkout_query_received"]
  },
  poll: {
    label: "Poll",
    triggers: ["poll_received", "poll_answer_received"]
  },
  fallback: {
    label: "Fallback",
    triggers: ["update_received"]
  }
};

const triggerGroupOrder: TriggerGroupId[] = ["message", "query", "membership", "commerce", "poll", "fallback"];

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function defaultChatId(data: LegacyNodeData): string {
  return asString(data.chatId) ?? "{{event.chatId}}";
}

export function getTriggerGroups(): TriggerGroup[] {
  const available = new Set<TriggerType>(TELEGRAM_TRIGGER_TYPES);

  return triggerGroupOrder.map((id) => ({
    id,
    label: triggerGroupConfig[id].label,
    triggers: triggerGroupConfig[id].triggers.filter((trigger) => available.has(trigger))
  }));
}

export function createActionTemplate(actionType: ActionPayload["type"]): ActionTemplate {
  switch (actionType) {
    case "telegram.sendMessage":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          text: "Reply text"
        }
      };
    case "telegram.sendPhoto":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          photo: "https://example.com/photo.jpg",
          caption: "Photo caption"
        }
      };
    case "telegram.sendVideo":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          video: "https://example.com/video.mp4",
          caption: "Video caption"
        }
      };
    case "telegram.sendDocument":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          document: "https://example.com/file.pdf",
          caption: "Document caption"
        }
      };
    case "telegram.editMessageText":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          message_id: "{{event.messageId}}",
          text: "Edited message"
        }
      };
    case "telegram.deleteMessage":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          message_id: "{{event.messageId}}"
        }
      };
    case "telegram.answerCallbackQuery":
      return {
        type: actionType,
        params: {
          callback_query_id: "{{event.callbackQueryId}}",
          text: "Thanks!"
        }
      };
    case "telegram.answerInlineQuery":
      return {
        type: actionType,
        params: {
          inline_query_id: "{{event.inlineQueryId}}",
          results: [
            {
              type: "article",
              id: "result_1",
              title: "Example result",
              input_message_content: {
                message_text: "Hello from Telegraph"
              }
            }
          ],
          is_personal: true,
          cache_time: 0
        }
      };
    case "telegram.answerShippingQuery":
      return {
        type: actionType,
        params: {
          shipping_query_id: "{{event.shippingQueryId}}",
          ok: true,
          shipping_options: [
            {
              id: "standard",
              title: "Standard",
              prices: [{ label: "Shipping", amount: 0 }]
            }
          ]
        }
      };
    case "telegram.answerPreCheckoutQuery":
      return {
        type: actionType,
        params: {
          pre_checkout_query_id: "{{event.preCheckoutQueryId}}",
          ok: true
        }
      };
    case "telegram.approveChatJoinRequest":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          user_id: "{{event.fromUserId}}"
        }
      };
    case "telegram.declineChatJoinRequest":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          user_id: "{{event.fromUserId}}"
        }
      };
    case "telegram.banChatMember":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          user_id: "{{event.fromUserId}}"
        }
      };
    case "telegram.unbanChatMember":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          user_id: "{{event.fromUserId}}"
        }
      };
    case "telegram.restrictChatMember":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          user_id: "{{event.fromUserId}}",
          permissions: {
            can_send_messages: false
          }
        }
      };
    default:
      return {
        type: actionType,
        params: {}
      };
  }
}

function isActionPayload(value: unknown): value is ActionPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { type?: unknown; params?: unknown };
  return typeof candidate.type === "string" && candidate.type.startsWith("telegram.") && typeof candidate.params === "object";
}

export function migrateLegacyActionData(data: unknown): ActionPayload {
  if (isActionPayload(data)) {
    return data;
  }

  const input = (data ?? {}) as LegacyNodeData;
  const legacyType = String(input.type ?? "send_text");

  switch (legacyType) {
    case "send_text":
    case "send_message":
      return {
        type: "telegram.sendMessage",
        params: {
          chat_id: defaultChatId(input),
          text: asString(input.text) ?? "Reply text"
        }
      };
    case "send_photo": {
      const caption = asString(input.caption) ?? asString(input.text);
      return {
        type: "telegram.sendPhoto",
        params: {
          chat_id: defaultChatId(input),
          photo: asString(input.photoUrl) ?? "https://example.com/photo.jpg",
          ...(caption ? { caption } : {})
        }
      };
    }
    case "send_document": {
      const caption = asString(input.caption) ?? asString(input.text);
      return {
        type: "telegram.sendDocument",
        params: {
          chat_id: defaultChatId(input),
          document: asString(input.documentUrl) ?? "https://example.com/file.pdf",
          ...(caption ? { caption } : {})
        }
      };
    }
    case "edit_message_text": {
      const messageId = asNumber(input.messageId);
      return {
        type: "telegram.editMessageText",
        params: {
          chat_id: defaultChatId(input),
          ...(messageId ? { message_id: messageId } : {}),
          text: asString(input.text) ?? "Edited message"
        }
      };
    }
    case "delete_message": {
      const messageId = asNumber(input.messageId) ?? 1;
      return {
        type: "telegram.deleteMessage",
        params: {
          chat_id: defaultChatId(input),
          message_id: messageId
        }
      };
    }
    case "answer_callback_query":
      return {
        type: "telegram.answerCallbackQuery",
        params: {
          callback_query_id: asString(input.callbackQueryId) ?? "{{event.callbackQueryId}}",
          ...(asString(input.text) ? { text: String(input.text) } : {})
        }
      };
    case "restrict_chat_member":
      return {
        type: "telegram.restrictChatMember",
        params: {
          chat_id: defaultChatId(input),
          user_id: asNumber(input.userId) ?? 0,
          permissions: {}
        }
      };
    case "ban_chat_member":
      return {
        type: "telegram.banChatMember",
        params: {
          chat_id: defaultChatId(input),
          user_id: asNumber(input.userId) ?? 0
        }
      };
    case "unban_chat_member":
      return {
        type: "telegram.unbanChatMember",
        params: {
          chat_id: defaultChatId(input),
          user_id: asNumber(input.userId) ?? 0
        }
      };
    default:
      return {
        type: "telegram.sendMessage",
        params: {
          chat_id: "{{event.chatId}}",
          text: "Reply text"
        }
      };
  }
}

function normalizeConditionData(data: unknown): ConditionPayload {
  const input = (data ?? {}) as LegacyNodeData;
  const type = String(input.type ?? "text_contains");

  if (type === "all" || type === "any") {
    const raw = typeof input.conditionsJson === "string" ? input.conditionsJson : "[]";
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return {
          type,
          conditions: parsed as never
        } as ConditionPayload;
      }
    } catch {
      // Keep fallback condition below.
    }

    return {
      type,
      conditions: [{ type: "text_contains", value: "keyword" }]
    } as ConditionPayload;
  }

  if (type === "variable_equals") {
    return {
      type,
      key: asString(input.key) ?? "flag",
      value: String(input.value ?? "true")
    } as ConditionPayload;
  }

  if (type === "variable_exists") {
    return {
      type,
      key: asString(input.key) ?? "flag"
    } as ConditionPayload;
  }

  if (type === "from_user_id") {
    return {
      type,
      value: asNumber(input.value) ?? 0
    } as ConditionPayload;
  }

  if (type === "target_user_id_equals") {
    return {
      type,
      value: asNumber(input.value) ?? 0
    } as ConditionPayload;
  }

  if (type === "message_source_equals") {
    const raw = String(input.value ?? "user");
    const value = raw === "group" || raw === "channel" ? raw : "user";
    return {
      type,
      value
    } as ConditionPayload;
  }

  if (type.startsWith("message_has_")) {
    return { type } as ConditionPayload;
  }

  return {
    type,
    value: String(input.value ?? "")
  } as ConditionPayload;
}

export function coerceFlowDefinition(input: unknown): FlowDefinition | null {
  const parsed = flowDefinitionSchema.safeParse(input);
  if (parsed.success) {
    return parsed.data;
  }

  if (!input || typeof input !== "object") {
    return null;
  }

  const candidate = input as { nodes?: unknown; edges?: unknown };
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    return null;
  }

  const nodes: FlowDefinition["nodes"] = [];
  for (const node of candidate.nodes) {
    if (!node || typeof node !== "object") {
      continue;
    }

    const n = node as { id?: unknown; type?: unknown; position?: { x?: unknown; y?: unknown }; data?: unknown };
    const id = asString(n.id);
    const type = asString(n.type);
    const x = asNumber(n.position?.x);
    const y = asNumber(n.position?.y);

    if (!id || !type || x === undefined || y === undefined) {
      continue;
    }

    if (type === "start") {
      nodes.push({ id, type: "start", position: { x, y }, data: {} });
      continue;
    }

    if (type === "condition") {
      nodes.push({
        id,
        type: "condition",
        position: { x, y },
        data: normalizeConditionData(n.data)
      });
      continue;
    }

    nodes.push({
      id,
      type: "action",
      position: { x, y },
      data: migrateLegacyActionData(n.data)
    });
  }

  const edges: FlowDefinition["edges"] = [];
  for (const edge of candidate.edges) {
    if (!edge || typeof edge !== "object") {
      continue;
    }

    const e = edge as { id?: unknown; source?: unknown; target?: unknown; sourceHandle?: unknown; targetHandle?: unknown };
    const id = asString(e.id);
    const source = asString(e.source);
    const target = asString(e.target);

    if (!id || !source || !target) {
      continue;
    }

    edges.push({
      id,
      source,
      target,
      sourceHandle: asString(e.sourceHandle),
      targetHandle: asString(e.targetHandle)
    });
  }

  const repaired = flowDefinitionSchema.safeParse({ nodes, edges });
  return repaired.success ? repaired.data : null;
}

export function getCapabilityLabel(actionType: string): string {
  const match = TELEGRAM_CAPABILITIES_MANIFEST.find((item) => item.actionType === actionType);
  return match?.label ?? actionType;
}

export function summarizeAction(payload: ActionPayload): string {
  const params = payload.params as Record<string, unknown>;

  if (payload.type === "telegram.sendMessage") {
    const text = asString(params.text);
    return text ? text : "Send message";
  }

  if (payload.type === "telegram.sendPhoto") {
    const caption = asString(params.caption);
    const photo = asString(params.photo);
    return caption ?? photo ?? "Send photo";
  }

  if (payload.type === "telegram.sendVideo") {
    const caption = asString(params.caption);
    const video = asString(params.video);
    return caption ?? video ?? "Send video";
  }

  if (payload.type === "telegram.sendDocument") {
    const caption = asString(params.caption);
    const document = asString(params.document);
    return caption ?? document ?? "Send document";
  }

  return `${getCapabilityLabel(payload.type)}`;
}

export function getActionTypeOptions() {
  return TELEGRAM_CAPABILITIES_MANIFEST.map((item) => ({
    actionType: item.actionType,
    label: item.label,
    category: item.category,
    description: item.description
  }));
}
