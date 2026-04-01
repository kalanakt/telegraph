import type { ActionPayload, TriggerType } from "@telegram-builder/shared";

export type BotOption = {
  id: string;
  label: string;
};

export type RuleOption = {
  id: string;
  botId: string;
  name: string;
  trigger: TriggerType;
  flowDefinition: import("@telegram-builder/shared").FlowDefinition;
};

export type FlowBuilderProps = {
  bots: BotOption[];
  rules: RuleOption[];
  initialRuleId?: string;
};

export type FlowNodeKind = "start" | "condition" | "action";

export type ConditionEditorData = {
  type?: string;
  value?: string | number;
  key?: string;
  conditionsJson?: string;
};

export type InlineKeyboardButton = {
  text: string;
  url?: string;
  callback_data?: string;
};

export type ReplyKeyboardButton = { text: string };

export type ActionEditorData = {
  type: ActionPayload["type"];
  params: Record<string, unknown>;
};

export const CONDITION_OPTIONS = [
  "text_contains",
  "text_equals",
  "text_starts_with",
  "text_ends_with",
  "from_user_id",
  "from_username_equals",
  "chat_id_equals",
  "chat_type_equals",
  "message_source_equals",
  "variable_equals",
  "variable_exists",
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
  "message_has_contact",
  "all",
  "any",
] as const;

export const CORE_COMPOSER_METHODS = new Set([
  "telegram.sendMessage",
  "telegram.sendPhoto",
  "telegram.sendVideo",
  "telegram.sendDocument",
]);
