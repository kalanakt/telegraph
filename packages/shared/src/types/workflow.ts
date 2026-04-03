import type {
  TelegramActionType,
  TelegramMethod,
  TelegramMethodParams,
  TelegramMethodParamsMap,
  TelegramTriggerType
} from "../telegram/capabilities.js";
import { TELEGRAM_TRIGGER_TYPES } from "../telegram/capabilities.js";
import type { TelegramUpdate } from "./telegram.js";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

export const WEBHOOK_TRIGGER_TYPES = ["webhook.received"] as const;
export type WebhookTriggerType = (typeof WEBHOOK_TRIGGER_TYPES)[number];

export const FLOW_TRIGGER_TYPES = [...TELEGRAM_TRIGGER_TYPES, ...WEBHOOK_TRIGGER_TYPES] as const;

export type TriggerType = TelegramTriggerType | WebhookTriggerType;
export type EventSource = "telegram" | "webhook";

export type ConditionType =
  | "text_contains"
  | "text_equals"
  | "text_starts_with"
  | "text_ends_with"
  | "text_matches_regex"
  | "from_user_id"
  | "from_username_equals"
  | "chat_id_equals"
  | "chat_type_equals"
  | "message_source_equals"
  | "variable_equals"
  | "variable_exists"
  | "callback_data_equals"
  | "callback_data_contains"
  | "command_equals"
  | "command_args_contains"
  | "inline_query_contains"
  | "target_user_id_equals"
  | "old_status_equals"
  | "new_status_equals"
  | "message_has_photo"
  | "message_has_video"
  | "message_has_document"
  | "message_has_sticker"
  | "message_has_location"
  | "message_has_contact"
  | "webhook_method_equals"
  | "webhook_header_exists"
  | "webhook_header_equals"
  | "webhook_query_equals"
  | "webhook_query_contains"
  | "webhook_body_path_exists"
  | "webhook_body_path_equals"
  | "webhook_body_path_contains"
  | "all"
  | "any";

export type ActionType = TelegramActionType | "webhook.send" | "http.request";

export type RetryClass = "transient" | "permanent";

export type ExecutionPolicy = {
  retryClass: RetryClass;
  timeoutMs: number;
  idempotencyKeyStrategy: "none" | "action_run" | "event_and_action";
  rateLimitBucket: string;
};

export type ConditionPayload =
  | { type: "text_contains"; value: string }
  | { type: "text_equals"; value: string }
  | { type: "text_starts_with"; value: string }
  | { type: "text_ends_with"; value: string }
  | { type: "text_matches_regex"; value: string }
  | { type: "from_user_id"; value: number }
  | { type: "from_username_equals"; value: string }
  | { type: "chat_id_equals"; value: string }
  | { type: "chat_type_equals"; value: string }
  | { type: "message_source_equals"; value: "user" | "channel" | "group" }
  | { type: "variable_equals"; key: string; value: string }
  | { type: "variable_exists"; key: string }
  | { type: "callback_data_equals"; value: string }
  | { type: "callback_data_contains"; value: string }
  | { type: "command_equals"; value: string }
  | { type: "command_args_contains"; value: string }
  | { type: "inline_query_contains"; value: string }
  | { type: "target_user_id_equals"; value: number }
  | { type: "old_status_equals"; value: string }
  | { type: "new_status_equals"; value: string }
  | { type: "message_has_photo" }
  | { type: "message_has_video" }
  | { type: "message_has_document" }
  | { type: "message_has_sticker" }
  | { type: "message_has_location" }
  | { type: "message_has_contact" }
  | { type: "webhook_method_equals"; value: string }
  | { type: "webhook_header_exists"; key: string }
  | { type: "webhook_header_equals"; key: string; value: string }
  | { type: "webhook_query_equals"; key: string; value: string }
  | { type: "webhook_query_contains"; key: string; value: string }
  | { type: "webhook_body_path_exists"; key: string }
  | { type: "webhook_body_path_equals"; key: string; value: string }
  | { type: "webhook_body_path_contains"; key: string; value: string }
  | { type: "all"; conditions: ConditionPayload[] }
  | { type: "any"; conditions: ConditionPayload[] };

export type TelegramActionPayload<M extends TelegramMethod = TelegramMethod> = {
  type: `telegram.${M}`;
  params: TelegramMethodParams<M>;
};

export type TelegramActionUnion = {
  [K in TelegramMethod]: {
    type: `telegram.${K}`;
    params: TelegramMethodParamsMap[K];
  };
}[TelegramMethod];

export type HttpAuthConfig =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "api_key_header"; header: string; value: string }
  | { type: "api_key_query"; key: string; value: string };

export type WebhookSendActionPayload = {
  type: "webhook.send";
  params: {
    url: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    auth?: HttpAuthConfig;
    body?: JsonValue;
    timeout_ms?: number;
    response_body_format?: "auto" | "json" | "text";
  };
};

export type HttpRequestActionPayload = {
  type: "http.request";
  params: {
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    url: string;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    auth?: HttpAuthConfig;
    body_mode?: "json" | "text";
    body?: JsonValue | string;
    timeout_ms?: number;
    response_body_format?: "auto" | "json" | "text";
  };
};

export type ActionPayload = TelegramActionUnion | WebhookSendActionPayload | HttpRequestActionPayload;

export type FlowNodeType = "start" | "condition" | "action";

export type FlowNodePosition = {
  x: number;
  y: number;
};

export type FlowConditionNodeData = ConditionPayload;

export type FlowActionNodeData = ActionPayload;

export type FlowNode =
  | {
      id: string;
      type: "start";
      position: FlowNodePosition;
      data: { trigger?: TriggerType } & Record<string, unknown>;
    }
  | {
      id: string;
      type: "condition";
      position: FlowNodePosition;
      data: FlowConditionNodeData;
    }
  | {
      id: string;
      type: "action";
      position: FlowNodePosition;
      data: FlowActionNodeData;
    };

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
};

export type FlowDefinition = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type NormalizedEventBase = {
  source: EventSource;
  trigger: TriggerType;
  eventId: string;
  updateId: number;
  chatId?: string;
  chatType?: string;
  fromUserId?: number;
  fromUsername?: string;
  messageSource?: "user" | "channel" | "group";
  text: string;
  messageId?: number;
  callbackQueryId?: string;
  callbackData?: string;
  inlineQueryId?: string;
  inlineQuery?: string;
  shippingQueryId?: string;
  preCheckoutQueryId?: string;
  command?: string;
  commandArgs?: string;
  variables?: Record<string, JsonValue>;
  targetUserId?: number;
  oldStatus?: string;
  newStatus?: string;
  hasPhoto?: boolean;
  hasVideo?: boolean;
  hasDocument?: boolean;
  hasSticker?: boolean;
  hasLocation?: boolean;
  hasContact?: boolean;
  rawUpdate?: TelegramUpdate;
};

export type MessageReceivedEvent = NormalizedEventBase & { source: "telegram"; trigger: "message_received" };
export type MessageEditedEvent = NormalizedEventBase & { source: "telegram"; trigger: "message_edited" };
export type ChannelPostReceivedEvent = NormalizedEventBase & { source: "telegram"; trigger: "channel_post_received" };
export type ChannelPostEditedEvent = NormalizedEventBase & { source: "telegram"; trigger: "channel_post_edited" };
export type CommandReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "command_received";
  command: string;
  commandArgs: string;
};
export type CallbackQueryReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "callback_query_received";
  callbackQueryId: string;
};
export type InlineQueryReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "inline_query_received";
  inlineQueryId: string;
  inlineQuery: string;
};
export type ChosenInlineResultReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "chosen_inline_result_received";
};
export type ShippingQueryReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "shipping_query_received";
  shippingQueryId: string;
};
export type PreCheckoutQueryReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "pre_checkout_query_received";
  preCheckoutQueryId: string;
};
export type PollReceivedEvent = NormalizedEventBase & { source: "telegram"; trigger: "poll_received" };
export type PollAnswerReceivedEvent = NormalizedEventBase & { source: "telegram"; trigger: "poll_answer_received" };
export type ChatMemberUpdatedEvent = NormalizedEventBase & { source: "telegram"; trigger: "chat_member_updated" };
export type MyChatMemberUpdatedEvent = NormalizedEventBase & { source: "telegram"; trigger: "my_chat_member_updated" };
export type ChatJoinRequestReceivedEvent = NormalizedEventBase & { source: "telegram"; trigger: "chat_join_request_received" };
export type MessageReactionUpdatedEvent = NormalizedEventBase & { source: "telegram"; trigger: "message_reaction_updated" };
export type MessageReactionCountUpdatedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "message_reaction_count_updated";
};
export type UpdateReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "update_received";
  rawUpdate: TelegramUpdate;
};
export type WebhookReceivedEvent = NormalizedEventBase & {
  source: "webhook";
  trigger: "webhook.received";
  webhookEndpointId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body: JsonValue | null;
  bodyRaw: string;
};

export type NormalizedEvent =
  | MessageReceivedEvent
  | MessageEditedEvent
  | ChannelPostReceivedEvent
  | ChannelPostEditedEvent
  | CommandReceivedEvent
  | CallbackQueryReceivedEvent
  | InlineQueryReceivedEvent
  | ChosenInlineResultReceivedEvent
  | ShippingQueryReceivedEvent
  | PreCheckoutQueryReceivedEvent
  | PollReceivedEvent
  | PollAnswerReceivedEvent
  | ChatMemberUpdatedEvent
  | MyChatMemberUpdatedEvent
  | ChatJoinRequestReceivedEvent
  | MessageReactionUpdatedEvent
  | MessageReactionCountUpdatedEvent
  | UpdateReceivedEvent
  | WebhookReceivedEvent;

export type WorkflowContext = {
  variables: Record<string, JsonValue>;
};

export type ActionExecutionResult = {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: JsonValue | string | null;
};
