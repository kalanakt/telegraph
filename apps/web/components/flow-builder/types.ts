import type {
  ActionPayload,
  FlowAwaitCallbackNodeData,
  FlowAwaitMessageNodeData,
  FlowCollectContactNodeData,
  FlowCollectShippingNodeData,
  FlowCreateInvoiceNodeData,
  FlowDelayNodeData,
  FlowFormStepNodeData,
  FlowNodeMeta,
  FlowOrderTransitionNodeData,
  FlowSetVariableNodeData,
  FlowSwitchNodeData,
  FlowUpsertCustomerNodeData,
  FlowUpsertOrderNodeData,
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

export type FlowNodeKind =
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
    }
  | {
      mode: "node";
      sourceNodeId: string;
      sourceHandle?: string;
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
  onQuickAdd?: (nodeId: string, sourceHandle: string | undefined, anchor: { x: number; y: number }) => void;
  onDeleteNode?: (nodeId: string) => void;
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
  onDeleteEdge?: (edgeId: string) => void;
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

export type AwaitMessageEditorData = FlowAwaitMessageNodeData & {
  __meta?: BuilderNodeMeta;
};

export type AwaitCallbackEditorData = FlowAwaitCallbackNodeData & {
  __meta?: BuilderNodeMeta;
};

export type CollectContactEditorData = FlowCollectContactNodeData & {
  __meta?: BuilderNodeMeta;
};

export type CollectShippingEditorData = FlowCollectShippingNodeData & {
  __meta?: BuilderNodeMeta;
};

export type FormStepEditorData = FlowFormStepNodeData & {
  __meta?: BuilderNodeMeta;
};

export type UpsertCustomerEditorData = FlowUpsertCustomerNodeData & {
  __meta?: BuilderNodeMeta;
};

export type UpsertOrderEditorData = FlowUpsertOrderNodeData & {
  __meta?: BuilderNodeMeta;
};

export type CreateInvoiceEditorData = FlowCreateInvoiceNodeData & {
  __meta?: BuilderNodeMeta;
};

export type OrderTransitionEditorData = FlowOrderTransitionNodeData & {
  __meta?: BuilderNodeMeta;
};

export const CORE_COMPOSER_METHODS = new Set([
  "telegram.sendMessage",
  "telegram.sendPhoto",
  "telegram.sendVideo",
  "telegram.sendDocument",
]);
