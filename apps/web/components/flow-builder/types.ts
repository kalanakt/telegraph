import type {
  ActionPayload,
  FlowDelayNodeData,
  FlowNodeMeta,
  FlowSetVariableNodeData,
  FlowSwitchNodeData,
  TriggerType,
} from "@telegram-builder/shared";
import type { Edge, Node } from "@xyflow/react";

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
  webhookEndpoint?: {
    endpointId: string;
    signatureHeaderName?: string | null;
    enabled: boolean;
  } | null;
};

export type FlowBuilderProps = {
  bots: BotOption[];
  rules: RuleOption[];
  initialRuleId?: string;
};

export type FlowNodeKind = "start" | "condition" | "action" | "switch" | "set_variable" | "delay";

export type BuilderNodeMeta = FlowNodeMeta & {
  __meta?: never;
};

export type ConditionEditorData = {
  type?: string;
  value?: string | number;
  key?: string;
  conditionsJson?: string;
  __meta?: BuilderNodeMeta;
};

export type InlineKeyboardButton = {
  text: string;
  url?: string;
  callback_data?: string;
};

export type ReplyKeyboardButton = { text: string };

export type QuickAddContext =
  {
      mode: "edge";
      edgeId: string;
      sourceNodeId: string;
      sourceHandle?: string;
      targetNodeId: string;
      anchor: { x: number; y: number };
    };

export type LinkedCallbackFlow = {
  token: string;
  buttonLabel: string;
  ruleId: string;
  ruleName: string;
};

export type BuilderRuntimeData = {
  onTriggerSelect?: (trigger: TriggerType) => void;
  onCreateCallbackFlow?: (nodeId: string, rowIndex: number, buttonIndex: number) => void;
  onLinkCallbackFlow?: (nodeId: string, rowIndex: number, buttonIndex: number) => void;
  linkedCallbackFlows?: LinkedCallbackFlow[];
};

export type BuilderNodeCatalogItem = {
  id: string;
  kind: FlowNodeKind;
  title: string;
  description: string;
  group: string;
  icon: string;
  actionType?: ActionPayload["type"];
  trigger?: TriggerType;
  disabled?: boolean;
  disabledReason?: string;
};

export type BuilderNodeCatalogSection = {
  id: string;
  title: string;
  items: BuilderNodeCatalogItem[];
};

export type DecoratedBuilderNode = Node<
  Record<string, unknown> & {
    __meta?: BuilderNodeMeta;
    __runtime?: BuilderRuntimeData;
  }
>;

export type DecoratedBuilderEdge = Edge<{
  onInsertNode?: (edgeId: string, anchor: { x: number; y: number }) => void;
}>;

export type ActionEditorData = {
  type: ActionPayload["type"];
  params: Record<string, unknown>;
  __meta?: BuilderNodeMeta;
};

export type SwitchEditorCase = {
  id: string;
  value: string;
  label?: string;
};

export type SwitchEditorData = FlowSwitchNodeData & {
  __meta?: BuilderNodeMeta;
};

export type SetVariableEditorData = FlowSetVariableNodeData & {
  __meta?: BuilderNodeMeta;
};

export type DelayEditorData = FlowDelayNodeData & {
  __meta?: BuilderNodeMeta;
};

export const CORE_COMPOSER_METHODS = new Set([
  "telegram.sendMessage",
  "telegram.sendPhoto",
  "telegram.sendVideo",
  "telegram.sendDocument",
]);
