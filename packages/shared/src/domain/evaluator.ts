import type { ConditionPayload, NormalizedEvent, WorkflowContext } from "../types/workflow.js";

export function evaluateCondition(
  event: NormalizedEvent,
  condition: ConditionPayload,
  context: WorkflowContext = { variables: event.variables ?? {} }
): boolean {
  switch (condition.type) {
    case "text_contains":
      return (event.text ?? "").toLowerCase().includes(condition.value.toLowerCase());
    case "text_equals":
      return (event.text ?? "").trim().toLowerCase() === condition.value.trim().toLowerCase();
    case "text_starts_with":
      return (event.text ?? "").toLowerCase().startsWith(condition.value.toLowerCase());
    case "text_ends_with":
      return (event.text ?? "").toLowerCase().endsWith(condition.value.toLowerCase());
    case "from_user_id":
      return event.fromUserId === condition.value;
    case "from_username_equals":
      return (event.fromUsername ?? "").toLowerCase() === condition.value.toLowerCase();
    case "chat_id_equals":
      return (event.chatId ?? "") === condition.value;
    case "chat_type_equals":
      return (event.chatType ?? "") === condition.value;
    case "message_source_equals":
      return (event.messageSource ?? "user") === condition.value;
    case "variable_equals":
      return context.variables[condition.key] === condition.value;
    case "variable_exists":
      return typeof context.variables[condition.key] !== "undefined";
    case "callback_data_equals":
      return (event.callbackData ?? "") === condition.value;
    case "callback_data_contains":
      return (event.callbackData ?? "").toLowerCase().includes(condition.value.toLowerCase());
    case "command_equals":
      return (event.command ?? "").toLowerCase() === condition.value.toLowerCase();
    case "command_args_contains":
      return (event.commandArgs ?? "").toLowerCase().includes(condition.value.toLowerCase());
    case "inline_query_contains":
      return (event.inlineQuery ?? "").toLowerCase().includes(condition.value.toLowerCase());
    case "target_user_id_equals":
      return event.targetUserId === condition.value;
    case "old_status_equals":
      return (event.oldStatus ?? "").toLowerCase() === condition.value.toLowerCase();
    case "new_status_equals":
      return (event.newStatus ?? "").toLowerCase() === condition.value.toLowerCase();
    case "message_has_photo":
      return Boolean(event.hasPhoto);
    case "message_has_video":
      return Boolean(event.hasVideo);
    case "message_has_document":
      return Boolean(event.hasDocument);
    case "message_has_sticker":
      return Boolean(event.hasSticker);
    case "message_has_location":
      return Boolean(event.hasLocation);
    case "message_has_contact":
      return Boolean(event.hasContact);
    case "all":
      return condition.conditions.every((item) => evaluateCondition(event, item, context));
    case "any":
      return condition.conditions.some((item) => evaluateCondition(event, item, context));
    default:
      return false;
  }
}

export function evaluateAllConditions(
  event: NormalizedEvent,
  conditions: ConditionPayload[],
  context: WorkflowContext = { variables: event.variables ?? {} }
): boolean {
  return conditions.every((condition) => evaluateCondition(event, condition, context));
}
