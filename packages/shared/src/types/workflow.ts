import type {
  CryptoPayCreateInvoiceParams,
  CryptoPayCurrencyType,
  CryptoPayPaidButtonName
} from "../crypto-pay/client.js";
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

export type FlowNodeMeta = {
  label?: string;
  key?: string;
};

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
  | "event_path_exists"
  | "event_path_equals"
  | "event_path_contains"
  | "event_path_matches_regex"
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

export type ActionType =
  | TelegramActionType
  | "cryptopay.createInvoice"
  | "webhook.send"
  | "http.request"
  | "workflow.setVariable"
  | "workflow.delay"
  | "workflow.awaitMessage"
  | "workflow.awaitCallback"
  | "workflow.collectContact"
  | "workflow.collectShipping"
  | "workflow.formStep"
  | "workflow.upsertCustomer"
  | "workflow.upsertOrder"
  | "workflow.createInvoice"
  | "workflow.orderTransition";

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
  | { type: "event_path_exists"; key: string }
  | { type: "event_path_equals"; key: string; value: string }
  | { type: "event_path_contains"; key: string; value: string }
  | { type: "event_path_matches_regex"; key: string; value: string }
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

export type CryptoPayCreateInvoiceActionPayload = {
  type: "cryptopay.createInvoice";
  params: CryptoPayCreateInvoiceParams;
};

export type ActionPayload =
  | TelegramActionUnion
  | WebhookSendActionPayload
  | HttpRequestActionPayload
  | CryptoPayCreateInvoiceActionPayload;

export type { CryptoPayCurrencyType, CryptoPayPaidButtonName };

export type WorkflowSetVariableActionPayload = {
  type: "workflow.setVariable";
  params: {
    path: string;
    value: JsonValue;
  };
};

export type WorkflowDelayActionPayload = {
  type: "workflow.delay";
  params: {
    delay_ms: number;
  };
};

export type WorkflowAwaitMessageActionPayload = {
  type: "workflow.awaitMessage";
  params: {
    timeout_ms?: number;
    store_as?: string;
  };
};

export type WorkflowAwaitCallbackActionPayload = {
  type: "workflow.awaitCallback";
  params: {
    timeout_ms?: number;
    callback_prefix?: string;
    store_as?: string;
  };
};

export type WorkflowCollectContactActionPayload = {
  type: "workflow.collectContact";
  params: {
    timeout_ms?: number;
  };
};

export type WorkflowCollectShippingActionPayload = {
  type: "workflow.collectShipping";
  params: {
    timeout_ms?: number;
  };
};

export type WorkflowFormStepActionPayload = {
  type: "workflow.formStep";
  params: {
    field: string;
    source: "text" | "contact_phone" | "contact_payload" | "shipping_address";
    prompt?: string;
    timeout_ms?: number;
  };
};

export type WorkflowUpsertCustomerActionPayload = {
  type: "workflow.upsertCustomer";
  params: {
    profile: JsonValue;
  };
};

export type WorkflowUpsertOrderActionPayload = {
  type: "workflow.upsertOrder";
  params: {
    external_id?: string;
    invoice_payload?: string;
    currency?: string;
    total_amount?: number;
    status?: CommerceOrderStatus;
    data?: JsonValue;
  };
};

export type WorkflowCreateInvoiceActionPayload = {
  type: "workflow.createInvoice";
  params: {
    invoice_payload: string;
    title?: string;
    description?: string;
    currency: string;
    total_amount: number;
    data?: JsonValue;
  };
};

export type WorkflowOrderTransitionActionPayload = {
  type: "workflow.orderTransition";
  params: {
    status: CommerceOrderStatus;
    note?: string;
  };
};

export type ExecutablePayload =
  | ActionPayload
  | WorkflowSetVariableActionPayload
  | WorkflowDelayActionPayload
  | WorkflowAwaitMessageActionPayload
  | WorkflowAwaitCallbackActionPayload
  | WorkflowCollectContactActionPayload
  | WorkflowCollectShippingActionPayload
  | WorkflowFormStepActionPayload
  | WorkflowUpsertCustomerActionPayload
  | WorkflowUpsertOrderActionPayload
  | WorkflowCreateInvoiceActionPayload
  | WorkflowOrderTransitionActionPayload;

export type CommerceOrderStatus = "draft" | "awaiting_shipping" | "awaiting_payment" | "paid" | "fulfilled" | "canceled";

export type ConversationSessionStatus = "ACTIVE" | "PAUSED" | "HANDOFF" | "CLOSED";
export type SessionCheckpointStatus = "OPEN" | "RESUMED" | "EXPIRED" | "CANCELED";

export type ConversationSessionState = {
  id?: string;
  botId?: string;
  chatId?: string;
  telegramUserId?: string;
  customerProfileId?: string;
  status?: ConversationSessionStatus;
  handoffOwner?: string;
  handoffNote?: string;
  checkpointId?: string;
  resumedFromCheckpointId?: string;
  context?: Record<string, JsonValue>;
};

export type CustomerProfileState = {
  id?: string;
  botId?: string;
  telegramUserId?: string;
  chatId?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
  phoneNumber?: string;
  email?: string;
  tags?: JsonValue;
  attributes?: Record<string, JsonValue>;
};

export type CommerceOrderState = {
  id?: string;
  botId?: string;
  sessionId?: string;
  customerProfileId?: string;
  latestWorkflowRunId?: string;
  externalId?: string;
  invoicePayload?: string;
  currency?: string;
  totalAmount?: number;
  shippingOptionId?: string;
  shippingAddress?: JsonValue;
  orderInfo?: JsonValue;
  attributes?: Record<string, JsonValue>;
  status?: CommerceOrderStatus;
};

export type FlowNodeType =
  | "start"
  | "condition"
  | "action"
  | "switch"
  | "set_variable"
  | "delay"
  | "await_message"
  | "await_callback"
  | "collect_contact"
  | "collect_shipping"
  | "form_step"
  | "upsert_customer"
  | "upsert_order"
  | "create_invoice"
  | "order_transition";

export type FlowNodePosition = {
  x: number;
  y: number;
};

export type FlowConditionNodeData = ConditionPayload;

export type FlowActionNodeData = ActionPayload;

export type FlowSwitchCase = {
  id: string;
  value: string;
  label?: string;
};

export type FlowSwitchNodeData = {
  path: string;
  cases: FlowSwitchCase[];
};

export type FlowSetVariableNodeData = {
  path: string;
  value: JsonValue;
};

export type FlowDelayNodeData = {
  delay_ms: number;
};

export type FlowAwaitMessageNodeData = {
  timeout_ms?: number;
  store_as?: string;
};

export type FlowAwaitCallbackNodeData = {
  timeout_ms?: number;
  callback_prefix?: string;
  store_as?: string;
};

export type FlowCollectContactNodeData = {
  timeout_ms?: number;
};

export type FlowCollectShippingNodeData = {
  timeout_ms?: number;
};

export type FlowFormStepNodeData = {
  field: string;
  source: "text" | "contact_phone" | "contact_payload" | "shipping_address";
  prompt?: string;
  timeout_ms?: number;
};

export type FlowUpsertCustomerNodeData = {
  profile: JsonValue;
};

export type FlowUpsertOrderNodeData = {
  external_id?: string;
  invoice_payload?: string;
  currency?: string;
  total_amount?: number;
  status?: CommerceOrderStatus;
  data?: JsonValue;
};

export type FlowCreateInvoiceNodeData = {
  invoice_payload: string;
  title?: string;
  description?: string;
  currency: string;
  total_amount: number;
  data?: JsonValue;
};

export type FlowOrderTransitionNodeData = {
  status: CommerceOrderStatus;
  note?: string;
};

export type FlowNode =
  | {
      id: string;
      type: "start";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: { trigger?: TriggerType } & Record<string, unknown>;
    }
  | {
      id: string;
      type: "condition";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowConditionNodeData;
    }
  | {
      id: string;
      type: "action";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowActionNodeData;
    }
  | {
      id: string;
      type: "switch";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowSwitchNodeData;
    }
  | {
      id: string;
      type: "set_variable";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowSetVariableNodeData;
    }
  | {
      id: string;
      type: "delay";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowDelayNodeData;
    }
  | {
      id: string;
      type: "await_message";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowAwaitMessageNodeData;
    }
  | {
      id: string;
      type: "await_callback";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowAwaitCallbackNodeData;
    }
  | {
      id: string;
      type: "collect_contact";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowCollectContactNodeData;
    }
  | {
      id: string;
      type: "collect_shipping";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowCollectShippingNodeData;
    }
  | {
      id: string;
      type: "form_step";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowFormStepNodeData;
    }
  | {
      id: string;
      type: "upsert_customer";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowUpsertCustomerNodeData;
    }
  | {
      id: string;
      type: "upsert_order";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowUpsertOrderNodeData;
    }
  | {
      id: string;
      type: "create_invoice";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowCreateInvoiceNodeData;
    }
  | {
      id: string;
      type: "order_transition";
      position: FlowNodePosition;
      meta?: FlowNodeMeta;
      data: FlowOrderTransitionNodeData;
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
  callbackSourceMessageId?: number;
  callbackSourceChatId?: string;
  inlineQueryId?: string;
  inlineQuery?: string;
  shippingQueryId?: string;
  preCheckoutQueryId?: string;
  invoicePayload?: string;
  currency?: string;
  totalAmount?: number;
  shippingOptionId?: string;
  shippingAddress?: JsonValue;
  orderInfo?: JsonValue;
  command?: string;
  commandArgs?: string;
  variables?: Record<string, JsonValue>;
  targetUserId?: number;
  oldStatus?: string;
  newStatus?: string;
  joinRequestBio?: string;
  joinRequestInviteLink?: string;
  pollId?: string;
  pollOptionIds?: number[];
  oldReaction?: JsonValue;
  newReaction?: JsonValue;
  reactionCount?: JsonValue;
  hasPhoto?: boolean;
  hasVideo?: boolean;
  hasDocument?: boolean;
  hasSticker?: boolean;
  hasLocation?: boolean;
  hasContact?: boolean;
  contactPhoneNumber?: string;
  contactUserId?: number;
  successfulPaymentChargeId?: string;
  successfulPaymentProviderChargeId?: string;
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
  invoicePayload: string;
};
export type PreCheckoutQueryReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "pre_checkout_query_received";
  preCheckoutQueryId: string;
  invoicePayload: string;
  currency: string;
  totalAmount: number;
};
export type PollReceivedEvent = NormalizedEventBase & { source: "telegram"; trigger: "poll_received" };
export type PollAnswerReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "poll_answer_received";
  pollId: string;
  pollOptionIds: number[];
};
export type ChatMemberUpdatedEvent = NormalizedEventBase & { source: "telegram"; trigger: "chat_member_updated" };
export type MyChatMemberUpdatedEvent = NormalizedEventBase & { source: "telegram"; trigger: "my_chat_member_updated" };
export type ChatJoinRequestReceivedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "chat_join_request_received";
};
export type MessageReactionUpdatedEvent = NormalizedEventBase & {
  source: "telegram";
  trigger: "message_reaction_updated";
};
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
  session: ConversationSessionState;
  customer: CustomerProfileState;
  order: CommerceOrderState;
};

export type ActionExecutionResult = {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: JsonValue | string | null;
};
