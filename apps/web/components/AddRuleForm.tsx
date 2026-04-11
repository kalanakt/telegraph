"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Panel,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type IsValidConnection,
  type Node,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  conditionSchema,
  flowDefinitionSchema,
  isActionAllowedForTrigger,
  type ActionPayload,
  type FlowDefinition,
  type TriggerType,
} from "@telegram-builder/shared";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createActionTemplate,
  getActionTypeOptions,
  getCapabilityLabel,
  getTriggerGroups,
  migrateLegacyActionData,
  summarizeAction,
} from "@/lib/flow-builder";

type BotOption = {
  id: string;
  label: string;
};

type RuleOption = {
  id: string;
  botId: string;
  name: string;
  trigger: TriggerType;
  flowDefinition: FlowDefinition;
};

type FlowBuilderProps = {
  bots: BotOption[];
  rules: RuleOption[];
  initialRuleId?: string;
};

type AddKind = "condition" | "action";
type AddBranch = "next" | "true" | "false";

type ConditionEditorData = {
  type?: string;
  value?: string | number;
  key?: string;
  conditionsJson?: string;
};

type InlineKeyboardButton = {
  text: string;
  url?: string;
  callback_data?: string;
};
type ReplyKeyboardButton = { text: string };
type ActionEditorData = {
  type: ActionPayload["type"];
  params: Record<string, unknown>;
};

type NodeCallbacks = {
  onAdd?: (branch: AddBranch, kind: AddKind) => void;
};

const CONDITION_OPTIONS = [
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

const CORE_COMPOSER_METHODS = new Set([
  "telegram.sendMessage",
  "telegram.sendPhoto",
  "telegram.sendDocument",
]);

const NO_PARSE_MODE = "__none__";

const EDGE_STYLE = { stroke: "#4f46e5", strokeWidth: 1.6 };

const defaultEdgeOptions = {
  type: "smoothstep",
  style: EDGE_STYLE,
  markerEnd: { type: MarkerType.ArrowClosed, color: "#4f46e5" },
  animated: false,
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function AddButtons({
  onAdd,
  branch = "next",
}: {
  onAdd?: (branch: AddBranch, kind: AddKind) => void;
  branch?: AddBranch;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        className="nodrag nopan inline-flex h-6 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        onClick={() => onAdd?.(branch, "condition")}
      >
        <Plus className="h-3 w-3" /> Condition
      </button>
      <button
        type="button"
        className="nodrag nopan inline-flex h-6 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        onClick={() => onAdd?.(branch, "action")}
      >
        <Plus className="h-3 w-3" /> Action
      </button>
    </div>
  );
}

function StartNode({ data }: { data: NodeCallbacks }) {
  return (
    <div className="builder-node builder-node-start relative min-w-[180px] rounded-xl px-3 py-2.5 text-xs text-slate-900">
      <div className="text-[10px] uppercase text-slate-500">
        Entry
      </div>
      <div className="font-semibold">Start</div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-white !bg-indigo-500"
      />
      <div className="absolute -right-[188px] top-1/2 -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="next" />
      </div>
    </div>
  );
}

function ConditionNode({
  data,
}: {
  data: ConditionEditorData & NodeCallbacks;
}) {
  return (
    <div className="builder-node builder-node-condition relative min-w-[230px] rounded-xl px-3 py-2.5 text-xs text-amber-950">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-white !bg-amber-500"
      />
      <div className="text-[10px] uppercase text-amber-700/80">
        Condition
      </div>
      <div className="font-semibold">{data.type}</div>
      <div className="truncate text-[11px] text-amber-800/90">
        {String(data.value ?? data.key ?? "Set value in inspector")}
      </div>

      <Handle
        id="true"
        type="source"
        position={Position.Right}
        style={{ top: "37%" }}
        className="!h-2.5 !w-2.5 !border-white !bg-emerald-500"
      />
      <Handle
        id="false"
        type="source"
        position={Position.Right}
        style={{ top: "72%" }}
        className="!h-2.5 !w-2.5 !border-white !bg-rose-500"
      />

      <div className="absolute -right-[188px] top-[35%] -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="true" />
      </div>
      <div className="absolute -right-[188px] top-[70%] -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="false" />
      </div>
    </div>
  );
}

function ActionNode({ data }: { data: ActionEditorData & NodeCallbacks }) {
  const payload = migrateLegacyActionData(data);

  return (
    <div className="builder-node builder-node-action relative min-w-[260px] rounded-xl px-3 py-2.5 text-xs text-sky-950">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-white !bg-sky-500"
      />
      <div className="text-[10px] uppercase text-sky-700/80">
        Action
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold">{getCapabilityLabel(payload.type)}</div>
        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
          {payload.type.replace("telegram.", "")}
        </Badge>
      </div>
      <div className="line-clamp-2 text-[11px] text-sky-900/80">
        {summarizeAction(payload)}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-white !bg-sky-500"
      />
      <div className="absolute -right-[188px] top-1/2 -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="next" />
      </div>
    </div>
  );
}

const nodeTypes = {
  start: StartNode,
  condition: ConditionNode,
  action: ActionNode,
};

function defaultFlowDefinition(): FlowDefinition {
  return {
    nodes: [
      { id: "start_1", type: "start", position: { x: 80, y: 220 }, data: {} },
    ],
    edges: [],
  };
}

function toCanvasNodes(flow: FlowDefinition): Node[] {
  return flow.nodes.map((node) => {
    if (node.type !== "action") {
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
      };
    }

    return {
      id: node.id,
      type: node.type,
      position: node.position,
      data: migrateLegacyActionData(node.data),
    };
  });
}

function toCanvasEdges(flow: FlowDefinition): Edge[] {
  return flow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label:
      edge.sourceHandle === "true" || edge.sourceHandle === "false"
        ? edge.sourceHandle
        : undefined,
    ...defaultEdgeOptions,
  }));
}

function normalizeConditionNodeData(data: Record<string, unknown>) {
  const type = String(data.type ?? "text_contains");
  if (type === "all" || type === "any") {
    let parsedConditions: unknown = [];
    try {
      parsedConditions = JSON.parse(String(data.conditionsJson ?? "[]"));
    } catch {
      parsedConditions = [];
    }

    const safe = Array.isArray(parsedConditions)
      ? parsedConditions
          .map((item) => conditionSchema.safeParse(item))
          .filter((result) => result.success)
          .map((result) => result.data)
      : [];

    return {
      type,
      conditions:
        safe.length > 0 ? safe : [{ type: "text_contains", value: "keyword" }],
    };
  }

  if (type === "variable_equals") {
    return {
      type,
      key: String(data.key ?? "flag"),
      value: String(data.value ?? "true"),
    };
  }

  if (type === "variable_exists") {
    return {
      type,
      key: String(data.key ?? "flag"),
    };
  }

  if (type === "from_user_id") {
    return {
      type,
      value: Number(data.value ?? 0),
    };
  }

  if (type === "message_source_equals") {
    const raw = String(data.value ?? "user");
    const value = raw === "channel" || raw === "group" ? raw : "user";
    return { type, value };
  }

  return {
    type: CONDITION_OPTIONS.includes(type as (typeof CONDITION_OPTIONS)[number])
      ? type
      : "text_contains",
    value: String(data.value ?? ""),
  };
}

function normalizeActionNodeData(data: unknown): ActionEditorData {
  const normalized = migrateLegacyActionData(data);
  return {
    type: normalized.type,
    params: normalized.params as Record<string, unknown>,
  };
}

function toFlowDefinition(nodes: Node[], edges: Edge[]): FlowDefinition {
  const flowNodes = nodes.map((node) => {
    if (node.type === "start") {
      return {
        id: node.id,
        type: "start",
        position: node.position,
        data: {},
      };
    }

    if (node.type === "condition") {
      return {
        id: node.id,
        type: "condition",
        position: node.position,
        data: normalizeConditionNodeData(node.data as Record<string, unknown>),
      };
    }

    return {
      id: node.id,
      type: "action",
      position: node.position,
      data: normalizeActionNodeData(node.data) as ActionPayload,
    };
  });

  return {
    nodes: flowNodes as FlowDefinition["nodes"],
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
    })),
  };
}

function makeEdgeId(connection: Connection) {
  return `${connection.source}_${connection.sourceHandle ?? "default"}_${connection.target}_${connection.targetHandle ?? "default"}_${Date.now()}`;
}

function defaultConditionData() {
  return { type: "text_contains", value: "keyword" };
}

function canCreateConnection(
  connection: Connection | Edge,
  nodes: Node[],
  edges: Edge[],
) {
  if (!connection.source || !connection.target) {
    return false;
  }

  if (connection.source === connection.target) {
    return false;
  }

  const duplicate = edges.some(
    (edge) =>
      edge.source === connection.source &&
      edge.target === connection.target &&
      (edge.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
      (edge.targetHandle ?? null) === (connection.targetHandle ?? null),
  );

  if (duplicate) {
    return false;
  }

  const sourceNode = nodes.find((node) => node.id === connection.source);
  if (
    sourceNode?.type === "condition" &&
    (connection.sourceHandle === "true" || connection.sourceHandle === "false")
  ) {
    const existingBranch = edges.some(
      (edge) =>
        edge.source === connection.source &&
        edge.sourceHandle === connection.sourceHandle,
    );
    if (existingBranch) {
      return false;
    }
  }

  return true;
}

function isCoreComposerAction(action: ActionEditorData) {
  return CORE_COMPOSER_METHODS.has(action.type);
}

function getInlineKeyboard(
  params: Record<string, unknown>,
): InlineKeyboardButton[][] {
  const replyMarkup = params.reply_markup;
  if (!replyMarkup || typeof replyMarkup !== "object") {
    return [];
  }

  const inlineKeyboard = (replyMarkup as { inline_keyboard?: unknown })
    .inline_keyboard;
  if (!Array.isArray(inlineKeyboard)) {
    return [];
  }

  const rows: InlineKeyboardButton[][] = [];
  for (const row of inlineKeyboard) {
    if (!Array.isArray(row)) {
      continue;
    }

    const buttons: InlineKeyboardButton[] = [];
    for (const button of row) {
      if (!button || typeof button !== "object") {
        continue;
      }

      const b = button as {
        text?: unknown;
        url?: unknown;
        callback_data?: unknown;
      };
      const text = asString(b.text);
      if (!text) {
        continue;
      }

      buttons.push({
        text,
        url: asString(b.url) || undefined,
        callback_data: asString(b.callback_data) || undefined,
      });
    }

    if (buttons.length > 0) {
      rows.push(buttons);
    }
  }

  return rows;
}

function getReplyKeyboard(
  params: Record<string, unknown>,
): ReplyKeyboardButton[][] {
  const replyMarkup = params.reply_markup;
  if (!replyMarkup || typeof replyMarkup !== "object") {
    return [];
  }

  const keyboard = (replyMarkup as { keyboard?: unknown }).keyboard;
  if (!Array.isArray(keyboard)) {
    return [];
  }

  const rows: ReplyKeyboardButton[][] = [];
  for (const row of keyboard) {
    if (!Array.isArray(row)) {
      continue;
    }

    const buttons: ReplyKeyboardButton[] = [];
    for (const button of row) {
      if (!button || typeof button !== "object") {
        continue;
      }

      const b = button as { text?: unknown };
      const text = asString(b.text);
      if (text) {
        buttons.push({ text });
      }
    }

    if (buttons.length > 0) {
      rows.push(buttons);
    }
  }

  return rows;
}

function getReplyMarkupKind(
  params: Record<string, unknown>,
): "none" | "inline" | "reply" {
  const replyMarkup = params.reply_markup;
  if (!replyMarkup || typeof replyMarkup !== "object") {
    return "none";
  }

  if (
    Array.isArray(
      (replyMarkup as { inline_keyboard?: unknown }).inline_keyboard,
    )
  ) {
    return "inline";
  }

  if (Array.isArray((replyMarkup as { keyboard?: unknown }).keyboard)) {
    return "reply";
  }

  return "none";
}

function updateInlineKeyboard(
  rows: InlineKeyboardButton[][],
  rowIndex: number,
  buttonIndex: number,
  partial: Partial<InlineKeyboardButton>,
): InlineKeyboardButton[][] {
  return rows.map((row, rIndex) => {
    if (rIndex !== rowIndex) {
      return row;
    }

    return row.map((button, bIndex) => {
      if (bIndex !== buttonIndex) {
        return button;
      }

      return {
        ...button,
        ...partial,
      };
    });
  });
}

function updateReplyKeyboard(
  rows: ReplyKeyboardButton[][],
  rowIndex: number,
  buttonIndex: number,
  partial: Partial<ReplyKeyboardButton>,
): ReplyKeyboardButton[][] {
  return rows.map((row, rIndex) => {
    if (rIndex !== rowIndex) {
      return row;
    }

    return row.map((button, bIndex) => {
      if (bIndex !== buttonIndex) {
        return button;
      }

      return {
        ...button,
        ...partial,
      };
    });
  });
}

export function AddRuleForm({ bots, rules, initialRuleId }: FlowBuilderProps) {
  const [botId, setBotId] = useState(bots[0]?.id ?? "");
  const [name, setName] = useState("Builder");
  const [trigger, setTrigger] = useState<TriggerType>("message_received");
  const [selectedRuleId, setSelectedRuleId] = useState<string>(
    initialRuleId ?? "new",
  );
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const initialFlow = useMemo(() => defaultFlowDefinition(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    toCanvasNodes(initialFlow),
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    toCanvasEdges(initialFlow),
  );

  const triggerGroups = useMemo(() => getTriggerGroups(), []);
  const actionTypeOptions = useMemo(() => getActionTypeOptions(), []);

  useEffect(() => {
    const existing = rules.find((rule) => rule.id === selectedRuleId);
    if (!existing) {
      const builder = defaultFlowDefinition();
      setBotId(bots[0]?.id ?? "");
      setName("Builder");
      setTrigger("message_received");
      setNodes(toCanvasNodes(builder));
      setEdges(toCanvasEdges(builder));
      setSelectedNodeId(null);
      return;
    }

    setBotId(existing.botId);
    setName(existing.name);
    setTrigger(existing.trigger);
    setNodes(toCanvasNodes(existing.flowDefinition));
    setEdges(toCanvasEdges(existing.flowDefinition));
    setSelectedNodeId(null);
  }, [bots, rules, selectedRuleId, setEdges, setNodes]);

  const selectedNode = selectedNodeId
    ? nodes.find((node) => node.id === selectedNodeId)
    : undefined;
  const selectedConditionData =
    (selectedNode?.type === "condition"
      ? (selectedNode.data as ConditionEditorData)
      : {}) ?? {};
  const selectedConditionType = String(
    selectedConditionData.type ?? "text_contains",
  );

  const selectedAction = useMemo(
    () =>
      selectedNode?.type === "action"
        ? normalizeActionNodeData(selectedNode.data)
        : null,
    [selectedNode],
  );

  const selectedActionParams = (selectedAction?.params ?? {}) as Record<
    string,
    unknown
  >;

  const isActionCompatible = selectedAction
    ? isActionAllowedForTrigger(
        selectedAction.type as ActionPayload["type"],
        trigger,
      )
    : true;

  const addFromNode = useCallback(
    (parentId: string, branch: AddBranch, kind: AddKind) => {
      const parent = nodes.find((node) => node.id === parentId);
      if (!parent) {
        return;
      }

      const idPrefix = kind === "condition" ? "condition" : "action";
      const newId = `${idPrefix}_${Date.now()}`;
      const parentX = parent.position.x;
      const parentY = parent.position.y;
      const branchOffset =
        branch === "true" ? -100 : branch === "false" ? 100 : 0;

      const newNode: Node = {
        id: newId,
        type: kind,
        position: { x: parentX + 320, y: parentY + branchOffset },
        data:
          kind === "condition"
            ? defaultConditionData()
            : createActionTemplate("telegram.sendMessage"),
      };

      const newEdge: Edge = {
        id: `${parentId}_${branch}_${newId}_${Date.now()}`,
        source: parentId,
        target: newId,
        sourceHandle:
          parent.type === "condition" &&
          (branch === "true" || branch === "false")
            ? branch
            : undefined,
        label:
          parent.type === "condition" &&
          (branch === "true" || branch === "false")
            ? branch
            : undefined,
        ...defaultEdgeOptions,
      };

      setNodes((curr) => [...curr, newNode]);
      setEdges((curr) => [...curr, newEdge]);
      setSelectedNodeId(newId);
    },
    [nodes, setEdges, setNodes],
  );

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...(node.data as Record<string, unknown>),
          onAdd: (branch: AddBranch, kind: AddKind) =>
            addFromNode(node.id, branch, kind),
        },
      })),
    [addFromNode, nodes],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => canCreateConnection(connection, nodes, edges),
    [edges, nodes],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!canCreateConnection(connection, nodes, edges)) {
        setStatus(
          "Connection blocked: branch already used, duplicate edge, or invalid target.",
        );
        return;
      }

      const edge: Edge = {
        id: makeEdgeId(connection),
        source: connection.source ?? "",
        target: connection.target ?? "",
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        label:
          connection.sourceHandle === "true" ||
          connection.sourceHandle === "false"
            ? connection.sourceHandle
            : undefined,
        ...defaultEdgeOptions,
      };

      setStatus("");
      setEdges((current) => addEdge(edge, current));
    },
    [edges, nodes, setEdges],
  );

  const updateSelectedNodeData = useCallback(
    (partial: Record<string, unknown>) => {
      if (!selectedNodeId) {
        return;
      }

      setNodes((current) =>
        current.map((node) => {
          if (node.id !== selectedNodeId) {
            return node;
          }

          return {
            ...node,
            data: {
              ...(node.data as Record<string, unknown>),
              ...partial,
            },
          };
        }),
      );
    },
    [selectedNodeId, setNodes],
  );

  const replaceSelectedAction = useCallback(
    (nextAction: ActionEditorData) => {
      if (!selectedNodeId) {
        return;
      }

      setNodes((current) =>
        current.map((node) => {
          if (node.id !== selectedNodeId || node.type !== "action") {
            return node;
          }

          return {
            ...node,
            data: nextAction,
          };
        }),
      );
    },
    [selectedNodeId, setNodes],
  );

  const updateSelectedActionParams = useCallback(
    (partial: Record<string, unknown>) => {
      if (!selectedAction) {
        return;
      }

      replaceSelectedAction({
        ...selectedAction,
        params: {
          ...selectedAction.params,
          ...partial,
        },
      });
    },
    [replaceSelectedAction, selectedAction],
  );

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNodeId) {
      return;
    }

    setNodes((current) => current.filter((node) => node.id !== selectedNodeId));
    setEdges((current) =>
      current.filter(
        (edge) =>
          edge.source !== selectedNodeId && edge.target !== selectedNodeId,
      ),
    );
    setSelectedNodeId(null);
    setStatus("Node removed.");
  }, [selectedNodeId, setEdges, setNodes]);

  async function saveFlow() {
    setIsSaving(true);
    setStatus("Validating builder...");

    const flowDefinition = toFlowDefinition(nodes, edges);
    const parsed = flowDefinitionSchema.safeParse(flowDefinition);
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? "Builder graph is invalid.");
      setIsSaving(false);
      return;
    }

    const body: Record<string, unknown> = {
      botId,
      name,
      trigger,
      flowDefinition: parsed.data,
    };

    const isUpdating = selectedRuleId !== "new";
    if (isUpdating) {
      body.ruleId = selectedRuleId;
    }

    setStatus(isUpdating ? "Updating builder..." : "Creating builder...");

    const res = await fetch("/api/builder", {
      method: isUpdating ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });

    const json = await res.json();
    if (!res.ok) {
      const issueMessage =
        Array.isArray(json.issues) && json.issues.length > 0
          ? `${json.issues[0]?.path || "builder"}: ${json.issues[0]?.message || "invalid"}`
          : null;
      setStatus(issueMessage ?? json.error ?? "Could not save builder.");
      setIsSaving(false);
      return;
    }

    setStatus(isUpdating ? "Builder updated." : "Builder created.");
    setIsSaving(false);

    const nextId = (json.rule?.id as string | undefined) ?? selectedRuleId;
    window.location.href = `/builder?edit=${nextId}`;
  }

  const inlineKeyboard = getInlineKeyboard(selectedActionParams);
  const replyKeyboard = getReplyKeyboard(selectedActionParams);
  const replyMarkupKind = getReplyMarkupKind(selectedActionParams);

  const categoryMap = useMemo(() => {
    const map = new Map<string, typeof actionTypeOptions>();
    for (const item of actionTypeOptions) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }

    return map;
  }, [actionTypeOptions]);

  if (bots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create Builder</CardTitle>
          <CardDescription>
            Add a Telegram bot first to enable builder creation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="surface-panel">
      <CardHeader>
        <CardTitle className="text-xl">Builder Studio</CardTitle>
        <CardDescription>
          Choose trigger, add conditions/actions from node controls, then
          configure the selected node in the inspector.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="builder-label">
            <span>Builder</span>
            <Select
              value={selectedRuleId}
              onValueChange={setSelectedRuleId}
            >
              <SelectTrigger className="builder-field builder-field-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New builder</SelectItem>
                {rules.map((rule) => (
                  <SelectItem key={rule.id} value={rule.id}>
                    {rule.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="builder-label">
            <span>Bot</span>
            <Select
              value={botId}
              onValueChange={setBotId}
            >
              <SelectTrigger className="builder-field builder-field-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bots.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>
                    {bot.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="builder-label">
            <span>Trigger</span>
            <Select
              value={trigger}
              onValueChange={(value) => setTrigger(value as TriggerType)}
            >
              <SelectTrigger className="builder-field builder-field-soft">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {triggerGroups.map((group) => (
                  <SelectGroup key={group.id}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.triggers.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="builder-label">
            <span>Builder name</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border/80 bg-background/70 p-2">
          <Button type="button" onClick={saveFlow} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : selectedRuleId === "new"
                ? "Create Builder"
                : "Update Builder"}
          </Button>
          <Badge variant="secondary">
            Pick a node to edit it in the inspector
          </Badge>
          <Badge variant="outline">Nodes: {nodes.length}</Badge>
          <Badge variant="outline">Edges: {edges.length}</Badge>
          {status ? <Badge variant="outline">{status}</Badge> : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
          <div className="builder-canvas h-[720px] overflow-hidden rounded-2xl border border-slate-200/90">
            <ReactFlow
              className="builder-flow"
              nodes={displayNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              connectionMode={ConnectionMode.Loose}
              isValidConnection={isValidConnection}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={({ nodes: selected }) =>
                setSelectedNodeId(selected[0]?.id ?? null)
              }
              snapToGrid
              snapGrid={[20, 20]}
              fitView
              fitViewOptions={{ padding: 0.16, includeHiddenNodes: false }}
              proOptions={{ hideAttribution: true }}
            >
              <Panel
                position="top-left"
                className="rounded-sm border border-border/80 bg-background/70 px-2.5 py-1.5 text-xs text-foreground/80"
              >
                Trigger: {trigger}
              </Panel>
              <MiniMap
                pannable
                zoomable
                className="!rounded-sm !border !border-border/80 !bg-background/70"
                nodeBorderRadius={12}
                maskColor="rgba(15, 23, 42, 0.08)"
              />
              <Controls showInteractive={false} position="bottom-left" />
              <Background
                variant={BackgroundVariant.Dots}
                gap={18}
                size={1.1}
                color="#cdd5e6"
              />
            </ReactFlow>
          </div>

          <div className="builder-inspector space-y-3 xl:sticky xl:top-6 xl:h-fit">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800">
                Inspector
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={deleteSelectedNode}
                disabled={!selectedNode || selectedNode.type === "start"}
              >
                <Trash2 className="h-4 w-4" />
                Delete node
              </Button>
            </div>

            {!selectedNode ? (
              <p className="text-sm text-slate-500">
                Select a node to edit its settings.
              </p>
            ) : null}

            {selectedNode?.type === "start" ? (
              <p className="text-sm text-slate-500">
                Start node only forwards to the next step.
              </p>
            ) : null}

            {selectedNode?.type === "condition" ? (
              <>
                <div className="builder-section">
                  <p className="builder-kicker">Trigger context</p>
                  <p className="text-xs text-slate-600">
                    Current flow trigger is{" "}
                    <span className="font-semibold">{trigger}</span>. Keep
                    condition values compatible with this event shape.
                  </p>
                </div>

                <div className="builder-label">
                  <span>Condition type</span>
                  <Select
                    value={selectedConditionType}
                    onValueChange={(value) =>
                      updateSelectedNodeData({ type: value })
                    }
                  >
                    <SelectTrigger className="builder-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedConditionType === "all" ||
                selectedConditionType === "any" ? (
                  <label className="builder-label">
                    <span>Nested conditions JSON array</span>
                    <Textarea
                      rows={5}
                      value={String(
                        selectedConditionData.conditionsJson ?? "[]",
                      )}
                      onChange={(e) =>
                        updateSelectedNodeData({
                          conditionsJson: e.target.value,
                        })
                      }
                    />
                  </label>
                ) : selectedConditionType.startsWith("message_has_") ? (
                  <div className="builder-section">
                    <p className="builder-kicker">Condition value</p>
                    <p className="text-xs text-slate-600">This condition does not require a value.</p>
                  </div>
                ) : (
                  <div className="builder-label">
                    <span>
                      {selectedConditionType === "variable_equals" ||
                      selectedConditionType === "variable_exists"
                        ? "Key"
                        : "Value"}
                    </span>
                    {selectedConditionType === "message_source_equals" ? (
                      <Select
                        value={String(selectedConditionData.value ?? "user")}
                        onValueChange={(value) =>
                          updateSelectedNodeData({ value })
                        }
                      >
                        <SelectTrigger className="builder-field">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">user</SelectItem>
                          <SelectItem value="group">group</SelectItem>
                          <SelectItem value="channel">channel</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={String(
                          selectedConditionData.value ??
                            selectedConditionData.key ??
                            "",
                        )}
                        onChange={(e) => {
                          if (
                            selectedConditionType === "variable_equals" ||
                            selectedConditionType === "variable_exists"
                          ) {
                            updateSelectedNodeData({ key: e.target.value });
                            return;
                          }

                          const val =
                            selectedConditionType === "from_user_id" ||
                            selectedConditionType === "target_user_id_equals"
                              ? Number(e.target.value || 0)
                              : e.target.value;
                          updateSelectedNodeData({ value: val });
                        }}
                      />
                    )}
                  </div>
                )}

                {selectedConditionType === "variable_equals" ? (
                  <label className="builder-label">
                    <span>Equals</span>
                    <Input
                      value={String(selectedConditionData.value ?? "")}
                      onChange={(e) =>
                        updateSelectedNodeData({ value: e.target.value })
                      }
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            {selectedNode?.type === "action" && selectedAction ? (
              <>
                <div className="builder-section">
                  <p className="builder-kicker">Trigger context</p>
                  <p className="text-xs text-slate-600">
                    Selected trigger:{" "}
                    <span className="font-semibold">{trigger}</span>
                  </p>
                  {!isActionCompatible ? (
                    <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-300/80 bg-amber-50 px-2 py-1.5 text-amber-900">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                      <p className="text-xs">
                        This action is not compatible with the current trigger.
                        Update trigger or action before saving.
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="builder-label">
                  <span>Action type</span>
                  <Select
                    value={selectedAction.type}
                    onValueChange={(value) => {
                      replaceSelectedAction(
                        normalizeActionNodeData(
                          createActionTemplate(
                            value as ActionPayload["type"],
                          ),
                        ),
                      );
                    }}
                  >
                    <SelectTrigger className="builder-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from(categoryMap.entries()).map(
                        ([category, items]) => (
                          <SelectGroup key={category}>
                            <SelectLabel>{category}</SelectLabel>
                            {items.map((item) => (
                              <SelectItem
                                key={item.actionType}
                                value={item.actionType}
                              >
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {isCoreComposerAction(selectedAction) ? (
                  <>
                    <div className="builder-section">
                      <p className="builder-kicker">Content</p>
                      <label className="builder-label">
                        <span>Chat ID</span>
                        <Input
                          value={asString(selectedActionParams.chat_id)}
                          onChange={(e) =>
                            updateSelectedActionParams({
                              chat_id: e.target.value,
                            })
                          }
                        />
                      </label>

                      {selectedAction.type === "telegram.sendMessage" ? (
                        <label className="builder-label mt-2">
                          <span>Text</span>
                          <Textarea
                            rows={4}
                            value={asString(selectedActionParams.text)}
                            onChange={(e) =>
                              updateSelectedActionParams({
                                text: e.target.value,
                              })
                            }
                          />
                        </label>
                      ) : null}

                      {selectedAction.type === "telegram.sendPhoto" ? (
                        <>
                          <label className="builder-label mt-2">
                            <span>Photo URL/File ID</span>
                            <Input
                              value={asString(selectedActionParams.photo)}
                              onChange={(e) =>
                                updateSelectedActionParams({
                                  photo: e.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="builder-label mt-2">
                            <span>Caption</span>
                            <Textarea
                              rows={3}
                              value={asString(selectedActionParams.caption)}
                              onChange={(e) =>
                                updateSelectedActionParams({
                                  caption: e.target.value,
                                })
                              }
                            />
                          </label>
                        </>
                      ) : null}

                      {selectedAction.type === "telegram.sendDocument" ? (
                        <>
                          <label className="builder-label mt-2">
                            <span>Document URL/File ID</span>
                            <Input
                              value={asString(selectedActionParams.document)}
                              onChange={(e) =>
                                updateSelectedActionParams({
                                  document: e.target.value,
                                })
                              }
                            />
                          </label>
                          <label className="builder-label mt-2">
                            <span>Caption</span>
                            <Textarea
                              rows={3}
                              value={asString(selectedActionParams.caption)}
                              onChange={(e) =>
                                updateSelectedActionParams({
                                  caption: e.target.value,
                                })
                              }
                            />
                          </label>
                        </>
                      ) : null}

                      <div className="builder-label mt-2">
                        <span>Parse mode</span>
                        <Select
                          value={
                            asString(selectedActionParams.parse_mode) ||
                            NO_PARSE_MODE
                          }
                          onValueChange={(value) => {
                            if (value === NO_PARSE_MODE) {
                              const { parse_mode: _omit, ...rest } =
                                selectedActionParams;
                              replaceSelectedAction({
                                ...selectedAction,
                                params: rest,
                              });
                              return;
                            }
                            updateSelectedActionParams({
                              parse_mode: value,
                            });
                          }}
                        >
                          <SelectTrigger className="builder-field">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NO_PARSE_MODE}>None</SelectItem>
                            <SelectItem value="Markdown">Markdown</SelectItem>
                            <SelectItem value="MarkdownV2">
                              MarkdownV2
                            </SelectItem>
                            <SelectItem value="HTML">HTML</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="builder-section">
                      <p className="builder-kicker">Buttons</p>
                      <div className="builder-label">
                        <span>Keyboard type</span>
                        <Select
                          value={replyMarkupKind}
                          onValueChange={(value) => {
                            const kind = value as
                              | "none"
                              | "inline"
                              | "reply";
                            if (kind === "none") {
                              const { reply_markup: _omit, ...rest } =
                                selectedActionParams;
                              replaceSelectedAction({
                                ...selectedAction,
                                params: rest,
                              });
                              return;
                            }

                            if (kind === "inline") {
                              updateSelectedActionParams({
                                reply_markup: {
                                  inline_keyboard: [
                                    [
                                      {
                                        text: "Button",
                                        callback_data: "action",
                                      },
                                    ],
                                  ],
                                },
                              });
                              return;
                            }

                            updateSelectedActionParams({
                              reply_markup: {
                                keyboard: [[{ text: "Button" }]],
                                resize_keyboard: true,
                              },
                            });
                          }}
                        >
                          <SelectTrigger className="builder-field">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="inline">
                              Inline keyboard
                            </SelectItem>
                            <SelectItem value="reply">
                              Reply keyboard
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {replyMarkupKind === "inline" ? (
                        <div className="mt-3 space-y-2">
                          {inlineKeyboard.map((row, rowIndex) => (
                            <div
                              key={`inline-row-${rowIndex}`}
                              className="space-y-2 rounded-md border border-slate-200 p-2"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-slate-600">
                                  Row {rowIndex + 1}
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const nextRows = inlineKeyboard.filter(
                                      (_, index) => index !== rowIndex,
                                    );
                                    updateSelectedActionParams({
                                      reply_markup: {
                                        inline_keyboard:
                                          nextRows.length > 0
                                            ? nextRows
                                            : [
                                                [
                                                  {
                                                    text: "Button",
                                                    callback_data: "action",
                                                  },
                                                ],
                                              ],
                                      },
                                    });
                                  }}
                                >
                                  Remove row
                                </Button>
                              </div>

                              {row.map((button, buttonIndex) => (
                                <div
                                  key={`inline-btn-${rowIndex}-${buttonIndex}`}
                                  className="grid gap-2 md:grid-cols-3"
                                >
                                  <Input
                                    value={button.text}
                                    onChange={(e) => {
                                      const nextRows = updateInlineKeyboard(
                                        inlineKeyboard,
                                        rowIndex,
                                        buttonIndex,
                                        { text: e.target.value },
                                      );
                                      updateSelectedActionParams({
                                        reply_markup: {
                                          inline_keyboard: nextRows,
                                        },
                                      });
                                    }}
                                    placeholder="Button text"
                                  />
                                  <Select
                                    value={button.url ? "url" : "callback_data"}
                                    onValueChange={(mode) => {
                                      const nextRows = updateInlineKeyboard(
                                        inlineKeyboard,
                                        rowIndex,
                                        buttonIndex,
                                        mode === "url"
                                          ? {
                                              url: "https://",
                                              callback_data: undefined,
                                            }
                                          : {
                                              callback_data: "action",
                                              url: undefined,
                                            },
                                      );
                                      updateSelectedActionParams({
                                        reply_markup: {
                                          inline_keyboard: nextRows,
                                        },
                                      });
                                    }}
                                  >
                                    <SelectTrigger className="builder-field">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="callback_data">
                                        callback_data
                                      </SelectItem>
                                      <SelectItem value="url">url</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Input
                                    value={
                                      button.url ?? button.callback_data ?? ""
                                    }
                                    onChange={(e) => {
                                      const nextRows = updateInlineKeyboard(
                                        inlineKeyboard,
                                        rowIndex,
                                        buttonIndex,
                                        button.url
                                          ? { url: e.target.value }
                                          : { callback_data: e.target.value },
                                      );
                                      updateSelectedActionParams({
                                        reply_markup: {
                                          inline_keyboard: nextRows,
                                        },
                                      });
                                    }}
                                    placeholder={
                                      button.url
                                        ? "https://example.com"
                                        : "action_id"
                                    }
                                  />
                                </div>
                              ))}

                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  const nextRows = inlineKeyboard.map(
                                    (currentRow, index) =>
                                      index === rowIndex
                                        ? [
                                            ...currentRow,
                                            {
                                              text: "Button",
                                              callback_data: "action",
                                            },
                                          ]
                                        : currentRow,
                                  );
                                  updateSelectedActionParams({
                                    reply_markup: { inline_keyboard: nextRows },
                                  });
                                }}
                              >
                                Add button
                              </Button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              updateSelectedActionParams({
                                reply_markup: {
                                  inline_keyboard: [
                                    ...inlineKeyboard,
                                    [
                                      {
                                        text: "Button",
                                        callback_data: "action",
                                      },
                                    ],
                                  ],
                                },
                              });
                            }}
                          >
                            Add row
                          </Button>
                        </div>
                      ) : null}

                      {replyMarkupKind === "reply" ? (
                        <div className="mt-3 space-y-2">
                          {replyKeyboard.map((row, rowIndex) => (
                            <div
                              key={`reply-row-${rowIndex}`}
                              className="space-y-2 rounded-md border border-slate-200 p-2"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-medium text-slate-600">
                                  Row {rowIndex + 1}
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const nextRows = replyKeyboard.filter(
                                      (_, index) => index !== rowIndex,
                                    );
                                    updateSelectedActionParams({
                                      reply_markup: {
                                        keyboard:
                                          nextRows.length > 0
                                            ? nextRows
                                            : [[{ text: "Button" }]],
                                        resize_keyboard: true,
                                      },
                                    });
                                  }}
                                >
                                  Remove row
                                </Button>
                              </div>

                              {row.map((button, buttonIndex) => (
                                <Input
                                  key={`reply-btn-${rowIndex}-${buttonIndex}`}
                                  value={button.text}
                                  onChange={(e) => {
                                    const nextRows = updateReplyKeyboard(
                                      replyKeyboard,
                                      rowIndex,
                                      buttonIndex,
                                      { text: e.target.value },
                                    );
                                    updateSelectedActionParams({
                                      reply_markup: {
                                        keyboard: nextRows,
                                        resize_keyboard: true,
                                      },
                                    });
                                  }}
                                  placeholder="Reply button text"
                                />
                              ))}

                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  const nextRows = replyKeyboard.map(
                                    (currentRow, index) =>
                                      index === rowIndex
                                        ? [...currentRow, { text: "Button" }]
                                        : currentRow,
                                  );
                                  updateSelectedActionParams({
                                    reply_markup: {
                                      keyboard: nextRows,
                                      resize_keyboard: true,
                                    },
                                  });
                                }}
                              >
                                Add button
                              </Button>
                            </div>
                          ))}

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              updateSelectedActionParams({
                                reply_markup: {
                                  keyboard: [
                                    ...replyKeyboard,
                                    [{ text: "Button" }],
                                  ],
                                  resize_keyboard: true,
                                },
                              });
                            }}
                          >
                            Add row
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    <div className="builder-section">
                      <p className="builder-kicker">Advanced params</p>
                      <label className="builder-label">
                        <span>Raw params JSON (optional fine-tuning)</span>
                        <Textarea
                          rows={5}
                          value={JSON.stringify(selectedAction.params, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(
                                e.target.value,
                              ) as Record<string, unknown>;
                              replaceSelectedAction({
                                ...selectedAction,
                                params: parsed,
                              });
                              setStatus("");
                            } catch {
                              setStatus("Invalid JSON in Advanced params.");
                            }
                          }}
                        />
                      </label>
                    </div>
                  </>
                ) : (
                  <div className="builder-section">
                    <p className="builder-kicker">Advanced params</p>
                    <p className="mb-2 text-xs text-slate-600">
                      This method uses JSON editor mode in v1. Core rich
                      composer is available for
                      sendMessage/sendPhoto/sendDocument.
                    </p>
                    <Textarea
                      rows={10}
                      value={JSON.stringify(selectedAction.params, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value) as Record<
                            string,
                            unknown
                          >;
                          replaceSelectedAction({
                            ...selectedAction,
                            params: parsed,
                          });
                          setStatus("");
                        } catch {
                          setStatus("Invalid JSON params.");
                        }
                      }}
                    />
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
