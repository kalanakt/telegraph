<script setup lang="ts">
import FlowNodeCard, {
  type StudioNodeData,
} from "@/components/flow/FlowNodeCard.vue";
import AppShell from "@/components/layout/AppShell.vue";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type BotFlowEdge,
  type BotFlowNode,
  type BotNodeKind,
  useBotsStore,
} from "@/stores/bots";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { MarkerType, VueFlow, type NodeMouseEvent } from "@vue-flow/core";
import { CirclePlay, Plus, Save, Send, Workflow } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";

interface StudioEdge extends Omit<BotFlowEdge, "markerEnd"> {
  markerEnd: {
    type: MarkerType;
    color: string;
  };
}

interface MiniMapNodeLike {
  id: string;
  data?: Partial<StudioNodeData>;
}

const route = useRoute();
const botsStore = useBotsStore();

const botId = computed(() => String(route.params["botId"] ?? ""));
const bot = computed(() => botsStore.getBotById(botId.value));

const nodes = ref<BotFlowNode[]>([]);
const edges = ref<StudioEdge[]>([]);
const selectedNodeId = ref("");
const infoMessage = ref("");

const nodeTypes = {
  teleNode: FlowNodeCard,
};

const nodeKit: Array<{
  kind: BotNodeKind;
  title: string;
  subtitle: string;
}> = [
  {
    kind: "trigger",
    title: "Trigger",
    subtitle: "Entry point for messages/commands",
  },
  {
    kind: "message",
    title: "Message",
    subtitle: "Send text and keyboard options",
  },
  {
    kind: "condition",
    title: "Condition",
    subtitle: "Route by rules and user properties",
  },
  {
    kind: "ai",
    title: "AI Step",
    subtitle: "Intent extraction and handoff decision",
  },
  {
    kind: "action",
    title: "Action",
    subtitle: "Webhook, CRM, payment, or external call",
  },
];

const nodeBlueprints: Record<
  BotNodeKind,
  Pick<StudioNodeData, "title" | "subtitle" | "chips" | "metric">
> = {
  trigger: {
    title: "/start Trigger",
    subtitle: "Runs when user opens conversation.",
    chips: ["entry", "command"],
    metric: "0 runs",
  },
  message: {
    title: "Reply Message",
    subtitle: "Prompt user with quick action options.",
    chips: ["reply", "buttons"],
    metric: "0 runs",
  },
  condition: {
    title: "Condition Branch",
    subtitle: "Split flow based on user input or metadata.",
    chips: ["branch", "rules"],
    metric: "0 runs",
  },
  ai: {
    title: "AI Classifier",
    subtitle: "Classify intent before next action.",
    chips: ["intent", "confidence"],
    metric: "0 runs",
  },
  action: {
    title: "Action Call",
    subtitle: "Execute webhook or internal action.",
    chips: ["webhook", "integration"],
    metric: "0 runs",
  },
};

function cloneNodes(input: BotFlowNode[]): BotFlowNode[] {
  return input.map((node) => ({
    ...node,
    position: { ...node.position },
    data: {
      ...node.data,
      chips: [...node.data.chips],
    },
  }));
}

function cloneEdges(input: BotFlowEdge[]): StudioEdge[] {
  return input.map((edge) => ({
    ...edge,
    markerEnd: {
      type: edge.markerEnd.type as MarkerType,
      color: edge.markerEnd.color,
    },
    style: { ...edge.style },
  }));
}

watch(
  bot,
  (value) => {
    if (!value) return;
    nodes.value = cloneNodes(value.nodes);
    edges.value = cloneEdges(value.edges);
    selectedNodeId.value = value.nodes[0]?.id ?? "";
  },
  { immediate: true },
);

const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null;
  return nodes.value.find((node) => node.id === selectedNodeId.value) ?? null;
});

const selectedNodeKindValue = computed(
  () => selectedNode.value?.data.kind ?? "message",
);
const selectedNodeChipsValue = computed(
  () => selectedNode.value?.data.chips.join(", ") ?? "",
);

function isNodeKind(value: string): value is BotNodeKind {
  return ["trigger", "message", "condition", "ai", "action"].includes(value);
}

function updateSelectedNodeKind(value: string | number): void {
  if (!selectedNode.value) return;
  const nextValue = String(value);
  if (!isNodeKind(nextValue)) return;
  selectedNode.value.data.kind = nextValue;
}

function updateSelectedNodeChips(value: string | number): void {
  if (!selectedNode.value) return;
  selectedNode.value.data.chips = String(value)
    .split(",")
    .map((chip) => chip.trim())
    .filter(Boolean);
}

function makeEdge(id: string, source: string, target: string): StudioEdge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#334155" },
    style: { stroke: "#334155", opacity: 0.65, strokeWidth: 1.4 },
  };
}

function addNode(kind: BotNodeKind): void {
  const base = nodeBlueprints[kind];
  const id = `${kind}-${Date.now()}`;
  const index = nodes.value.length;
  const node: BotFlowNode = {
    id,
    type: "teleNode",
    position: {
      x: 220 + (index % 3) * 300,
      y: 120 + Math.floor(index / 3) * 180,
    },
    data: {
      kind,
      title: base.title,
      subtitle: base.subtitle,
      chips: [...base.chips],
      metric: base.metric,
    },
  };

  nodes.value = [...nodes.value, node];
  selectedNodeId.value = node.id;

  const source = nodes.value.at(-2)?.id;
  if (source) {
    edges.value = [
      ...edges.value,
      makeEdge(`edge-${source}-${id}`, source, id),
    ];
  }
}

function onConnect(connection: {
  source?: string | null;
  target?: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}): void {
  if (!connection.source || !connection.target) return;

  const edge = makeEdge(
    `edge-${connection.source}-${connection.target}-${Date.now()}`,
    connection.source,
    connection.target,
  );
  edge.sourceHandle = connection.sourceHandle;
  edge.targetHandle = connection.targetHandle;
  edges.value = [...edges.value, edge];
}

function onNodeClick(payload: NodeMouseEvent): void {
  selectedNodeId.value = payload.node.id;
}

function miniMapColor(node: MiniMapNodeLike): string {
  const kind = node.data?.kind;
  if (kind === "trigger") return "#f59e0b";
  if (kind === "message") return "#0ea5e9";
  if (kind === "condition") return "#d946ef";
  if (kind === "ai") return "#10b981";
  if (kind === "action") return "#6366f1";
  return "#64748b";
}

function miniMapStroke(node: MiniMapNodeLike): string {
  return node.id === selectedNodeId.value ? "#0f172a" : "#cbd5e1";
}

function saveDraft() {
  if (!bot.value) return;
  botsStore.saveFlow(bot.value.id, nodes.value, edges.value);
  infoMessage.value = "Draft flow saved.";
}

function publishFlow() {
  if (!bot.value) return;
  botsStore.saveFlow(bot.value.id, nodes.value, edges.value);
  botsStore.publishBot(bot.value.id);
  infoMessage.value = "Bot flow published.";
}
</script>

<template>
  <AppShell
    :title="bot ? `${bot.name} Builder` : 'Bot Builder'"
    subtitle="Add triggers, conditions, and actions to design your Telegram bot."
  >
    <template #actions>
      <Button
        variant="outline"
        class="border-slate-200 bg-white shadow-none"
        @click="saveDraft"
        :disabled="!bot"
      >
        <Save class="mr-2 h-4 w-4" />
        Save Draft
      </Button>
      <Button
        variant="outline"
        class="border-slate-200 bg-white shadow-none"
        :disabled="!bot"
      >
        <CirclePlay class="mr-2 h-4 w-4" />
        Simulate
      </Button>
      <Button
        class="bg-slate-900 text-white shadow-none hover:bg-slate-800"
        @click="publishFlow"
        :disabled="!bot"
      >
        <Send class="mr-2 h-4 w-4" />
        Publish
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

    <div v-else class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <div class="flex items-center gap-2">
            <Workflow class="h-4 w-4 text-slate-600" />
            <p class="text-sm font-semibold text-slate-900">Node Palette</p>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <Button
              v-for="item in nodeKit"
              :key="item.kind"
              variant="outline"
              class="h-8 border-slate-200 bg-white px-2.5 text-xs shadow-none"
              @click="addNode(item.kind)"
            >
              <Plus class="mr-1 h-3.5 w-3.5" />
              {{ item.title }}
            </Button>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white">
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
            class="studio-flow h-[62vh] min-h-[530px] w-full"
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
        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <div class="flex items-center justify-between gap-2">
            <p class="text-sm font-semibold text-slate-900">Flow Status</p>
            <Badge
              :class="
                bot.status === 'published'
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-amber-200 bg-amber-50 text-amber-700'
              "
            >
              {{ bot.status }}
            </Badge>
          </div>
          <p class="mt-2 text-xs text-slate-500">
            Triggers {{ bot.triggerCount }} · Actions {{ bot.actionCount }}
          </p>
          <p
            v-if="infoMessage"
            class="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
          >
            {{ infoMessage }}
          </p>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-3">
          <p class="text-sm font-semibold text-slate-900">Selected Node</p>

          <div v-if="selectedNode" class="mt-3 space-y-3">
            <div class="space-y-1.5">
              <label
                class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Node Label
              </label>
              <Input
                :model-value="selectedNode.data.title"
                class="border-slate-200 bg-white shadow-none"
                @update:model-value="selectedNode.data.title = String($event)"
              />
            </div>

            <div class="space-y-1.5">
              <label
                class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Node Type
              </label>
              <Select
                :model-value="selectedNodeKindValue"
                @update:model-value="updateSelectedNodeKind"
              >
                <SelectTrigger class="border-slate-200 bg-white shadow-none">
                  <SelectValue placeholder="Select node type" />
                </SelectTrigger>
                <SelectContent class="shadow-none">
                  <SelectItem value="trigger">Trigger</SelectItem>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="condition">Condition</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="action">Action</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-1.5">
              <label
                class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Description
              </label>
              <Textarea
                :model-value="selectedNode.data.subtitle"
                class="min-h-[84px] border-slate-200 bg-white shadow-none"
                @update:model-value="selectedNode.data.subtitle = $event"
              />
            </div>

            <div class="space-y-1.5">
              <label
                class="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                Chips
              </label>
              <Input
                :model-value="selectedNodeChipsValue"
                class="border-slate-200 bg-white shadow-none"
                @update:model-value="updateSelectedNodeChips"
              />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white">
          <div class="border-b border-slate-200 px-3 py-2">
            <p class="text-sm font-semibold text-slate-900">Node List</p>
          </div>
          <ScrollArea class="h-[240px] px-3 py-3">
            <button
              v-for="node in nodes"
              :key="node.id"
              :class="
                node.id === selectedNodeId
                  ? 'mb-2 w-full rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-left text-white'
                  : 'mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-slate-700'
              "
              @click="selectedNodeId = node.id"
            >
              <p class="text-sm font-semibold">{{ node.data.title }}</p>
              <p
                :class="
                  node.id === selectedNodeId
                    ? 'mt-0.5 text-xs text-slate-300'
                    : 'mt-0.5 text-xs text-slate-500'
                "
              >
                {{ node.data.subtitle }}
              </p>
            </button>
          </ScrollArea>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.studio-flow {
  background:
    radial-gradient(circle at 8% 10%, rgb(14 165 233 / 0.05), transparent 34%),
    linear-gradient(180deg, rgb(248 250 252), rgb(255 255 255));
}

:deep(.vue-flow__edge-path) {
  stroke-linecap: round;
}

:deep(.vue-flow__controls) {
  box-shadow: none;
}

:deep(.vue-flow__controls-button) {
  border-color: rgb(226 232 240 / 0.9);
  background: rgb(255 255 255);
  color: rgb(15 23 42);
  box-shadow: none;
}

:deep(.vue-flow__controls-button:hover) {
  background: rgb(248 250 252);
}

:deep(.vue-flow__minimap) {
  box-shadow: none;
}

:deep(.vue-flow__minimap-mask) {
  rx: 10;
  ry: 10;
}
</style>
