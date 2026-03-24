"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type Node,
  useEdgesState,
  useNodesState
} from "reactflow";
import "reactflow/dist/style.css";
import {
  conditionSchema,
  flowDefinitionSchema,
  type FlowDefinition,
  type TriggerType
} from "@telegram-builder/shared";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

type NodeActionData = {
  type?: string;
  text?: string;
  chatId?: string;
  photoUrl?: string;
  documentUrl?: string;
  caption?: string;
  callbackQueryId?: string;
  messageId?: number;
  userId?: number;
  key?: string;
  value?: string;
  equals?: string;
  delayMs?: number;
  conditionsJson?: string;
};

type NodeCallbacks = {
  onAdd?: (branch: AddBranch, kind: AddKind) => void;
};

const TRIGGERS: TriggerType[] = [
  "message_received",
  "message_edited",
  "command_received",
  "callback_query_received",
  "inline_query_received",
  "chat_member_updated"
];

const ACTION_OPTIONS = [
  "send_text",
  "send_photo",
  "send_document",
  "edit_message_text",
  "delete_message",
  "answer_callback_query",
  "delay",
  "set_variable",
  "branch_on_variable",
  "restrict_chat_member",
  "ban_chat_member",
  "unban_chat_member"
] as const;

const CONDITION_OPTIONS = [
  "text_contains",
  "text_equals",
  "from_user_id",
  "from_username_equals",
  "chat_id_equals",
  "chat_type_equals",
  "message_source_equals",
  "variable_equals",
  "variable_exists",
  "all",
  "any"
] as const;

function AddButtons({ onAdd, branch = "next" }: { onAdd?: (branch: AddBranch, kind: AddKind) => void; branch?: AddBranch }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="nodrag nopan inline-flex h-5 items-center gap-1 rounded bg-white px-1.5 text-[10px] text-slate-600"
        onClick={() => onAdd?.(branch, "condition")}
      >
        <Plus className="h-3 w-3" /> C
      </button>
      <button
        type="button"
        className="nodrag nopan inline-flex h-5 items-center gap-1 rounded bg-white px-1.5 text-[10px] text-slate-600"
        onClick={() => onAdd?.(branch, "action")}
      >
        <Plus className="h-3 w-3" /> A
      </button>
    </div>
  );
}

function StartNode({ data }: { data: NodeCallbacks }) {
  return (
    <div className="relative rounded bg-white px-3 py-2 text-xs text-slate-700">
      <div className="font-medium">Start</div>
      <Handle type="source" position={Position.Right} />
      <div className="absolute -right-[74px] top-1/2 -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="next" />
      </div>
    </div>
  );
}

function ConditionNode({ data }: { data: NodeActionData & NodeCallbacks }) {
  return (
    <div className="relative min-w-[200px] rounded bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <Handle type="target" position={Position.Left} />
      <div className="font-medium">Condition</div>
      <div className="text-[11px] text-amber-800">{data.type}</div>
      <div className="truncate text-[11px] text-amber-700">{String(data.value ?? data.key ?? "")}</div>

      <Handle id="true" type="source" position={Position.Right} style={{ top: "35%", background: "#16a34a" }} />
      <Handle id="false" type="source" position={Position.Right} style={{ top: "70%", background: "#dc2626" }} />

      <div className="absolute -right-[74px] top-[27%] -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="true" />
      </div>
      <div className="absolute -right-[74px] top-[70%] -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="false" />
      </div>
    </div>
  );
}

function ActionNode({ data }: { data: NodeActionData & NodeCallbacks }) {
  return (
    <div className="relative min-w-[220px] rounded bg-sky-50 px-3 py-2 text-xs text-sky-900">
      <Handle type="target" position={Position.Left} />
      <div className="font-medium">{data.type ?? "action"}</div>
      <div className="line-clamp-2 text-[11px] text-sky-800">{data.text ?? data.caption ?? "Configure action"}</div>
      <Handle type="source" position={Position.Right} />
      <div className="absolute -right-[74px] top-1/2 -translate-y-1/2">
        <AddButtons onAdd={data.onAdd} branch="next" />
      </div>
    </div>
  );
}

const nodeTypes = {
  start: StartNode,
  condition: ConditionNode,
  action: ActionNode
};

function defaultFlowDefinition(): FlowDefinition {
  return {
    nodes: [{ id: "start_1", type: "start", position: { x: 80, y: 200 }, data: {} }],
    edges: []
  };
}

function toCanvasNodes(flow: FlowDefinition): Node[] {
  return flow.nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data
  }));
}

function toCanvasEdges(flow: FlowDefinition): Edge[] {
  return flow.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    label: edge.sourceHandle === "true" || edge.sourceHandle === "false" ? edge.sourceHandle : undefined,
    animated: false
  }));
}

function normalizeActionNodeData(data: Record<string, unknown>) {
  const type = String(data.type ?? "send_text");
  if (type === "send_message") {
    return { type: "send_text", chatId: data.chatId as string | undefined, text: String(data.text ?? "") };
  }

  switch (type) {
    case "send_text":
      return { type, chatId: data.chatId as string | undefined, text: String(data.text ?? "") };
    case "send_photo":
      return {
        type,
        chatId: data.chatId as string | undefined,
        photoUrl: String(data.photoUrl ?? "https://example.com/photo.jpg"),
        caption: (data.caption as string | undefined) || undefined
      };
    case "send_document":
      return {
        type,
        chatId: data.chatId as string | undefined,
        documentUrl: String(data.documentUrl ?? "https://example.com/doc.pdf"),
        caption: (data.caption as string | undefined) || undefined
      };
    case "edit_message_text":
      return {
        type,
        chatId: data.chatId as string | undefined,
        messageId: typeof data.messageId === "number" ? data.messageId : undefined,
        text: String(data.text ?? "")
      };
    case "delete_message":
      return {
        type,
        chatId: data.chatId as string | undefined,
        messageId: typeof data.messageId === "number" ? data.messageId : undefined
      };
    case "answer_callback_query":
      return {
        type,
        callbackQueryId: data.callbackQueryId as string | undefined,
        text: (data.text as string | undefined) || undefined
      };
    case "delay":
      return { type, delayMs: Number(data.delayMs ?? 500) };
    case "set_variable":
      return { type, key: String(data.key ?? "flag"), value: String(data.value ?? "true") };
    case "branch_on_variable":
      return { type, key: String(data.key ?? "flag"), equals: String(data.equals ?? "true") };
    case "restrict_chat_member":
      return { type, chatId: data.chatId as string | undefined, userId: Number(data.userId ?? 0) };
    case "ban_chat_member":
      return { type, chatId: data.chatId as string | undefined, userId: Number(data.userId ?? 0) };
    case "unban_chat_member":
      return { type, chatId: data.chatId as string | undefined, userId: Number(data.userId ?? 0) };
    default:
      return { type: "send_text", text: "" };
  }
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
      conditions: safe.length > 0 ? safe : [{ type: "text_contains", value: "keyword" }]
    };
  }

  if (type === "variable_equals") {
    return {
      type,
      key: String(data.key ?? "flag"),
      value: String(data.value ?? "true")
    };
  }

  if (type === "variable_exists") {
    return {
      type,
      key: String(data.key ?? "flag")
    };
  }

  if (type === "from_user_id") {
    return {
      type,
      value: Number(data.value ?? 0)
    };
  }

  if (type === "message_source_equals") {
    const raw = String(data.value ?? "user");
    const value = raw === "channel" || raw === "group" ? raw : "user";
    return { type, value };
  }

  return {
    type: CONDITION_OPTIONS.includes(type as (typeof CONDITION_OPTIONS)[number]) ? type : "text_contains",
    value: String(data.value ?? "")
  };
}

function toFlowDefinition(nodes: Node[], edges: Edge[]): FlowDefinition {
  const flowNodes = nodes.map((node) => {
    if (node.type === "start") {
      return {
        id: node.id,
        type: "start",
        position: node.position,
        data: {}
      };
    }

    if (node.type === "condition") {
      return {
        id: node.id,
        type: "condition",
        position: node.position,
        data: normalizeConditionNodeData(node.data as Record<string, unknown>)
      };
    }

    return {
      id: node.id,
      type: "action",
      position: node.position,
      data: normalizeActionNodeData(node.data as Record<string, unknown>)
    };
  });

  return {
    nodes: flowNodes as FlowDefinition["nodes"],
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined
    }))
  };
}

function makeEdgeId(connection: Connection) {
  return `${connection.source}_${connection.sourceHandle ?? "default"}_${connection.target}_${connection.targetHandle ?? "default"}_${Date.now()}`;
}

function defaultActionData(type: (typeof ACTION_OPTIONS)[number]): NodeActionData {
  switch (type) {
    case "send_text":
      return { type, text: "Reply text" };
    case "send_photo":
      return { type, photoUrl: "https://example.com/photo.jpg", caption: "Photo" };
    case "send_document":
      return { type, documentUrl: "https://example.com/doc.pdf", caption: "Document" };
    case "edit_message_text":
      return { type, text: "Edited text" };
    case "delete_message":
      return { type };
    case "answer_callback_query":
      return { type, text: "Handled" };
    case "delay":
      return { type, delayMs: 500 };
    case "set_variable":
      return { type, key: "flag", value: "true" };
    case "branch_on_variable":
      return { type, key: "flag", equals: "true" };
    case "restrict_chat_member":
      return { type, userId: 0 };
    case "ban_chat_member":
      return { type, userId: 0 };
    case "unban_chat_member":
      return { type, userId: 0 };
    default:
      return { type: "send_text", text: "Reply text" };
  }
}

function defaultConditionData() {
  return { type: "text_contains", value: "keyword" };
}

export function AddRuleForm({ bots, rules, initialRuleId }: FlowBuilderProps) {
  const [botId, setBotId] = useState(bots[0]?.id ?? "");
  const [name, setName] = useState("Flow");
  const [trigger, setTrigger] = useState<TriggerType>("message_received");
  const [selectedRuleId, setSelectedRuleId] = useState<string>(initialRuleId ?? "new");
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const initialFlow = useMemo(() => defaultFlowDefinition(), []);
  const [nodes, setNodes, onNodesChange] = useNodesState(toCanvasNodes(initialFlow));
  const [edges, setEdges, onEdgesChange] = useEdgesState(toCanvasEdges(initialFlow));

  useEffect(() => {
    const existing = rules.find((rule) => rule.id === selectedRuleId);
    if (!existing) {
      const flow = defaultFlowDefinition();
      setBotId(bots[0]?.id ?? "");
      setName("Flow");
      setTrigger("message_received");
      setNodes(toCanvasNodes(flow));
      setEdges(toCanvasEdges(flow));
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

  const selectedNode = selectedNodeId ? nodes.find((node) => node.id === selectedNodeId) : undefined;

  function addFromNode(parentId: string, branch: AddBranch, kind: AddKind) {
    const parent = nodes.find((node) => node.id === parentId);
    if (!parent) {
      return;
    }

    const idPrefix = kind === "condition" ? "condition" : "action";
    const newId = `${idPrefix}_${Date.now()}`;

    const parentX = parent.position.x;
    const parentY = parent.position.y;
    const branchOffset = branch === "true" ? -90 : branch === "false" ? 90 : 0;

    const newNode: Node = {
      id: newId,
      type: kind,
      position: { x: parentX + 300, y: parentY + branchOffset },
      data: kind === "condition" ? defaultConditionData() : defaultActionData("send_text")
    };

    const newEdge: Edge = {
      id: `${parentId}_${branch}_${newId}_${Date.now()}`,
      source: parentId,
      target: newId,
      sourceHandle: parent.type === "condition" && (branch === "true" || branch === "false") ? branch : undefined,
      label: parent.type === "condition" && (branch === "true" || branch === "false") ? branch : undefined
    };

    setNodes((curr) => [...curr, newNode]);
    setEdges((curr) => [...curr, newEdge]);
    setSelectedNodeId(newId);
  }

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...(node.data as Record<string, unknown>),
          onAdd: (branch: AddBranch, kind: AddKind) => addFromNode(node.id, branch, kind)
        }
      })),
    [nodes]
  );

  function onConnect(connection: Connection) {
    const edge: Edge = {
      id: makeEdgeId(connection),
      source: connection.source ?? "",
      target: connection.target ?? "",
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      label: connection.sourceHandle === "true" || connection.sourceHandle === "false" ? connection.sourceHandle : undefined,
      animated: false
    };

    setEdges((current) => addEdge(edge, current));
  }

  function updateSelectedNodeData(partial: Record<string, unknown>) {
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
            ...partial
          }
        };
      })
    );
  }

  async function saveFlow() {
    setIsSaving(true);
    setStatus("Validating flow...");

    const flowDefinition = toFlowDefinition(nodes, edges);
    const parsed = flowDefinitionSchema.safeParse(flowDefinition);
    if (!parsed.success) {
      setStatus(parsed.error.issues[0]?.message ?? "Flow is invalid.");
      setIsSaving(false);
      return;
    }

    const body: Record<string, unknown> = {
      botId,
      name,
      trigger,
      flowDefinition: parsed.data
    };

    const isUpdating = selectedRuleId !== "new";
    if (isUpdating) {
      body.ruleId = selectedRuleId;
    }

    setStatus(isUpdating ? "Updating flow..." : "Creating flow...");

    const res = await fetch("/api/rules", {
      method: isUpdating ? "PUT" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

    const json = await res.json();
    if (!res.ok) {
      const issueMessage =
        Array.isArray(json.issues) && json.issues.length > 0
          ? `${json.issues[0]?.path || "flow"}: ${json.issues[0]?.message || "invalid"}`
          : null;
      setStatus(issueMessage ?? json.error ?? "Could not save flow.");
      setIsSaving(false);
      return;
    }

    setStatus(isUpdating ? "Flow updated." : "Flow created.");
    setIsSaving(false);

    const nextId = (json.rule?.id as string | undefined) ?? selectedRuleId;
    window.location.href = `/rules?edit=${nextId}`;
  }

  if (bots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Create Flow</CardTitle>
          <CardDescription>Add a Telegram bot first to enable flow creation.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const nodeType = String((selectedNode?.data as NodeActionData | undefined)?.type ?? "");

  return (
    <Card className="bg-white">
      <CardHeader>
        <CardTitle className="text-xl">Flow Builder</CardTitle>
        <CardDescription>1) Choose trigger 2) Add conditions if needed 3) Add actions via + buttons on nodes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-1 text-sm text-muted-foreground">
            <span>Flow</span>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
            >
              <option value="new">New flow</option>
              {rules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-muted-foreground">
            <span>Bot</span>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
            >
              {bots.map((bot) => (
                <option key={bot.id} value={bot.id}>
                  {bot.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-muted-foreground">
            <span>Trigger</span>
            <select
              className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as TriggerType)}
            >
              {TRIGGERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm text-muted-foreground">
            <span>Flow name</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={saveFlow} disabled={isSaving}>
            {isSaving ? "Saving..." : selectedRuleId === "new" ? "Create Flow" : "Update Flow"}
          </Button>
          <Badge variant="secondary">Select a node and edit on right panel</Badge>
          {status ? <Badge variant="outline">{status}</Badge> : null}
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="h-[620px] overflow-hidden rounded-md border border-slate-200 bg-slate-50">
            <ReactFlow
              nodes={displayNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onSelectionChange={({ nodes: selected }) => setSelectedNodeId(selected[0]?.id ?? null)}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background gap={18} color="#e7ebf2" />
            </ReactFlow>
          </div>

          <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-sm font-semibold text-slate-800">Inspector</h3>
            {!selectedNode ? <p className="text-sm text-slate-500">Select a node to edit its settings.</p> : null}

            {selectedNode?.type === "condition" ? (
              <>
                <label className="space-y-1 text-sm text-muted-foreground">
                  <span>Condition type</span>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={String((selectedNode.data as NodeActionData).type ?? "text_contains")}
                    onChange={(e) => updateSelectedNodeData({ type: e.target.value })}
                  >
                    {CONDITION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                {(nodeType === "all" || nodeType === "any") ? (
                  <label className="space-y-1 text-sm text-muted-foreground">
                    <span>Nested conditions JSON array</span>
                    <Textarea
                      rows={5}
                      value={String((selectedNode.data as NodeActionData).conditionsJson ?? "[]")}
                      onChange={(e) => updateSelectedNodeData({ conditionsJson: e.target.value })}
                    />
                  </label>
                ) : (
                  <label className="space-y-1 text-sm text-muted-foreground">
                    <span>{nodeType === "variable_equals" || nodeType === "variable_exists" ? "Key" : "Value"}</span>
                    {nodeType === "message_source_equals" ? (
                      <select
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                        value={String((selectedNode.data as NodeActionData).value ?? "user")}
                        onChange={(e) => updateSelectedNodeData({ value: e.target.value })}
                      >
                        <option value="user">user</option>
                        <option value="group">group</option>
                        <option value="channel">channel</option>
                      </select>
                    ) : (
                      <Input
                        value={String((selectedNode.data as NodeActionData).value ?? (selectedNode.data as NodeActionData).key ?? "")}
                        onChange={(e) => {
                          if (nodeType === "variable_equals" || nodeType === "variable_exists") {
                            updateSelectedNodeData({ key: e.target.value });
                            return;
                          }

                          const val = nodeType === "from_user_id" ? Number(e.target.value || 0) : e.target.value;
                          updateSelectedNodeData({ value: val });
                        }}
                      />
                    )}
                  </label>
                )}

                {nodeType === "variable_equals" ? (
                  <label className="space-y-1 text-sm text-muted-foreground">
                    <span>Equals</span>
                    <Input
                      value={String((selectedNode.data as NodeActionData).value ?? "")}
                      onChange={(e) => updateSelectedNodeData({ value: e.target.value })}
                    />
                  </label>
                ) : null}
              </>
            ) : null}

            {selectedNode?.type === "action" ? (
              <>
                <label className="space-y-1 text-sm text-muted-foreground">
                  <span>Action type</span>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={String((selectedNode.data as NodeActionData).type ?? "send_text")}
                    onChange={(e) => updateSelectedNodeData(defaultActionData(e.target.value as (typeof ACTION_OPTIONS)[number]))}
                  >
                    {ACTION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm text-muted-foreground">
                  <span>Primary text/value</span>
                  <Textarea
                    rows={4}
                    value={String((selectedNode.data as NodeActionData).text ?? (selectedNode.data as NodeActionData).caption ?? (selectedNode.data as NodeActionData).value ?? (selectedNode.data as NodeActionData).equals ?? "")}
                    onChange={(e) =>
                      updateSelectedNodeData({ text: e.target.value, caption: e.target.value, value: e.target.value, equals: e.target.value })
                    }
                  />
                </label>

                <label className="space-y-1 text-sm text-muted-foreground">
                  <span>Chat ID / Key / URL</span>
                  <Input
                    value={String((selectedNode.data as NodeActionData).chatId ?? (selectedNode.data as NodeActionData).key ?? (selectedNode.data as NodeActionData).photoUrl ?? (selectedNode.data as NodeActionData).documentUrl ?? (selectedNode.data as NodeActionData).callbackQueryId ?? "")}
                    onChange={(e) =>
                      updateSelectedNodeData({
                        chatId: e.target.value,
                        key: e.target.value,
                        photoUrl: e.target.value,
                        documentUrl: e.target.value,
                        callbackQueryId: e.target.value
                      })
                    }
                  />
                </label>

                <label className="space-y-1 text-sm text-muted-foreground">
                  <span>Numeric value</span>
                  <Input
                    type="number"
                    value={String((selectedNode.data as NodeActionData).userId ?? (selectedNode.data as NodeActionData).messageId ?? (selectedNode.data as NodeActionData).delayMs ?? 0)}
                    onChange={(e) => {
                      const value = Number(e.target.value || 0);
                      updateSelectedNodeData({ userId: value, messageId: value, delayMs: value });
                    }}
                  />
                </label>
              </>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
