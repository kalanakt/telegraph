import type { ConditionPayload, NormalizedEvent, WorkflowContext } from "../types/workflow";

export function evaluateCondition(
  event: NormalizedEvent,
  condition: ConditionPayload,
  context: WorkflowContext = { variables: event.variables ?? {} }
): boolean {
  switch (condition.type) {
    case "text_contains":
      return event.text.toLowerCase().includes(condition.value.toLowerCase());
    case "text_equals":
      return event.text.trim().toLowerCase() === condition.value.trim().toLowerCase();
    case "from_user_id":
      return event.fromUserId === condition.value;
    case "from_username_equals":
      return (event.fromUsername ?? "").toLowerCase() === condition.value.toLowerCase();
    case "chat_id_equals":
      return event.chatId === condition.value;
    case "chat_type_equals":
      return event.chatType === condition.value;
    case "message_source_equals":
      return event.messageSource === condition.value;
    case "variable_equals":
      return context.variables[condition.key] === condition.value;
    case "variable_exists":
      return typeof context.variables[condition.key] !== "undefined";
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
