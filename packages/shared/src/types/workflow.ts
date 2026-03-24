export type TriggerType =
  | "message_received"
  | "message_edited"
  | "command_received"
  | "callback_query_received"
  | "inline_query_received"
  | "chat_member_updated";

export type ConditionType =
  | "text_contains"
  | "text_equals"
  | "from_user_id"
  | "from_username_equals"
  | "chat_id_equals"
  | "chat_type_equals"
  | "message_source_equals"
  | "variable_equals"
  | "variable_exists"
  | "all"
  | "any";

export type ActionType =
  | "send_text"
  | "send_photo"
  | "send_document"
  | "edit_message_text"
  | "delete_message"
  | "answer_callback_query"
  | "delay"
  | "set_variable"
  | "branch_on_variable"
  | "restrict_chat_member"
  | "ban_chat_member"
  | "unban_chat_member";

export type LegacyActionType = "send_message";

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
  | { type: "from_user_id"; value: number }
  | { type: "from_username_equals"; value: string }
  | { type: "chat_id_equals"; value: string }
  | { type: "chat_type_equals"; value: string }
  | { type: "message_source_equals"; value: "user" | "channel" | "group" }
  | { type: "variable_equals"; key: string; value: string }
  | { type: "variable_exists"; key: string }
  | { type: "all"; conditions: ConditionPayload[] }
  | { type: "any"; conditions: ConditionPayload[] };

export type SendTextActionPayload = {
  type: "send_text";
  chatId?: string;
  text: string;
};

export type SendPhotoActionPayload = {
  type: "send_photo";
  chatId?: string;
  photoUrl: string;
  caption?: string;
};

export type SendDocumentActionPayload = {
  type: "send_document";
  chatId?: string;
  documentUrl: string;
  caption?: string;
};

export type EditMessageTextActionPayload = {
  type: "edit_message_text";
  chatId?: string;
  messageId?: number;
  text: string;
};

export type DeleteMessageActionPayload = {
  type: "delete_message";
  chatId?: string;
  messageId?: number;
};

export type AnswerCallbackQueryActionPayload = {
  type: "answer_callback_query";
  callbackQueryId?: string;
  text?: string;
  showAlert?: boolean;
};

export type DelayActionPayload = {
  type: "delay";
  delayMs: number;
};

export type SetVariableActionPayload = {
  type: "set_variable";
  key: string;
  value: string;
};

export type BranchOnVariableActionPayload = {
  type: "branch_on_variable";
  key: string;
  equals: string;
};

export type RestrictChatMemberActionPayload = {
  type: "restrict_chat_member";
  chatId?: string;
  userId: number;
  untilDate?: number;
  canSendMessages?: boolean;
};

export type BanChatMemberActionPayload = {
  type: "ban_chat_member";
  chatId?: string;
  userId: number;
  revokeMessages?: boolean;
};

export type UnbanChatMemberActionPayload = {
  type: "unban_chat_member";
  chatId?: string;
  userId: number;
  onlyIfBanned?: boolean;
};

export type LegacySendMessageActionPayload = {
  type: "send_message";
  chatId?: string;
  text: string;
};

export type ActionPayload =
  | SendTextActionPayload
  | SendPhotoActionPayload
  | SendDocumentActionPayload
  | EditMessageTextActionPayload
  | DeleteMessageActionPayload
  | AnswerCallbackQueryActionPayload
  | DelayActionPayload
  | SetVariableActionPayload
  | BranchOnVariableActionPayload
  | RestrictChatMemberActionPayload
  | BanChatMemberActionPayload
  | UnbanChatMemberActionPayload;

export type FlowNodeType = "start" | "condition" | "action";

export type FlowNodePosition = {
  x: number;
  y: number;
};

export type FlowConditionNodeData = ConditionPayload;

export type FlowActionNodeData = ActionPayload | LegacySendMessageActionPayload;

export type FlowNode =
  | {
      id: string;
      type: "start";
      position: FlowNodePosition;
      data: Record<string, unknown>;
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
};

export type FlowDefinition = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export type NormalizedEventBase = {
  trigger: TriggerType;
  updateId: number;
  chatId: string;
  chatType: string;
  fromUserId?: number;
  fromUsername?: string;
  messageSource: "user" | "channel" | "group";
  text: string;
  messageId?: number;
  callbackQueryId?: string;
  inlineQueryId?: string;
  variables?: Record<string, string>;
};

export type MessageReceivedEvent = NormalizedEventBase & {
  trigger: "message_received";
};

export type MessageEditedEvent = NormalizedEventBase & {
  trigger: "message_edited";
};

export type CommandReceivedEvent = NormalizedEventBase & {
  trigger: "command_received";
  command: string;
  commandArgs: string;
};

export type CallbackQueryReceivedEvent = NormalizedEventBase & {
  trigger: "callback_query_received";
  callbackQueryId: string;
  callbackData?: string;
};

export type InlineQueryReceivedEvent = NormalizedEventBase & {
  trigger: "inline_query_received";
  inlineQueryId: string;
  inlineQuery: string;
};

export type ChatMemberUpdatedEvent = NormalizedEventBase & {
  trigger: "chat_member_updated";
  targetUserId?: number;
  oldStatus?: string;
  newStatus?: string;
};

export type NormalizedEvent =
  | MessageReceivedEvent
  | MessageEditedEvent
  | CommandReceivedEvent
  | CallbackQueryReceivedEvent
  | InlineQueryReceivedEvent
  | ChatMemberUpdatedEvent;

export type WorkflowContext = {
  variables: Record<string, string>;
};
