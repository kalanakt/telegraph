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

export type NodeCallbacks = {
  onTriggerChange?: (trigger: TriggerType) => void;
};

export const CONDITION_OPTIONS = [
  "text_contains",
  "text_equals",
  "from_user_id",
  "from_username_equals",
  "chat_id_equals",
  "chat_type_equals",
  "message_source_equals",
  "variable_equals",
  "variable_exists",
  "callback_data_equals",
  "all",
  "any",
] as const;

export const CORE_COMPOSER_METHODS = new Set([
  "telegram.sendMessage",
  "telegram.sendPhoto",
  "telegram.sendDocument",
]);
