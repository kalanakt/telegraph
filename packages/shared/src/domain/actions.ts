import type {
  ActionPayload,
  ActionType,
  ExecutionPolicy,
  LegacySendMessageActionPayload,
  TriggerType
} from "../types/workflow.js";

export const ACTION_EXECUTION_POLICIES: Record<ActionType, ExecutionPolicy> = {
  send_text: {
    retryClass: "transient",
    timeoutMs: 15_000,
    idempotencyKeyStrategy: "event_and_action",
    rateLimitBucket: "telegram.write"
  },
  send_photo: {
    retryClass: "transient",
    timeoutMs: 20_000,
    idempotencyKeyStrategy: "event_and_action",
    rateLimitBucket: "telegram.write"
  },
  send_document: {
    retryClass: "transient",
    timeoutMs: 25_000,
    idempotencyKeyStrategy: "event_and_action",
    rateLimitBucket: "telegram.write"
  },
  edit_message_text: {
    retryClass: "transient",
    timeoutMs: 15_000,
    idempotencyKeyStrategy: "event_and_action",
    rateLimitBucket: "telegram.write"
  },
  delete_message: {
    retryClass: "transient",
    timeoutMs: 10_000,
    idempotencyKeyStrategy: "event_and_action",
    rateLimitBucket: "telegram.write"
  },
  answer_callback_query: {
    retryClass: "transient",
    timeoutMs: 8_000,
    idempotencyKeyStrategy: "action_run",
    rateLimitBucket: "telegram.callback"
  },
  delay: {
    retryClass: "permanent",
    timeoutMs: 120_000,
    idempotencyKeyStrategy: "action_run",
    rateLimitBucket: "control"
  },
  set_variable: {
    retryClass: "permanent",
    timeoutMs: 5_000,
    idempotencyKeyStrategy: "action_run",
    rateLimitBucket: "control"
  },
  branch_on_variable: {
    retryClass: "permanent",
    timeoutMs: 5_000,
    idempotencyKeyStrategy: "action_run",
    rateLimitBucket: "control"
  },
  restrict_chat_member: {
    retryClass: "transient",
    timeoutMs: 15_000,
    idempotencyKeyStrategy: "event_and_action",
    rateLimitBucket: "telegram.moderation"
  },
  ban_chat_member: {
    retryClass: "transient",
    timeoutMs: 15_000,
    idempotencyKeyStrategy: "event_and_action",
    rateLimitBucket: "telegram.moderation"
  },
  unban_chat_member: {
    retryClass: "transient",
    timeoutMs: 15_000,
    idempotencyKeyStrategy: "event_and_action",
    rateLimitBucket: "telegram.moderation"
  }
};

const ACTION_TRIGGER_COMPAT: Record<ActionType, TriggerType[] | "all"> = {
  send_text: "all",
  send_photo: "all",
  send_document: "all",
  edit_message_text: ["message_received", "message_edited", "command_received", "callback_query_received"],
  delete_message: ["message_received", "message_edited", "command_received", "callback_query_received"],
  answer_callback_query: ["callback_query_received"],
  delay: "all",
  set_variable: "all",
  branch_on_variable: "all",
  restrict_chat_member: ["chat_member_updated", "message_received", "command_received"],
  ban_chat_member: ["chat_member_updated", "message_received", "command_received"],
  unban_chat_member: ["chat_member_updated", "message_received", "command_received"]
};

export function normalizeActionPayload(action: ActionPayload | LegacySendMessageActionPayload): ActionPayload {
  if (action.type === "send_message") {
    return {
      type: "send_text",
      chatId: action.chatId,
      text: action.text
    };
  }

  return action;
}

export function isActionAllowedForTrigger(actionType: ActionType, trigger: TriggerType): boolean {
  const compat = ACTION_TRIGGER_COMPAT[actionType];
  if (compat === "all") {
    return true;
  }

  return compat.includes(trigger);
}

export function getExecutionPolicy(actionType: ActionType): ExecutionPolicy {
  return ACTION_EXECUTION_POLICIES[actionType];
}
