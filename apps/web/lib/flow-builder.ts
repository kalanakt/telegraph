import {
  WORKFLOW_ACTION_MANIFEST,
  WORKFLOW_CONDITION_MANIFEST,
  WORKFLOW_TRIGGER_MANIFEST,
  WORKFLOW_TRIGGER_TYPES,
  flowDefinitionSchema,
  isActionAllowedForTrigger,
  isConditionAllowedForTrigger,
  type ActionPayload,
  type ConditionPayload,
  type FlowDefinition,
  type TriggerType
} from "@telegram-builder/shared";
import type { BuilderNodeCatalogItem, BuilderNodeCatalogSection, FlowNodeKind } from "@/components/flow-builder/types";

type LegacyNodeData = Record<string, unknown>;
export type ActionTemplate = { type: ActionPayload["type"]; params: Record<string, unknown> };

export type TriggerGroup = {
  id: string;
  label: string;
  triggers: TriggerType[];
};

const LOGIC_CATALOG: Array<{
  kind: FlowNodeKind;
  group: string;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    kind: "condition",
    group: "Filters",
    title: "Condition",
    description: "Branch on text, variables, message context, or webhook fields.",
    icon: "filter"
  },
  {
    kind: "switch",
    group: "Branching",
    title: "Switch",
    description: "Route to different paths based on one event or variable value.",
    icon: "branch"
  },
  {
    kind: "set_variable",
    group: "Variables",
    title: "Set Variable",
    description: "Store a computed value so downstream nodes can reuse it.",
    icon: "variable"
  },
  {
    kind: "delay",
    group: "Timing",
    title: "Delay",
    description: "Pause execution before continuing to the next node.",
    icon: "delay"
  },
  {
    kind: "await_message",
    group: "Conversation State",
    title: "Await Message",
    description: "Pause this session until the user replies with a new message.",
    icon: "message"
  },
  {
    kind: "await_callback",
    group: "Conversation State",
    title: "Await Callback",
    description: "Pause until the user taps an inline button callback.",
    icon: "branch"
  },
  {
    kind: "collect_contact",
    group: "Commerce Capture",
    title: "Collect Contact",
    description: "Wait for a contact share and map it into the customer profile.",
    icon: "user"
  },
  {
    kind: "collect_shipping",
    group: "Commerce Capture",
    title: "Collect Shipping",
    description: "Wait for Telegram shipping data and attach it to the order.",
    icon: "package"
  },
  {
    kind: "form_step",
    group: "Commerce Capture",
    title: "Form Step",
    description: "Capture structured input from the next user response.",
    icon: "form"
  },
  {
    kind: "upsert_customer",
    group: "Commerce State",
    title: "Upsert Customer",
    description: "Create or update the persistent customer profile.",
    icon: "user"
  },
  {
    kind: "upsert_order",
    group: "Commerce State",
    title: "Upsert Order",
    description: "Create or update the active order record.",
    icon: "package"
  },
  {
    kind: "create_invoice",
    group: "Commerce State",
    title: "Create Invoice",
    description: "Store invoice metadata for a Telegram-native payment flow.",
    icon: "credit-card"
  },
  {
    kind: "order_transition",
    group: "Commerce State",
    title: "Order Transition",
    description: "Move the order into the next commerce status.",
    icon: "refresh"
  }
];

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

function formatCatalogId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function getTriggerCatalogGroup(trigger: TriggerType) {
  if (trigger === "webhook.received") return "Webhooks";
  if (trigger === "cryptopay.invoice_paid") return "Crypto Pay";
  if (trigger === "shipping_query_received" || trigger === "pre_checkout_query_received") return "Commerce";
  if (
    trigger === "chat_member_updated" ||
    trigger === "my_chat_member_updated" ||
    trigger === "chat_join_request_received"
  ) {
    return "Membership";
  }
  if (
    trigger === "message_reaction_updated" ||
    trigger === "message_reaction_count_updated" ||
    trigger === "poll_received" ||
    trigger === "poll_answer_received" ||
    trigger === "update_received"
  ) {
    return "Engagement";
  }
  return "Conversations";
}

function getActionCatalogGroup(actionType: ActionPayload["type"], category: string) {
  if (actionType === "cryptopay.createInvoice" || actionType === "telegram.sendInvoice") {
    return "Payments";
  }

  if (actionType === "webhook.send" || actionType === "http.request") {
    return "External Calls";
  }

  if (
    actionType === "telegram.sendPhoto" ||
    actionType === "telegram.sendVideo" ||
    actionType === "telegram.sendDocument" ||
    actionType === "telegram.sendMediaGroup"
  ) {
    return "Media";
  }

  if (category === "moderation") return "Moderation";
  if (category === "chat") return "Chat Management";
  if (category === "admin" || category === "meta") return "Bot Admin";
  return "Send & Reply";
}

function getActionCatalogIcon(actionType: ActionPayload["type"]) {
  if (actionType === "cryptopay.createInvoice" || actionType === "telegram.sendInvoice") return "credit-card";
  if (actionType === "http.request") return "globe";
  if (actionType === "webhook.send") return "webhook";
  if (actionType.includes("Photo")) return "image";
  if (actionType.includes("Video")) return "video";
  if (actionType.includes("Document")) return "file";
  if (actionType.includes("Chat") || actionType.includes("Message")) return "message";
  if (actionType.includes("Invite") || actionType.includes("Commands") || actionType.includes("Webhook")) return "bot";
  if (actionType.includes("ban") || actionType.includes("restrict") || actionType.includes("approve") || actionType.includes("decline")) return "shield";
  return "zap";
}

export function getTriggerGroups(): TriggerGroup[] {
  const available = new Set<TriggerType>(WORKFLOW_TRIGGER_TYPES);
  const grouped = new Map<string, TriggerType[]>();

  for (const item of WORKFLOW_TRIGGER_MANIFEST) {
    if (!available.has(item.trigger)) {
      continue;
    }
    const label = getTriggerCatalogGroup(item.trigger);
    const list = grouped.get(label) ?? [];
    list.push(item.trigger);
    grouped.set(label, list);
  }

  return Array.from(grouped.entries()).map(([label, triggers]) => ({
    id: formatCatalogId(label),
    label,
    triggers
  }));
}

export function getConditionOptions(trigger: TriggerType) {
  return WORKFLOW_CONDITION_MANIFEST.filter((item) => isConditionAllowedForTrigger(item.type, trigger));
}

export function getActionTypeOptions(trigger?: TriggerType) {
  return WORKFLOW_ACTION_MANIFEST.filter((item) => (trigger ? isActionAllowedForTrigger(item.actionType, trigger) : true)).map(
    (item) => ({
      actionType: item.actionType,
      label: item.label,
      category: getActionCatalogGroup(item.actionType, item.category),
      description: item.description,
      source: item.source
    })
  );
}

export function getBuilderCatalog(trigger: TriggerType, hasTrigger: boolean): BuilderNodeCatalogSection[] {
  const sections: BuilderNodeCatalogSection[] = [];

  const triggerGroups = getTriggerGroups()
    .map((group) => {
      const items: BuilderNodeCatalogItem[] = group.triggers.map((triggerType) => {
        const manifest = WORKFLOW_TRIGGER_MANIFEST.find((item) => item.trigger === triggerType);
        return {
          id: `trigger:${triggerType}`,
          kind: "start",
          title: formatTriggerLabel(triggerType),
          description: manifest?.description ?? `Run when ${formatTriggerLabel(triggerType).toLowerCase()} happens.`,
          group: group.label,
          icon: triggerType === "webhook.received" ? "webhook" : "trigger",
          trigger: triggerType,
          disabled: hasTrigger && trigger !== triggerType,
          disabledReason: hasTrigger && trigger !== triggerType ? "Flow already has a trigger node." : undefined
        };
      });

      return {
        id: `triggers:${group.id}`,
        title: group.label,
        items
      };
    })
    .filter((section) => section.items.length > 0);

  sections.push(...triggerGroups);

  const logicSections = new Map<string, BuilderNodeCatalogItem[]>();
  for (const item of LOGIC_CATALOG) {
    const list = logicSections.get(item.group) ?? [];
    list.push({
      id: `logic:${item.kind}`,
      kind: item.kind,
      title: item.title,
      description: item.description,
      group: item.group,
      icon: item.icon
    });
    logicSections.set(item.group, list);
  }

  for (const [group, items] of logicSections.entries()) {
    sections.push({
      id: `logic:${formatCatalogId(group)}`,
      title: group,
      items
    });
  }

  const actionSections = new Map<string, BuilderNodeCatalogItem[]>();
  for (const item of getActionTypeOptions(trigger)) {
    const list = actionSections.get(item.category) ?? [];
    list.push({
      id: `action:${item.actionType}`,
      kind: "action",
      title: item.label,
      description: item.description,
      group: item.category,
      icon: getActionCatalogIcon(item.actionType),
      actionType: item.actionType
    });
    actionSections.set(item.category, list);
  }

  for (const [group, items] of actionSections.entries()) {
    sections.push({
      id: `actions:${formatCatalogId(group)}`,
      title: group,
      items
    });
  }

  return sections;
}

export function formatTriggerLabel(trigger: string): string {
  return trigger
    .replaceAll(".", "_")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function getActionPresets(actionType: ActionPayload["type"]) {
  if (actionType === "http.request") {
    return [
      {
        id: "openai-chat",
        label: "OpenAI-compatible prompt",
        action: {
          type: "http.request" as const,
          params: {
            method: "POST" as const,
            url: "https://api.openai.com/v1/chat/completions",
            auth: { type: "bearer" as const, token: "{{vars.secrets.openai_api_key}}" },
            headers: {
              "content-type": "application/json"
            },
            body: {
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: "{{event.text}}" }]
            },
            body_mode: "json" as const,
            response_body_format: "json" as const
          }
        }
      },
      {
        id: "airtable-row",
        label: "Airtable create row",
        action: {
          type: "http.request" as const,
          params: {
            method: "POST" as const,
            url: "https://api.airtable.com/v0/{{vars.secrets.airtable_base_id}}/{{vars.secrets.airtable_table}}",
            auth: { type: "bearer" as const, token: "{{vars.secrets.airtable_api_key}}" },
            headers: {
              "content-type": "application/json"
            },
            body: {
              fields: {
                text: "{{event.text}}"
              }
            },
            body_mode: "json" as const,
            response_body_format: "json" as const
          }
        }
      }
    ];
  }

  if (actionType === "webhook.send") {
    return [
      {
        id: "slack-webhook",
        label: "Slack incoming webhook",
        action: {
          type: "webhook.send" as const,
          params: {
            url: "{{vars.secrets.slack_webhook_url}}",
            body: {
              text: "{{event.text}}"
            },
            response_body_format: "text" as const
          }
        }
      },
      {
        id: "discord-webhook",
        label: "Discord webhook",
        action: {
          type: "webhook.send" as const,
          params: {
            url: "{{vars.secrets.discord_webhook_url}}",
            body: {
              content: "{{event.text}}"
            },
            response_body_format: "text" as const
          }
        }
      }
    ];
  }

  return [];
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
    case "telegram.sendChatAction":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          action: "typing"
        }
      };
    case "telegram.sendInvoice":
      return {
        type: actionType,
        params: {
          chat_id: "{{event.chatId}}",
          title: "Premium access",
          description: "Unlock premium access",
          payload: "{{order.invoicePayload}}",
          currency: "XTR",
          prices: [{ label: "Premium access", amount: 500 }],
          subscription_period: 2_592_000
        }
      };
    case "telegram.approveChatJoinRequest":
    case "telegram.declineChatJoinRequest":
    case "telegram.banChatMember":
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
    case "webhook.send":
      return {
        type: actionType,
        params: {
          url: "https://example.com/webhook",
          body: {
            event: "{{event.text}}"
          },
          response_body_format: "json"
        }
      };
    case "http.request":
      return {
        type: actionType,
        params: {
          method: "POST",
          url: "https://api.example.com/resource",
          headers: {
            "content-type": "application/json"
          },
          body_mode: "json",
          body: {
            text: "{{event.text}}"
          },
          response_body_format: "json"
        }
      };
    case "cryptopay.createInvoice":
      return {
        type: actionType,
        params: {
          currency_type: "crypto",
          asset: "USDT",
          amount: "10",
          description: "Order {{order.id}}",
          payload: "{{order.invoicePayload}}"
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
  return typeof candidate.type === "string" && typeof candidate.params === "object";
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
      return createActionTemplate("telegram.sendMessage") as ActionPayload;
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
      // fall through
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

  if (type === "variable_exists" || type === "webhook_header_exists" || type === "webhook_body_path_exists") {
    return {
      type,
      key: asString(input.key ?? input.value) ?? "flag"
    } as ConditionPayload;
  }

  if (
    type === "from_user_id" ||
    type === "target_user_id_equals"
  ) {
    return {
      type,
      value: asNumber(input.value) ?? 0
    } as ConditionPayload;
  }

  if (
    type === "webhook_header_equals" ||
    type === "webhook_query_equals" ||
    type === "webhook_query_contains" ||
    type === "webhook_body_path_equals" ||
    type === "webhook_body_path_contains"
  ) {
    return {
      type,
      key: asString(input.key) ?? "key",
      value: String(input.value ?? "")
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
      const data = (n.data ?? {}) as Record<string, unknown>;
      nodes.push({ id, type: "start", position: { x, y }, data });
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
  const match = WORKFLOW_ACTION_MANIFEST.find((item) => item.actionType === actionType);
  return match?.label ?? actionType;
}

export function summarizeAction(payload: ActionPayload): string {
  const params = payload.params as Record<string, unknown>;

  if (payload.type === "telegram.sendMessage") {
    const text = asString(params.text);
    return text ? text : "Send message";
  }

  if (payload.type === "telegram.sendPhoto") {
    const caption = asString(params.caption)?.trim() ?? "";
    const photo = asString(params.photo)?.trim() ?? "";
    if (caption) return caption;
    if (photo) return "Photo attached";
    return "Send photo";
  }

  if (payload.type === "telegram.sendVideo") {
    const caption = asString(params.caption)?.trim() ?? "";
    const video = asString(params.video)?.trim() ?? "";
    if (caption) return caption;
    if (video) return "Video attached";
    return "Send video";
  }

  if (payload.type === "telegram.sendDocument") {
    const caption = asString(params.caption)?.trim() ?? "";
    const document = asString(params.document)?.trim() ?? "";
    if (caption) return caption;
    if (document) return "Document attached";
    return "Send document";
  }

  if (payload.type === "webhook.send") {
    return asString(params.url) ?? "Send webhook";
  }

  if (payload.type === "http.request") {
    return `${asString(params.method) ?? "HTTP"} ${asString(params.url) ?? ""}`.trim();
  }

  if (payload.type === "cryptopay.createInvoice") {
    return `${asString(params.amount) ?? "0"} ${asString(params.asset) ?? asString(params.fiat) ?? "invoice"}`.trim();
  }

  return `${getCapabilityLabel(payload.type)}`;
}
