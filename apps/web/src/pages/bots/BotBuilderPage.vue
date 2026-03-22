<script setup lang="ts">
import FlowNodeCard, {
  type StudioNodeData,
} from "@/components/flow/FlowNodeCard.vue";
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { normalizeFlowGraph } from "@/lib/flow-graph";
import { useAuthStore } from "@/stores/auth";
import { useBotsStore } from "@/stores/bots";
import type { FlowGraph } from "@telegraph/schemas";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MarkerType, VueFlow, type Connection } from "@vue-flow/core";
import { MiniMap } from "@vue-flow/minimap";
import { Plus, Save, Send, Workflow } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

type BuilderNodeType =
  | "command_trigger"
  | "message_trigger"
  | "callback_trigger"
  | "send_message"
  | "send_media"
  | "http_request"
  | "ai_prompt"
  | "condition"
  | "set_variable"
  | "wait_for_input";

type MessageMatchType = "exact" | "contains" | "regex";
type ConditionOperator = "eq" | "neq" | "contains" | "gt" | "lt" | "regex";

type ParseMode = "HTML" | "Markdown" | "MarkdownV2";

interface CommandTriggerConfig {
  command: string;
}

interface MessageTriggerConfig {
  pattern: string;
  matchType: MessageMatchType;
}

interface SendMessageConfig {
  text: string;
  buttons: string;
  parseMode: ParseMode | "";
}

type MediaType = "photo" | "video" | "document" | "audio";

interface CallbackTriggerConfig {
  callbackData: string;
}

interface SendMediaConfig {
  mediaType: MediaType;
  url: string;
  fileId: string;
  caption: string;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface HttpRequestConfig {
  method: HttpMethod;
  url: string;
  headers: string;
  body: string;
  responseVariable: string;
}

interface AiPromptConfig {
  systemPrompt: string;
  userPromptTemplate: string;
  model: string;
  responseVariable: string;
}

interface ConditionConfig {
  operator: ConditionOperator;
  value: string;
}

interface SetVariableConfig {
  variable: string;
  valueExpression: string;
}

interface WaitForInputConfig {
  variable: string;
  timeoutSecs: number;
}

type BuilderNodeConfig =
  | CommandTriggerConfig
  | MessageTriggerConfig
  | CallbackTriggerConfig
  | SendMessageConfig
  | SendMediaConfig
  | HttpRequestConfig
  | AiPromptConfig
  | ConditionConfig
  | SetVariableConfig
  | WaitForInputConfig;

interface BuilderNodeData extends StudioNodeData {
  nodeType: BuilderNodeType;
  config: BuilderNodeConfig;
}

interface BuilderCanvasNode {
  id: string;
  type: "teleNode";
  position: {
    x: number;
    y: number;
  };
  data: BuilderNodeData;
}

interface StudioEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
  animated: boolean;
  markerEnd: {
    type: MarkerType;
    color: string;
  };
  style: {
    stroke: string;
    opacity: number;
    strokeWidth: number;
  };
  label?: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface BuilderGraphNode {
  id: string;
  type: BuilderNodeType;
  config: Record<string, unknown>;
  position: {
    x: number;
    y: number;
  };
  label?: string;
}

interface BuilderGraphEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

interface BuilderGraph {
  schemaVersion: 2;
  nodes: BuilderGraphNode[];
  edges: BuilderGraphEdge[];
}

interface MiniMapNodeLike {
  id: string;
  data?: Partial<BuilderNodeData>;
}

const route = useRoute();
const authStore = useAuthStore();
const botsStore = useBotsStore();

const nodeTypes = {
  teleNode: FlowNodeCard,
};

const botId = computed(() => String(route.params["botId"] ?? ""));
const bot = computed(() => botsStore.getBotById(botId.value));

const nodes = ref<BuilderCanvasNode[]>([]);
const edges = ref<StudioEdge[]>([]);
const flowId = ref("");
const selectedNodeId = ref("");

const loading = ref(false);
const saving = ref(false);
const publishing = ref(false);
const errorMessage = ref("");

const editorCommand = ref("/start");
const editorPattern = ref("");
const editorMatchType = ref<MessageMatchType>("exact");
const editorCallbackData = ref("help");
const editorMessageText = ref("");
const editorMessageButtons = ref("");
const editorParseMode = ref<ParseMode | "">("");
const editorMediaType = ref<MediaType>("photo");
const editorMediaUrl = ref("");
const editorMediaFileId = ref("");
const editorMediaCaption = ref("");
const editorHttpMethod = ref<HttpMethod>("GET");
const editorHttpUrl = ref("");
const editorHttpHeaders = ref("");
const editorHttpBody = ref("");
const editorHttpResponseVariable = ref("http_response");
const editorAiSystemPrompt = ref("");
const editorAiUserPrompt = ref("");
const editorAiModel = ref("gpt-4o-mini");
const editorAiResponseVariable = ref("ai_response");
const editorConditionOperator = ref<ConditionOperator>("eq");
const editorConditionValue = ref("");
const editorSetVariableName = ref("");
const editorSetVariableExpr = ref("");
const editorWaitVariable = ref("user_input");
const editorWaitTimeout = ref("300");
const NONE_PARSE_MODE = "__none__";

const palette = [
  { type: "command_trigger" as const, title: "Command Trigger" },
  { type: "message_trigger" as const, title: "Message Trigger" },
  { type: "callback_trigger" as const, title: "Callback Trigger" },
  { type: "send_message" as const, title: "Send Message" },
  { type: "send_media" as const, title: "Send Media" },
  { type: "http_request" as const, title: "HTTP Request" },
  { type: "ai_prompt" as const, title: "AI Prompt" },
  { type: "condition" as const, title: "Condition" },
  { type: "set_variable" as const, title: "Set Variable" },
  { type: "wait_for_input" as const, title: "Wait For Input" },
];

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null;
  return nodes.value.find((node) => node.id === selectedNodeId.value) ?? null;
});

const parseModeSelectValue = computed<string>({
  get() {
    return editorParseMode.value || NONE_PARSE_MODE;
  },
  set(value: string) {
    editorParseMode.value =
      value === NONE_PARSE_MODE ? "" : (value as ParseMode);
  },
});

const triggerCount = computed(
  () =>
    nodes.value.filter((node) => node.data.nodeType.includes("trigger")).length,
);

const actionCount = computed(
  () =>
    nodes.value.filter((node) =>
      ["send_message", "send_media", "http_request", "ai_prompt"].includes(
        node.data.nodeType,
      ),
    ).length,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asMessageMatchType(value: unknown): MessageMatchType {
  if (value === "exact" || value === "contains" || value === "regex")
    return value;
  return "exact";
}

function asConditionOperator(value: unknown): ConditionOperator {
  if (
    value === "eq" ||
    value === "neq" ||
    value === "contains" ||
    value === "gt" ||
    value === "lt" ||
    value === "regex"
  ) {
    return value;
  }
  return "eq";
}

function asParseMode(value: unknown): ParseMode | "" {
  if (value === "HTML" || value === "Markdown" || value === "MarkdownV2")
    return value;
  return "";
}

function asMediaType(value: unknown): MediaType {
  if (value === "photo" || value === "video" || value === "document" || value === "audio") {
    return value;
  }
  return "photo";
}

function asHttpMethod(value: unknown): HttpMethod {
  if (value === "GET" || value === "POST" || value === "PUT" || value === "PATCH" || value === "DELETE") {
    return value;
  }
  return "GET";
}

function metadataForNodeType(
  nodeType: BuilderNodeType,
): Omit<BuilderNodeData, "config" | "nodeType"> {
  if (nodeType === "command_trigger") {
    return {
      kind: "trigger",
      title: "Command Trigger",
      subtitle: "Runs when a command like /start is received.",
      chips: ["trigger", "command"],
      metric: "live",
    };
  }

  if (nodeType === "message_trigger") {
    return {
      kind: "trigger",
      title: "Message Trigger",
      subtitle: "Matches user text by exact/contains/regex.",
      chips: ["trigger", "message"],
      metric: "live",
    };
  }

  if (nodeType === "callback_trigger") {
    return {
      kind: "trigger",
      title: "Callback Trigger",
      subtitle: "Starts from inline button callback payload.",
      chips: ["trigger", "callback"],
      metric: "ready",
    };
  }

  if (nodeType === "condition") {
    return {
      kind: "condition",
      title: "Condition",
      subtitle: "Routes true/false based on _text.",
      chips: ["branch", "_text"],
      metric: "live",
    };
  }

  if (nodeType === "send_media") {
    return {
      kind: "action",
      title: "Send Media",
      subtitle: "Sends photo/video/document/audio with optional caption.",
      chips: ["action", "media"],
      metric: "ready",
    };
  }

  if (nodeType === "http_request") {
    return {
      kind: "action",
      title: "HTTP Request",
      subtitle: "Calls external APIs and stores the response variable.",
      chips: ["action", "http"],
      metric: "ready",
    };
  }

  if (nodeType === "ai_prompt") {
    return {
      kind: "ai",
      title: "AI Prompt",
      subtitle: "Generates model output and resumes execution flow.",
      chips: ["ai", "llm"],
      metric: "ready",
    };
  }

  if (nodeType === "set_variable") {
    return {
      kind: "action",
      title: "Set Variable",
      subtitle: "Writes derived values to session variables.",
      chips: ["state", "variable"],
      metric: "ready",
    };
  }

  if (nodeType === "wait_for_input") {
    return {
      kind: "condition",
      title: "Wait For Input",
      subtitle: "Pauses flow until user responds.",
      chips: ["state", "input"],
      metric: "ready",
    };
  }

  return {
    kind: "message",
    title: "Send Message",
    subtitle: "Sends text with optional inline buttons.",
    chips: ["action", "message"],
    metric: "live",
  };
}

function defaultConfigForNodeType(
  nodeType: BuilderNodeType,
): BuilderNodeConfig {
  if (nodeType === "command_trigger") {
    return { command: "/start" };
  }

  if (nodeType === "message_trigger") {
    return {
      pattern: "hello",
      matchType: "contains",
    };
  }

  if (nodeType === "callback_trigger") {
    return {
      callbackData: "help",
    };
  }

  if (nodeType === "condition") {
    return {
      operator: "contains",
      value: "help",
    };
  }

  if (nodeType === "send_media") {
    return {
      mediaType: "photo",
      url: "",
      fileId: "",
      caption: "",
    };
  }

  if (nodeType === "http_request") {
    return {
      method: "GET",
      url: "",
      headers: "",
      body: "",
      responseVariable: "http_response",
    };
  }

  if (nodeType === "ai_prompt") {
    return {
      systemPrompt: "",
      userPromptTemplate: "Summarize {{_text}}",
      model: "gpt-4o-mini",
      responseVariable: "ai_response",
    };
  }

  if (nodeType === "set_variable") {
    return {
      variable: "key",
      valueExpression: "{{_text}}",
    };
  }

  if (nodeType === "wait_for_input") {
    return {
      variable: "user_input",
      timeoutSecs: 300,
    };
  }

  return {
    text: "Welcome to the bot!",
    buttons: "",
    parseMode: "",
  };
}

function parseButtonsFromReplyMarkup(replyMarkup: unknown): string {
  if (!isRecord(replyMarkup)) return "";

  const keyboard = replyMarkup["inline_keyboard"];
  if (!Array.isArray(keyboard)) return "";

  const lines: string[] = [];
  for (const row of keyboard) {
    if (!Array.isArray(row)) continue;
    for (const button of row) {
      if (!isRecord(button)) continue;
      const text = asString(button["text"], "").trim();
      const callbackData = asString(button["callback_data"], "").trim();
      if (!text || !callbackData) continue;
      lines.push(`${text}|${callbackData}`);
    }
  }

  return lines.join("\n");
}

function normalizeNodeConfig(
  nodeType: BuilderNodeType,
  rawConfig: unknown,
): BuilderNodeConfig {
  const config = isRecord(rawConfig) ? rawConfig : {};

  if (nodeType === "command_trigger") {
    return {
      command: asString(config["command"], "/start"),
    };
  }

  if (nodeType === "message_trigger") {
    return {
      pattern: asString(config["pattern"], ""),
      matchType: asMessageMatchType(config["matchType"]),
    };
  }

  if (nodeType === "callback_trigger") {
    return {
      callbackData: asString(config["callbackData"], ""),
    };
  }

  if (nodeType === "condition") {
    const rules = Array.isArray(config["rules"]) ? config["rules"] : [];
    const firstRule = rules.find(isRecord);

    return {
      operator: asConditionOperator(firstRule?.["operator"]),
      value: asString(firstRule?.["value"], ""),
    };
  }

  if (nodeType === "send_media") {
    return {
      mediaType: asMediaType(config["mediaType"]),
      url: asString(config["url"], ""),
      fileId: asString(config["fileId"], ""),
      caption: asString(config["caption"], ""),
    };
  }

  if (nodeType === "http_request") {
    return {
      method: asHttpMethod(config["method"]),
      url: asString(config["url"], ""),
      headers: JSON.stringify(config["headers"] ?? {}, null, 2),
      body: asString(config["body"], ""),
      responseVariable: asString(config["responseVariable"], "http_response"),
    };
  }

  if (nodeType === "ai_prompt") {
    return {
      systemPrompt: asString(config["systemPrompt"], ""),
      userPromptTemplate: asString(config["userPromptTemplate"], ""),
      model: asString(config["model"], "gpt-4o-mini"),
      responseVariable: asString(config["responseVariable"], "ai_response"),
    };
  }

  if (nodeType === "set_variable") {
    return {
      variable: asString(config["variable"], ""),
      valueExpression: asString(config["valueExpression"], ""),
    };
  }

  if (nodeType === "wait_for_input") {
    return {
      variable: asString(config["variable"], "user_input"),
      timeoutSecs: asNumber(config["timeoutSecs"], 300),
    };
  }

  return {
    text: asString(config["text"], ""),
    buttons: parseButtonsFromReplyMarkup(config["replyMarkup"]),
    parseMode: asParseMode(config["parseMode"]),
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  label?: string,
): StudioEdge {
  return {
    id,
    source,
    target,
    label,
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#334155" },
    style: { stroke: "#334155", opacity: 0.65, strokeWidth: 1.4 },
  };
}

function createBuilderNode(
  nodeType: BuilderNodeType,
  index: number,
): BuilderCanvasNode {
  const meta = metadataForNodeType(nodeType);

  return {
    id: `${nodeType}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    type: "teleNode",
    position: {
      x: 180 + (index % 3) * 300,
      y: 120 + Math.floor(index / 3) * 180,
    },
    data: {
      ...meta,
      nodeType,
      config: defaultConfigForNodeType(nodeType),
    },
  };
}

function createDefaultCanvas(): {
  nodes: BuilderCanvasNode[];
  edges: StudioEdge[];
} {
  const triggerNode = createBuilderNode("command_trigger", 0);
  const messageNode = createBuilderNode("send_message", 1);

  triggerNode.id = "trigger-start";
  messageNode.id = "message-welcome";
  triggerNode.position = { x: 140, y: 240 };
  messageNode.position = { x: 460, y: 240 };

  triggerNode.data.config = { command: "/start" };
  messageNode.data.config = {
    text: "Welcome!",
    buttons: "Get Help|help",
    parseMode: "",
  };

  return {
    nodes: [triggerNode, messageNode],
    edges: [makeEdge("edge-trigger-message", triggerNode.id, messageNode.id)],
  };
}

function parseStoredGraph(graphJson: unknown): BuilderGraph | null {
  const normalized = normalizeFlowGraph(graphJson);
  if (!normalized.ok) return null;

  const rawNodes = normalized.graph.nodes;
  const rawEdges = normalized.graph.edges;
  if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) return null;

  const supportedNodeTypes = new Set<BuilderNodeType>([
    "command_trigger",
    "message_trigger",
    "callback_trigger",
    "send_message",
    "send_media",
    "http_request",
    "ai_prompt",
    "condition",
    "set_variable",
    "wait_for_input",
  ]);

  const nodes: BuilderGraphNode[] = [];
  for (const rawNode of rawNodes) {
    if (!isRecord(rawNode)) continue;

    const id = asString(rawNode["id"], "");
    const typeValue = rawNode["type"];
    if (!id || typeof typeValue !== "string") continue;
    if (!supportedNodeTypes.has(typeValue as BuilderNodeType)) continue;

    const rawPosition = isRecord(rawNode["position"])
      ? (rawNode["position"] as Record<string, unknown>)
      : ({} as Record<string, unknown>);
    nodes.push({
      id,
      type: typeValue as BuilderNodeType,
      config: isRecord(rawNode["config"])
        ? (rawNode["config"] as Record<string, unknown>)
        : {},
      position: {
        x: asNumber(rawPosition["x"], 0),
        y: asNumber(rawPosition["y"], 0),
      },
      label:
        typeof rawNode["label"] === "string" ? rawNode["label"] : undefined,
    });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: BuilderGraphEdge[] = [];
  for (const rawEdge of rawEdges) {
    if (!isRecord(rawEdge)) continue;

    const id = asString(rawEdge["id"], "");
    const source = asString(rawEdge["source"], "");
    const target = asString(rawEdge["target"], "");
    if (!id || !source || !target) continue;
    if (!nodeIds.has(source) || !nodeIds.has(target)) continue;

    edges.push({
      id,
      source,
      target,
      sourceHandle:
        typeof rawEdge["sourceHandle"] === "string"
          ? rawEdge["sourceHandle"]
          : undefined,
      targetHandle:
        typeof rawEdge["targetHandle"] === "string"
          ? rawEdge["targetHandle"]
          : undefined,
      label:
        typeof rawEdge["label"] === "string" ? rawEdge["label"] : undefined,
    });
  }

  return {
    schemaVersion: 2,
    nodes,
    edges,
  };
}

function toCanvasGraph(graph: BuilderGraph): {
  nodes: BuilderCanvasNode[];
  edges: StudioEdge[];
} {
  const canvasNodes: BuilderCanvasNode[] = graph.nodes.map((node) => {
    const meta = metadataForNodeType(node.type);

    return {
      id: node.id,
      type: "teleNode",
      position: { ...node.position },
      data: {
        ...meta,
        title: node.label ?? meta.title,
        nodeType: node.type,
        config: normalizeNodeConfig(node.type, node.config),
      },
    };
  });

  const canvasEdges: StudioEdge[] = graph.edges.map((edge) => {
    const mapped = makeEdge(edge.id, edge.source, edge.target, edge.label);
    mapped.sourceHandle = edge.sourceHandle;
    mapped.targetHandle = edge.targetHandle;
    return mapped;
  });

  for (const node of graph.nodes) {
    if (node.type !== "condition") continue;

    const config = isRecord(node.config) ? node.config : {};
    const rules = Array.isArray(config["rules"]) ? config["rules"] : [];
    const firstRule = rules.find(isRecord);
    const trueEdgeId = asString(firstRule?.["targetEdgeId"], "");
    const falseEdgeId = asString(config["defaultEdgeId"], "");

    for (const edge of canvasEdges) {
      if (edge.id === trueEdgeId) {
        edge.label = "true";
      } else if (edge.id === falseEdgeId) {
        edge.label = "false";
      }
    }
  }

  return {
    nodes: canvasNodes,
    edges: canvasEdges,
  };
}

function parseButtons(
  buttonsRaw: string,
):
  | { inline_keyboard: Array<Array<{ text: string; callback_data: string }>> }
  | undefined {
  const rows = buttonsRaw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [textPart, callbackPart] = line.split("|");
      const text = textPart?.trim() ?? "";
      const callbackData = callbackPart?.trim() ?? "";
      if (!text || !callbackData) return null;
      return [{ text, callback_data: callbackData }];
    })
    .filter(
      (row): row is Array<{ text: string; callback_data: string }> =>
        row !== null,
    );

  if (rows.length === 0) return undefined;
  return { inline_keyboard: rows };
}

function buildConditionConfig(
  node: BuilderCanvasNode,
  allEdges: StudioEdge[],
): Record<string, unknown> {
  const outgoing = allEdges.filter((edge) => edge.source === node.id);
  if (outgoing.length < 2) {
    throw new Error(
      "Condition nodes need two outgoing edges (true and false).",
    );
  }

  const trueEdge =
    outgoing.find((edge) => edge.label?.toLowerCase() === "true") ??
    outgoing[0];
  const falseEdge =
    outgoing.find((edge) => edge.label?.toLowerCase() === "false") ??
    outgoing[1];

  if (!trueEdge || !falseEdge) {
    throw new Error("Condition node could not resolve true/false edges.");
  }

  const config = node.data.config as ConditionConfig;
  return {
    rules: [
      {
        variable: "_text",
        operator: config.operator,
        value: config.value,
        targetEdgeId: trueEdge.id,
      },
    ],
    defaultEdgeId: falseEdge.id,
  };
}

function toFlowGraph(
  canvasNodes: BuilderCanvasNode[],
  canvasEdges: StudioEdge[],
): FlowGraph {
  const nodesGraph: FlowGraph["nodes"] = canvasNodes.map((node) => {
    let config: Record<string, unknown>;

    switch (node.data.nodeType) {
      case "command_trigger": {
        const currentConfig = node.data.config as CommandTriggerConfig;
        config = {
          command: currentConfig.command,
        };
        break;
      }
      case "message_trigger": {
        const currentConfig = node.data.config as MessageTriggerConfig;
        config = {
          pattern: currentConfig.pattern,
          matchType: currentConfig.matchType,
        };
        break;
      }
      case "callback_trigger": {
        const currentConfig = node.data.config as CallbackTriggerConfig;
        config = {
          callbackData: currentConfig.callbackData,
        };
        break;
      }
      case "condition": {
        config = buildConditionConfig(node, canvasEdges);
        break;
      }
      case "send_media": {
        const currentConfig = node.data.config as SendMediaConfig;
        config = {
          mediaType: currentConfig.mediaType,
          ...(currentConfig.url.trim() && { url: currentConfig.url.trim() }),
          ...(currentConfig.fileId.trim() && { fileId: currentConfig.fileId.trim() }),
          ...(currentConfig.caption.trim() && { caption: currentConfig.caption }),
        };
        break;
      }
      case "http_request": {
        const currentConfig = node.data.config as HttpRequestConfig;
        let parsedHeaders: Record<string, string> | undefined;
        if (currentConfig.headers.trim()) {
          try {
            const parsed = JSON.parse(currentConfig.headers);
            if (isRecord(parsed)) {
              parsedHeaders = Object.fromEntries(
                Object.entries(parsed).map(([key, value]) => [key, String(value)]),
              );
            }
          } catch {
            parsedHeaders = undefined;
          }
        }

        config = {
          method: currentConfig.method,
          url: currentConfig.url,
          ...(parsedHeaders && { headers: parsedHeaders }),
          ...(currentConfig.body.trim() && { body: currentConfig.body }),
          responseVariable: currentConfig.responseVariable.trim() || "http_response",
        };
        break;
      }
      case "ai_prompt": {
        const currentConfig = node.data.config as AiPromptConfig;
        config = {
          ...(currentConfig.systemPrompt.trim() && { systemPrompt: currentConfig.systemPrompt }),
          userPromptTemplate: currentConfig.userPromptTemplate,
          model: currentConfig.model.trim() || "gpt-4o-mini",
          responseVariable: currentConfig.responseVariable.trim() || "ai_response",
        };
        break;
      }
      case "set_variable": {
        const currentConfig = node.data.config as SetVariableConfig;
        config = {
          variable: currentConfig.variable.trim(),
          valueExpression: currentConfig.valueExpression,
        };
        break;
      }
      case "wait_for_input": {
        const currentConfig = node.data.config as WaitForInputConfig;
        config = {
          variable: currentConfig.variable.trim() || "user_input",
          timeoutSecs: Math.max(1, Math.floor(currentConfig.timeoutSecs)),
        };
        break;
      }
      default: {
        const currentConfig = node.data.config as SendMessageConfig;
        config = {
          text: currentConfig.text,
        };

        const parseMode = currentConfig.parseMode;
        if (parseMode) {
          config["parseMode"] = parseMode;
        }

        const replyMarkup = parseButtons(currentConfig.buttons);
        if (replyMarkup) {
          config["replyMarkup"] = replyMarkup;
        }
      }
    }

    return {
      id: node.id,
      type: node.data.nodeType,
      config,
      position: {
        x: node.position.x,
        y: node.position.y,
      },
      label: node.data.title,
    };
  });

  const edgesGraph: FlowGraph["edges"] = canvasEdges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? undefined,
    targetHandle: edge.targetHandle ?? undefined,
    label: edge.label?.toString(),
  }));

  return {
    schemaVersion: 2,
    nodes: nodesGraph,
    edges: edgesGraph,
  };
}

function addNode(nodeType: BuilderNodeType): void {
  const node = createBuilderNode(nodeType, nodes.value.length);
  nodes.value = [...nodes.value, node];
  selectedNodeId.value = node.id;

  const sourceNode = nodes.value.at(-2);
  if (!sourceNode) return;

  let label: string | undefined;
  if (sourceNode.data.nodeType === "condition") {
    const existing = edges.value.filter(
      (edge) => edge.source === sourceNode.id,
    );
    if (existing.length >= 2) {
      errorMessage.value =
        "Condition nodes can only have true and false branches.";
      return;
    }
    label = existing.length === 0 ? "true" : "false";
  }

  edges.value = [
    ...edges.value,
    makeEdge(
      `edge-${sourceNode.id}-${node.id}-${Date.now()}`,
      sourceNode.id,
      node.id,
      label,
    ),
  ];
}

function onConnect(connection: Connection): void {
  if (!connection.source || !connection.target) return;

  const sourceNode = nodes.value.find((node) => node.id === connection.source);
  let label: string | undefined;

  if (sourceNode?.data.nodeType === "condition") {
    const existing = edges.value.filter(
      (edge) => edge.source === sourceNode.id,
    );
    if (existing.length >= 2) {
      errorMessage.value =
        "Condition nodes can only have true and false branches.";
      return;
    }
    label = existing.length === 0 ? "true" : "false";
  }

  const edge = makeEdge(
    `edge-${connection.source}-${connection.target}-${Date.now()}`,
    connection.source,
    connection.target,
    label,
  );
  edge.sourceHandle = connection.sourceHandle ?? undefined;
  edge.targetHandle = connection.targetHandle ?? undefined;

  edges.value = [...edges.value, edge];
}

function onNodeClick(payload: { node: { id: string } }): void {
  selectedNodeId.value = payload.node.id;
}

function miniMapColor(node: MiniMapNodeLike): string {
  const nodeType = node.data?.nodeType;
  if (
    nodeType === "command_trigger" ||
    nodeType === "message_trigger" ||
    nodeType === "callback_trigger"
  )
    return "#f59e0b";
  if (nodeType === "send_message" || nodeType === "send_media") return "#0ea5e9";
  if (nodeType === "http_request" || nodeType === "set_variable") return "#14b8a6";
  if (nodeType === "ai_prompt") return "#10b981";
  if (nodeType === "wait_for_input") return "#8b5cf6";
  if (nodeType === "condition") return "#d946ef";
  return "#64748b";
}

function miniMapStroke(node: MiniMapNodeLike): string {
  return node.id === selectedNodeId.value ? "#0f172a" : "#cbd5e1";
}

watch(
  selectedNode,
  (node) => {
    if (!node) return;

    if (node.data.nodeType === "command_trigger") {
      const cfg = node.data.config as CommandTriggerConfig;
      editorCommand.value = cfg.command;
      return;
    }

    if (node.data.nodeType === "message_trigger") {
      const cfg = node.data.config as MessageTriggerConfig;
      editorPattern.value = cfg.pattern;
      editorMatchType.value = cfg.matchType;
      return;
    }

    if (node.data.nodeType === "callback_trigger") {
      const cfg = node.data.config as CallbackTriggerConfig;
      editorCallbackData.value = cfg.callbackData;
      return;
    }

    if (node.data.nodeType === "send_media") {
      const cfg = node.data.config as SendMediaConfig;
      editorMediaType.value = cfg.mediaType;
      editorMediaUrl.value = cfg.url;
      editorMediaFileId.value = cfg.fileId;
      editorMediaCaption.value = cfg.caption;
      return;
    }

    if (node.data.nodeType === "http_request") {
      const cfg = node.data.config as HttpRequestConfig;
      editorHttpMethod.value = cfg.method;
      editorHttpUrl.value = cfg.url;
      editorHttpHeaders.value = cfg.headers;
      editorHttpBody.value = cfg.body;
      editorHttpResponseVariable.value = cfg.responseVariable;
      return;
    }

    if (node.data.nodeType === "ai_prompt") {
      const cfg = node.data.config as AiPromptConfig;
      editorAiSystemPrompt.value = cfg.systemPrompt;
      editorAiUserPrompt.value = cfg.userPromptTemplate;
      editorAiModel.value = cfg.model;
      editorAiResponseVariable.value = cfg.responseVariable;
      return;
    }

    if (node.data.nodeType === "condition") {
      const cfg = node.data.config as ConditionConfig;
      editorConditionOperator.value = cfg.operator;
      editorConditionValue.value = cfg.value;
      return;
    }

    if (node.data.nodeType === "set_variable") {
      const cfg = node.data.config as SetVariableConfig;
      editorSetVariableName.value = cfg.variable;
      editorSetVariableExpr.value = cfg.valueExpression;
      return;
    }

    if (node.data.nodeType === "wait_for_input") {
      const cfg = node.data.config as WaitForInputConfig;
      editorWaitVariable.value = cfg.variable;
      editorWaitTimeout.value = String(cfg.timeoutSecs);
      return;
    }

    const cfg = node.data.config as SendMessageConfig;
    editorMessageText.value = cfg.text;
    editorMessageButtons.value = cfg.buttons;
    editorParseMode.value = cfg.parseMode;
  },
  { immediate: true },
);

watch(
  [
    editorCommand,
    editorPattern,
    editorMatchType,
    editorCallbackData,
    editorMessageText,
    editorMessageButtons,
    editorParseMode,
    editorMediaType,
    editorMediaUrl,
    editorMediaFileId,
    editorMediaCaption,
    editorHttpMethod,
    editorHttpUrl,
    editorHttpHeaders,
    editorHttpBody,
    editorHttpResponseVariable,
    editorAiSystemPrompt,
    editorAiUserPrompt,
    editorAiModel,
    editorAiResponseVariable,
    editorConditionOperator,
    editorConditionValue,
    editorSetVariableName,
    editorSetVariableExpr,
    editorWaitVariable,
    editorWaitTimeout,
  ],
  () => {
    const node = selectedNode.value;
    if (!node) return;

    if (node.data.nodeType === "command_trigger") {
      node.data.config = {
        command: editorCommand.value,
      };
      return;
    }

    if (node.data.nodeType === "message_trigger") {
      node.data.config = {
        pattern: editorPattern.value,
        matchType: editorMatchType.value,
      };
      return;
    }

    if (node.data.nodeType === "callback_trigger") {
      node.data.config = {
        callbackData: editorCallbackData.value,
      };
      return;
    }

    if (node.data.nodeType === "send_media") {
      node.data.config = {
        mediaType: editorMediaType.value,
        url: editorMediaUrl.value,
        fileId: editorMediaFileId.value,
        caption: editorMediaCaption.value,
      };
      return;
    }

    if (node.data.nodeType === "http_request") {
      node.data.config = {
        method: editorHttpMethod.value,
        url: editorHttpUrl.value,
        headers: editorHttpHeaders.value,
        body: editorHttpBody.value,
        responseVariable: editorHttpResponseVariable.value,
      };
      return;
    }

    if (node.data.nodeType === "ai_prompt") {
      node.data.config = {
        systemPrompt: editorAiSystemPrompt.value,
        userPromptTemplate: editorAiUserPrompt.value,
        model: editorAiModel.value,
        responseVariable: editorAiResponseVariable.value,
      };
      return;
    }

    if (node.data.nodeType === "condition") {
      node.data.config = {
        operator: editorConditionOperator.value,
        value: editorConditionValue.value,
      };
      return;
    }

    if (node.data.nodeType === "set_variable") {
      node.data.config = {
        variable: editorSetVariableName.value,
        valueExpression: editorSetVariableExpr.value,
      };
      return;
    }

    if (node.data.nodeType === "wait_for_input") {
      node.data.config = {
        variable: editorWaitVariable.value,
        timeoutSecs: Number(editorWaitTimeout.value) || 300,
      };
      return;
    }

    node.data.config = {
      text: editorMessageText.value,
      buttons: editorMessageButtons.value,
      parseMode: editorParseMode.value,
    };
  },
);

async function loadBuilder() {
  const token = authStore.token;
  if (!token) {
    errorMessage.value = "Your session has expired. Sign in again.";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    await botsStore.fetchBots(token);
    const flow = await botsStore.getOrCreateMainFlow(token, botId.value);
    flowId.value = flow.id;

    const graph = parseStoredGraph(flow.graph);
    if (graph && graph.nodes.length > 0) {
      const canvas = toCanvasGraph(graph);
      nodes.value = canvas.nodes;
      edges.value = canvas.edges;
    } else {
      const defaults = createDefaultCanvas();
      nodes.value = defaults.nodes;
      edges.value = defaults.edges;
    }

    selectedNodeId.value = nodes.value[0]?.id ?? "";
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to load builder.";
  } finally {
    loading.value = false;
  }
}

async function saveDraft(): Promise<boolean> {
  const token = authStore.token;
  if (!token || !flowId.value) {
    errorMessage.value = "Missing auth session or flow id.";
    toast.error("Missing auth session or flow id.");
    return false;
  }

  saving.value = true;
  errorMessage.value = "";

  try {
    const graph = toFlowGraph(nodes.value, edges.value);
    await botsStore.saveFlowGraph(token, botId.value, flowId.value, graph);
    toast.success("Draft saved.");
    return true;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "Unable to save draft.";
    toast.error("Unable to save draft.", {
      description: errorMessage.value,
    });
    return false;
  } finally {
    saving.value = false;
  }
}

async function publishFlow() {
  const token = authStore.token;
  if (!token || !flowId.value) {
    errorMessage.value = "Missing auth session or flow id.";
    toast.error("Missing auth session or flow id.");
    return;
  }

  const saved = await saveDraft();
  if (!saved) return;

  publishing.value = true;
  errorMessage.value = "";

  try {
    await botsStore.publishFlow(token, botId.value, flowId.value);
    toast.success("Flow published.");
  } catch (error) {
    if (error instanceof ApiError) {
      const payload = error.payload as
        | { diagnostics?: Array<{ message?: string; nodeId?: string }> }
        | undefined;
      const diagnostics = payload?.diagnostics ?? [];
      if (diagnostics.length > 0) {
        errorMessage.value = diagnostics
          .slice(0, 3)
          .map((entry) =>
            entry.nodeId
              ? `${entry.message ?? "Publish error"} (node: ${entry.nodeId})`
              : (entry.message ?? "Publish error"),
          )
          .join("\n");
      } else {
        errorMessage.value = error.message;
      }
    } else {
      errorMessage.value =
        error instanceof Error ? error.message : "Unable to publish flow.";
    }
    toast.error("Unable to publish flow.", {
      description: errorMessage.value,
    });
  } finally {
    publishing.value = false;
  }
}

onMounted(async () => {
  await loadBuilder();
});
</script>

<template>
  <AppShell
    :title="bot ? `${bot.name} Builder` : 'Bot Builder'"
    subtitle="Design and publish complete bot flows with triggers, actions, AI, and state."
  >
    <template #actions>
      <Button
        variant="outline"
        class="border-slate-200 bg-white shadow-none"
        :disabled="saving || publishing || loading"
        @click="saveDraft"
      >
        <Save class="mr-2 h-4 w-4" />
        {{ saving ? "Saving..." : "Save Draft" }}
      </Button>
      <Button
        class="bg-slate-900 text-white shadow-none hover:bg-slate-800"
        :disabled="saving || publishing || loading"
        @click="publishFlow"
      >
        <Send class="mr-2 h-4 w-4" />
        {{ publishing ? "Publishing..." : "Publish" }}
      </Button>
    </template>

    <div v-if="!bot" class="rounded-xl border border-slate-200 bg-white p-4">
      <p class="text-sm text-slate-700">Bot not found.</p>
      <RouterLink to="/bots">
        <Button
          variant="outline"
          class="mt-3 border-slate-200 bg-white shadow-none"
        >
          Back to Bots
        </Button>
      </RouterLink>
    </div>

    <div
      v-else
      class="space-y-4 rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white to-slate-50/70 p-3 shadow-[0_10px_40px_-24px_rgba(2,6,23,0.35)]"
    >
      <p
        v-if="errorMessage"
        class="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ errorMessage }}
      </p>

      <div class="grid gap-4 xl:h-[calc(100vh-12.5rem)] xl:grid-cols-[minmax(0,1fr)_360px]">
        <section class="flex min-h-0 flex-col gap-4">
          <div class="rounded-xl border border-slate-200/80 bg-white/95 p-3 backdrop-blur-sm">
            <div class="flex items-center gap-2">
              <Workflow class="h-4 w-4 text-slate-600" />
              <p class="text-sm font-semibold text-slate-900">Node Palette</p>
            </div>
            <div class="mt-3 flex flex-wrap items-center gap-2">
              <Button
                v-for="item in palette"
                :key="item.type"
                variant="outline"
                class="h-8 border-slate-200 bg-white px-2.5 text-xs shadow-none hover:border-slate-300 hover:bg-slate-50"
                @click="addNode(item.type)"
              >
                <Plus class="mr-1 h-3.5 w-3.5" />
                {{ item.title }}
              </Button>
            </div>
          </div>

          <div class="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white py-2 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.85)]">
            <VueFlow
              v-model:nodes="nodes"
              v-model:edges="edges"
              :node-types="nodeTypes"
              :default-viewport="{ x: 0, y: 0, zoom: 0.84 }"
              :fit-view-on-init="true"
              :max-zoom="1.6"
              :min-zoom="0.35"
              :snap-to-grid="true"
              :snap-grid="[20, 20]"
              class="studio-flow h-[60vh] w-full xl:h-full"
              @connect="onConnect"
              @node-click="onNodeClick"
            >
              <template #node-teleNode="nodeProps">
                <FlowNodeCard v-bind="nodeProps" />
              </template>

              <Background
                :gap="24"
                :size="1.1"
                color="rgba(15,23,42,0.07)"
                variant="dots"
              />

              <MiniMap
                :height="150"
                :mask-color="'rgba(15, 23, 42, 0.18)'"
                :mask-stroke-color="'rgba(255, 255, 255, 0.85)'"
                :node-color="miniMapColor"
                :node-stroke-color="miniMapStroke"
                :node-stroke-width="2"
                class="rounded-lg border border-slate-200 bg-white p-2 shadow-none"
                pannable
                zoomable
              />

              <Controls
                class="rounded-lg border border-slate-200 bg-white p-1 shadow-none"
                position="bottom-left"
              />
            </VueFlow>
          </div>
        </section>

        <aside class="space-y-4">
          <div class="rounded-xl border border-slate-200/80 bg-white/95 p-3 backdrop-blur-sm">
            <div class="flex items-center justify-between gap-2">
              <p class="text-sm font-semibold text-slate-900">Flow Status</p>
              <Badge
                class="border border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                {{ loading ? "loading" : "ready" }}
              </Badge>
            </div>
            <p class="mt-2 text-xs text-slate-500">
              Triggers {{ triggerCount }} · Actions {{ actionCount }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Condition node evaluates <code>_text</code> with true/false
              routing.
            </p>
          </div>

          <div class="rounded-xl border border-slate-200/80 bg-white/95 p-3 backdrop-blur-sm">
            <p class="text-sm font-semibold text-slate-900">Selected Node</p>
            <p v-if="!selectedNode" class="mt-2 text-sm text-slate-500">
              Click a node to edit its configuration.
            </p>

            <div v-else class="mt-3 space-y-3">
              <div class="space-y-1.5">
                <label
                  class="text-xs font-medium uppercase tracking-[0.12em] text-slate-500"
                >
                  Node Title
                </label>
                <Input
                  v-model:model-value="selectedNode.data.title"
                  class="border-slate-200 bg-white shadow-none"
                />
              </div>

              <div
                v-if="selectedNode.data.nodeType === 'command_trigger'"
                class="space-y-1.5"
              >
                <label class="text-sm font-medium text-slate-700"
                  >Command</label
                >
                <Input
                  v-model:model-value="editorCommand"
                  placeholder="/start"
                  class="border-slate-200 bg-white shadow-none"
                />
              </div>

              <template v-if="selectedNode.data.nodeType === 'message_trigger'">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700"
                    >Pattern</label
                  >
                  <Input
                    v-model:model-value="editorPattern"
                    placeholder="hello"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700"
                    >Match Type</label
                  >
                  <Select v-model:model-value="editorMatchType">
                    <SelectTrigger
                      class="border-slate-200 bg-white shadow-none"
                    >
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent class="shadow-none">
                      <SelectItem value="exact">Exact</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </template>

              <template v-if="selectedNode.data.nodeType === 'callback_trigger'">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700"
                    >Callback Data</label
                  >
                  <Input
                    v-model:model-value="editorCallbackData"
                    placeholder="help"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
              </template>

              <template v-if="selectedNode.data.nodeType === 'send_message'">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700"
                    >Message Text</label
                  >
                  <Textarea
                    v-model:model-value="editorMessageText"
                    class="min-h-[110px] border-slate-200 bg-white shadow-none"
                    placeholder="Welcome!"
                  />
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700"
                    >Parse Mode</label
                  >
                  <Select v-model:model-value="parseModeSelectValue">
                    <SelectTrigger
                      class="border-slate-200 bg-white shadow-none"
                    >
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent class="shadow-none">
                      <SelectItem :value="NONE_PARSE_MODE">None</SelectItem>
                      <SelectItem value="HTML">HTML</SelectItem>
                      <SelectItem value="Markdown">Markdown</SelectItem>
                      <SelectItem value="MarkdownV2">MarkdownV2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">
                    Inline Buttons (one per line)
                  </label>
                  <Textarea
                    v-model:model-value="editorMessageButtons"
                    class="min-h-[90px] border-slate-200 bg-white shadow-none"
                    placeholder="Get Help|help"
                  />
                  <p class="text-xs text-slate-500">
                    Format: <code>Button Text|callback_data</code>
                  </p>
                </div>
              </template>

              <template v-if="selectedNode.data.nodeType === 'send_media'">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700"
                    >Media Type</label
                  >
                  <Select v-model:model-value="editorMediaType">
                    <SelectTrigger class="border-slate-200 bg-white shadow-none">
                      <SelectValue placeholder="Media type" />
                    </SelectTrigger>
                    <SelectContent class="shadow-none">
                      <SelectItem value="photo">Photo</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">URL</label>
                  <Input
                    v-model:model-value="editorMediaUrl"
                    placeholder="https://..."
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">File ID</label>
                  <Input
                    v-model:model-value="editorMediaFileId"
                    placeholder="Telegram file_id"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Caption</label>
                  <Textarea
                    v-model:model-value="editorMediaCaption"
                    class="min-h-[80px] border-slate-200 bg-white shadow-none"
                  />
                </div>
              </template>

              <template v-if="selectedNode.data.nodeType === 'http_request'">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Method</label>
                  <Select v-model:model-value="editorHttpMethod">
                    <SelectTrigger class="border-slate-200 bg-white shadow-none">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent class="shadow-none">
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">URL</label>
                  <Input
                    v-model:model-value="editorHttpUrl"
                    placeholder="https://api.example.com"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Headers JSON</label>
                  <Textarea
                    v-model:model-value="editorHttpHeaders"
                    class="min-h-[90px] border-slate-200 bg-white font-mono text-xs shadow-none"
                    placeholder='{"Authorization":"Bearer {{token}}"}'
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Body</label>
                  <Textarea
                    v-model:model-value="editorHttpBody"
                    class="min-h-[80px] border-slate-200 bg-white shadow-none"
                    placeholder='{"query":"{{_text}}"}'
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Response Variable</label>
                  <Input
                    v-model:model-value="editorHttpResponseVariable"
                    placeholder="http_response"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
              </template>

              <template v-if="selectedNode.data.nodeType === 'ai_prompt'">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Model</label>
                  <Input
                    v-model:model-value="editorAiModel"
                    placeholder="gpt-4o-mini"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">System Prompt</label>
                  <Textarea
                    v-model:model-value="editorAiSystemPrompt"
                    class="min-h-[80px] border-slate-200 bg-white shadow-none"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">User Prompt Template</label>
                  <Textarea
                    v-model:model-value="editorAiUserPrompt"
                    class="min-h-[100px] border-slate-200 bg-white shadow-none"
                    placeholder="Summarize {{_text}}"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Response Variable</label>
                  <Input
                    v-model:model-value="editorAiResponseVariable"
                    placeholder="ai_response"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
              </template>

              <template v-if="selectedNode.data.nodeType === 'condition'">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700"
                    >Operator</label
                  >
                  <Select v-model:model-value="editorConditionOperator">
                    <SelectTrigger
                      class="border-slate-200 bg-white shadow-none"
                    >
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent class="shadow-none">
                      <SelectItem value="eq">Equals</SelectItem>
                      <SelectItem value="neq">Not Equals</SelectItem>
                      <SelectItem value="contains">Contains</SelectItem>
                      <SelectItem value="gt">Greater Than</SelectItem>
                      <SelectItem value="lt">Lower Than</SelectItem>
                      <SelectItem value="regex">Regex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">
                    Comparison Value
                  </label>
                  <Input
                    v-model:model-value="editorConditionValue"
                    placeholder="help"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
                <p class="text-xs text-slate-500">
                  Connect two outgoing edges from this node. First is
                  auto-labeled
                  <code>true</code>, second is <code>false</code>.
                </p>
              </template>

              <template v-if="selectedNode.data.nodeType === 'set_variable'">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Variable</label>
                  <Input
                    v-model:model-value="editorSetVariableName"
                    placeholder="customer_name"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Value Expression</label>
                  <Input
                    v-model:model-value="editorSetVariableExpr"
                    placeholder="{{_text}}"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
              </template>

              <template v-if="selectedNode.data.nodeType === 'wait_for_input'">
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Variable</label>
                  <Input
                    v-model:model-value="editorWaitVariable"
                    placeholder="user_input"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-sm font-medium text-slate-700">Timeout (secs)</label>
                  <Input
                    v-model:model-value="editorWaitTimeout"
                    placeholder="300"
                    class="border-slate-200 bg-white shadow-none"
                  />
                </div>
              </template>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200/80 bg-white/95 p-3 backdrop-blur-sm">
            <p class="text-sm font-semibold text-slate-900">Node Guide</p>
            <ScrollArea class="mt-2 h-44 pr-3">
              <ul class="space-y-2 text-xs text-slate-600">
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>Command Trigger</strong>: starts on commands like
                  /start.
                </li>
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>Message Trigger</strong>: starts on matching text
                  patterns.
                </li>
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>Callback Trigger</strong>: starts on inline button callbacks.
                </li>
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>Send Message</strong>: replies with text and inline
                  buttons.
                </li>
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>Send Media</strong>: sends media from URL or Telegram file id.
                </li>
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>HTTP Request</strong>: fetches API data and stores response variable.
                </li>
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>AI Prompt</strong>: runs LLM prompt and stores answer.
                </li>
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>Condition</strong>: checks <code>_text</code> and
                  branches.
                </li>
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>Set Variable</strong>: writes derived state values.
                </li>
                <li class="rounded border border-slate-200 px-2 py-1.5">
                  <strong>Wait For Input</strong>: pauses execution until next user message.
                </li>
              </ul>
            </ScrollArea>
          </div>
        </aside>
      </div>
    </div>
  </AppShell>
</template>
