import type {
  TelegramActionType,
  TelegramMethod,
  TelegramMethodParams,
  TelegramMethodParamsMap,
  TelegramTriggerType
} from "../telegram/capabilities.js";
import type { TelegramUpdate } from "./telegram.js";

export type TriggerType = TelegramTriggerType;

export type ConditionType =
  | "text_contains"
  | "text_equals"
  | "text_starts_with"
  | "text_ends_with"
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
  | "all"
  | "any";

export type ActionType = TelegramActionType;

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
  | { type: "all"; conditions: ConditionPayload[] }
  | { type: "any"; conditions: ConditionPayload[] };

export type TelegramActionPayload<M extends TelegramMethod = TelegramMethod> = {
  type: `telegram.${M}`;
  params: TelegramMethodParams<M>;
};

export type ActionPayload = {
  [K in TelegramMethod]: {
    type: `telegram.${K}`;
    params: TelegramMethodParamsMap[K];
  };
}[TelegramMethod];

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
  trigger: TriggerType;
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
  variables?: Record<string, string>;
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

export type MessageReceivedEvent = NormalizedEventBase & { trigger: "message_received" };
export type MessageEditedEvent = NormalizedEventBase & { trigger: "message_edited" };
export type ChannelPostReceivedEvent = NormalizedEventBase & { trigger: "channel_post_received" };
export type ChannelPostEditedEvent = NormalizedEventBase & { trigger: "channel_post_edited" };
export type CommandReceivedEvent = NormalizedEventBase & {
  trigger: "command_received";
  command: string;
  commandArgs: string;
};
export type CallbackQueryReceivedEvent = NormalizedEventBase & {
  trigger: "callback_query_received";
  callbackQueryId: string;
};
export type InlineQueryReceivedEvent = NormalizedEventBase & {
  trigger: "inline_query_received";
  inlineQueryId: string;
  inlineQuery: string;
};
export type ChosenInlineResultReceivedEvent = NormalizedEventBase & { trigger: "chosen_inline_result_received" };
export type ShippingQueryReceivedEvent = NormalizedEventBase & { trigger: "shipping_query_received"; shippingQueryId: string };
export type PreCheckoutQueryReceivedEvent = NormalizedEventBase & {
  trigger: "pre_checkout_query_received";
  preCheckoutQueryId: string;
};
export type PollReceivedEvent = NormalizedEventBase & { trigger: "poll_received" };
export type PollAnswerReceivedEvent = NormalizedEventBase & { trigger: "poll_answer_received" };
export type ChatMemberUpdatedEvent = NormalizedEventBase & { trigger: "chat_member_updated" };
export type MyChatMemberUpdatedEvent = NormalizedEventBase & { trigger: "my_chat_member_updated" };
export type ChatJoinRequestReceivedEvent = NormalizedEventBase & { trigger: "chat_join_request_received" };
export type MessageReactionUpdatedEvent = NormalizedEventBase & { trigger: "message_reaction_updated" };
export type MessageReactionCountUpdatedEvent = NormalizedEventBase & { trigger: "message_reaction_count_updated" };
export type UpdateReceivedEvent = NormalizedEventBase & {
  trigger: "update_received";
  rawUpdate: TelegramUpdate;
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
  | UpdateReceivedEvent;

export type WorkflowContext = {
  variables: Record<string, string>;
};
