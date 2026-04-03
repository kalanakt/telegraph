import { TELEGRAM_CAPABILITIES_MANIFEST, TELEGRAM_TRIGGER_TYPES } from "../telegram/capabilities.js";
import type { ActionPayload, ConditionType, ExecutionPolicy, TriggerType } from "../types/workflow.js";

export const WORKFLOW_TRIGGER_TYPES = [...TELEGRAM_TRIGGER_TYPES, "webhook.received"] as const satisfies readonly TriggerType[];

export type WorkflowTriggerManifestItem = {
  trigger: TriggerType;
  label: string;
  group: string;
  source: "telegram" | "webhook";
  description: string;
};

export type WorkflowConditionManifestItem = {
  type: ConditionType;
  label: string;
  source: "telegram" | "webhook" | "shared";
  description: string;
};

export type WorkflowActionManifestItem = {
  actionType: ActionPayload["type"];
  label: string;
  category: string;
  source: "telegram" | "http" | "webhook";
  description: string;
  executionPolicy: ExecutionPolicy;
};

export const WORKFLOW_TRIGGER_MANIFEST: WorkflowTriggerManifestItem[] = [
  ...TELEGRAM_TRIGGER_TYPES.map((trigger) => ({
    trigger,
    label: trigger.replaceAll("_", " "),
    group:
      trigger.includes("message") || trigger.includes("command") || trigger.includes("callback") || trigger.includes("inline")
        ? "Telegram conversations"
        : trigger.includes("shipping") || trigger.includes("checkout")
        ? "Telegram commerce"
        : "Telegram events",
    source: "telegram" as const,
    description: `Run when Telegram emits ${trigger.replaceAll("_", " ")}.`
  })),
  {
    trigger: "webhook.received",
    label: "Webhook received",
    group: "Webhooks",
    source: "webhook",
    description: "Run when Telegraph receives an inbound HTTPS webhook for this flow."
  }
];

const TELEGRAM_CONDITION_TYPES: WorkflowConditionManifestItem[] = [
  { type: "text_contains", label: "Text contains", source: "telegram", description: "Match text fragments." },
  { type: "text_equals", label: "Text equals", source: "telegram", description: "Match exact text." },
  { type: "text_starts_with", label: "Text starts with", source: "telegram", description: "Match prefixes." },
  { type: "text_ends_with", label: "Text ends with", source: "telegram", description: "Match suffixes." },
  { type: "text_matches_regex", label: "Text matches regex", source: "telegram", description: "Match regex patterns." },
  { type: "from_user_id", label: "From user id", source: "telegram", description: "Match sender id." },
  { type: "from_username_equals", label: "From username", source: "telegram", description: "Match sender username." },
  { type: "chat_id_equals", label: "Chat id", source: "telegram", description: "Match chat id." },
  { type: "chat_type_equals", label: "Chat type", source: "telegram", description: "Match chat type." },
  { type: "message_source_equals", label: "Message source", source: "telegram", description: "Match direct, group, or channel source." },
  { type: "callback_data_equals", label: "Callback data equals", source: "telegram", description: "Match callback payload exactly." },
  { type: "callback_data_contains", label: "Callback data contains", source: "telegram", description: "Match callback payload partially." },
  { type: "command_equals", label: "Command equals", source: "telegram", description: "Match the Telegram command." },
  { type: "command_args_contains", label: "Command args contains", source: "telegram", description: "Match command arguments." },
  { type: "inline_query_contains", label: "Inline query contains", source: "telegram", description: "Match inline query text." },
  { type: "target_user_id_equals", label: "Target user id", source: "telegram", description: "Match membership target user." },
  { type: "old_status_equals", label: "Old status equals", source: "telegram", description: "Match previous membership status." },
  { type: "new_status_equals", label: "New status equals", source: "telegram", description: "Match next membership status." },
  { type: "message_has_photo", label: "Has photo", source: "telegram", description: "Check attached photo." },
  { type: "message_has_video", label: "Has video", source: "telegram", description: "Check attached video." },
  { type: "message_has_document", label: "Has document", source: "telegram", description: "Check attached document." },
  { type: "message_has_sticker", label: "Has sticker", source: "telegram", description: "Check attached sticker." },
  { type: "message_has_location", label: "Has location", source: "telegram", description: "Check attached location." },
  { type: "message_has_contact", label: "Has contact", source: "telegram", description: "Check attached contact." }
];

const SHARED_CONDITION_TYPES: WorkflowConditionManifestItem[] = [
  { type: "variable_equals", label: "Variable equals", source: "shared", description: "Match a runtime variable." },
  { type: "variable_exists", label: "Variable exists", source: "shared", description: "Check a runtime variable path." },
  { type: "all", label: "All conditions", source: "shared", description: "Nested AND condition." },
  { type: "any", label: "Any condition", source: "shared", description: "Nested OR condition." }
];

const WEBHOOK_CONDITION_TYPES: WorkflowConditionManifestItem[] = [
  { type: "webhook_method_equals", label: "Method equals", source: "webhook", description: "Match HTTP method." },
  { type: "webhook_header_exists", label: "Header exists", source: "webhook", description: "Require a request header." },
  { type: "webhook_header_equals", label: "Header equals", source: "webhook", description: "Match a request header." },
  { type: "webhook_query_equals", label: "Query equals", source: "webhook", description: "Match a query parameter." },
  { type: "webhook_query_contains", label: "Query contains", source: "webhook", description: "Partially match a query parameter." },
  { type: "webhook_body_path_exists", label: "Body path exists", source: "webhook", description: "Check a JSON path in the request body." },
  { type: "webhook_body_path_equals", label: "Body path equals", source: "webhook", description: "Match a JSON path in the request body." },
  { type: "webhook_body_path_contains", label: "Body path contains", source: "webhook", description: "Partially match a JSON path in the request body." }
];

export const WORKFLOW_CONDITION_MANIFEST: WorkflowConditionManifestItem[] = [
  ...TELEGRAM_CONDITION_TYPES,
  ...SHARED_CONDITION_TYPES,
  ...WEBHOOK_CONDITION_TYPES
];

const BUILTIN_ACTION_MANIFEST: WorkflowActionManifestItem[] = [
  {
    actionType: "webhook.send",
    label: "Send webhook",
    category: "Outbound webhooks",
    source: "webhook",
    description: "POST a JSON payload to another system.",
    executionPolicy: { retryClass: "transient", timeoutMs: 12_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "webhook.send" }
  },
  {
    actionType: "http.request",
    label: "HTTP request",
    category: "External APIs",
    source: "http",
    description: "Call an external HTTP API and map the response into runtime vars.",
    executionPolicy: { retryClass: "transient", timeoutMs: 20_000, idempotencyKeyStrategy: "action_run", rateLimitBucket: "http.request" }
  }
];

export const WORKFLOW_ACTION_MANIFEST: WorkflowActionManifestItem[] = [
  ...TELEGRAM_CAPABILITIES_MANIFEST.map((item) => ({
    actionType: item.actionType,
    label: item.label,
    category: item.category,
    source: "telegram" as const,
    description: item.description,
    executionPolicy: item.executionPolicy
  })),
  ...BUILTIN_ACTION_MANIFEST
];

const WEBHOOK_ONLY_CONDITIONS = new Set<ConditionType>([
  "webhook_method_equals",
  "webhook_header_exists",
  "webhook_header_equals",
  "webhook_query_equals",
  "webhook_query_contains",
  "webhook_body_path_exists",
  "webhook_body_path_equals",
  "webhook_body_path_contains"
]);

const TELEGRAM_ONLY_CONDITIONS = new Set<ConditionType>([
  "from_user_id",
  "from_username_equals",
  "chat_id_equals",
  "chat_type_equals",
  "message_source_equals",
  "callback_data_equals",
  "callback_data_contains",
  "command_equals",
  "command_args_contains",
  "inline_query_contains",
  "target_user_id_equals",
  "old_status_equals",
  "new_status_equals",
  "message_has_photo",
  "message_has_video",
  "message_has_document",
  "message_has_sticker",
  "message_has_location",
  "message_has_contact"
]);

export function isConditionAllowedForTrigger(type: ConditionType, trigger: TriggerType): boolean {
  if (trigger === "webhook.received") {
    return !TELEGRAM_ONLY_CONDITIONS.has(type);
  }

  return !WEBHOOK_ONLY_CONDITIONS.has(type);
}
