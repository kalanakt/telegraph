<script setup lang="ts">
import FlowNodeCard, {
  type StudioNodeData,
} from "@/components/flow/FlowNodeCard.vue";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import { MarkerType, VueFlow, type NodeMouseEvent } from "@vue-flow/core";
import {
  Bot,
  BrainCircuit,
  CirclePlay,
  Compass,
  Gauge,
  Layers3,
  Menu,
  Plus,
  Rocket,
  Send,
  Sparkles,
  WandSparkles,
} from "lucide-vue-next";
import { computed, ref } from "vue";

interface StudioNode {
  id: string;
  type: "teleNode";
  position: { x: number; y: number };
  data: StudioNodeData;
}

interface MiniMapNodeLike {
  id: string;
  data?: Partial<StudioNodeData>;
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
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

type StudioNodeKind = StudioNodeData["kind"];

const projectName = ref("Concierge Commerce Bot");
const mobileSheetOpen = ref(false);

const nodeKit: Array<{
  kind: StudioNodeKind;
  title: string;
  subtitle: string;
}> = [
  {
    kind: "trigger",
    title: "New Trigger",
    subtitle: "Command or callback entry point",
  },
  {
    kind: "message",
    title: "Message Block",
    subtitle: "Text, media, keyboard, quick replies",
  },
  {
    kind: "condition",
    title: "Condition Split",
    subtitle: "Branch by profile, intent, or value",
  },
  {
    kind: "ai",
    title: "AI Decision",
    subtitle: "Intent extraction and smart routing",
  },
  {
    kind: "action",
    title: "Action Node",
    subtitle: "CRM sync, tag, payment, or webhook",
  },
];

const nodeBlueprints: Record<
  StudioNodeKind,
  Pick<StudioNodeData, "title" | "subtitle" | "chips" | "metric">
> = {
  trigger: {
    title: "/start + Deep Link",
    subtitle: "Accepts campaign parameters and locale context.",
    chips: ["Entry", "Campaign", "Locale"],
    metric: "1.2k starts/day",
  },
  message: {
    title: "Welcome Story Card",
    subtitle: "Sends rich intro with two personalized CTA options.",
    chips: ["Rich text", "Buttons", "Personalized"],
    metric: "82% tap-through",
  },
  condition: {
    title: "VIP Qualification",
    subtitle: "Routes by CRM tier, spend band, and activity score.",
    chips: ["CRM tier", "Spend", "Activity"],
    metric: "3 active branches",
  },
  ai: {
    title: "Intent Composer",
    subtitle: "Extracts buying intent and preferred fulfillment mode.",
    chips: ["Intent", "Confidence", "Fallback"],
    metric: "94% precision",
  },
  action: {
    title: "Notify Sales Pod",
    subtitle: "Publishes lead summary and schedules callback slots.",
    chips: ["Webhook", "Slack", "Calendar"],
    metric: "11 sec avg",
  },
};

const nodes = ref<StudioNode[]>([
  {
    id: "trigger-start",
    type: "teleNode",
    position: { x: 40, y: 250 },
    data: {
      kind: "trigger",
      title: "/start + Campaign Tag",
      subtitle: "Captures campaign source and user locale at first touch.",
      chips: ["Command", "Source", "Locale"],
      metric: "1.2k starts/day",
    },
  },
  {
    id: "message-welcome",
    type: "teleNode",
    position: { x: 360, y: 170 },
    data: {
      kind: "message",
      title: "Premium Welcome Story",
      subtitle: "Greets with dynamic offer and smart quick replies.",
      chips: ["Story", "Offer", "Quick replies"],
      metric: "82% CTR",
    },
  },
  {
    id: "condition-tier",
    type: "teleNode",
    position: { x: 700, y: 160 },
    data: {
      kind: "condition",
      title: "Segment by Tier",
      subtitle: "Branches users into VIP, warm lead, or nurture routes.",
      chips: ["VIP", "Warm lead", "Nurture"],
      metric: "3 branches",
    },
  },
  {
    id: "ai-intent",
    type: "teleNode",
    position: { x: 1030, y: 90 },
    data: {
      kind: "ai",
      title: "Intent + Tone Analyzer",
      subtitle: "Understands urgency, product intent, and reply style.",
      chips: ["Intent", "Urgency", "Tone"],
      metric: "94% confidence",
    },
  },
  {
    id: "action-hand-off",
    type: "teleNode",
    position: { x: 1030, y: 315 },
    data: {
      kind: "action",
      title: "Sales Pod Handoff",
      subtitle: "Pushes lead card and reserves callback time.",
      chips: ["Lead card", "Webhook", "Follow-up"],
      metric: "11 sec handoff",
    },
  },
]);

function makeEdge(id: string, source: string, target: string): StudioEdge {
  return {
    id,
    source,
    target,
    type: "smoothstep",
    animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: "#0f172a" },
    style: { stroke: "#0f172a", opacity: 0.45, strokeWidth: 1.65 },
  };
}

const edges = ref<StudioEdge[]>([
  makeEdge("e-start-welcome", "trigger-start", "message-welcome"),
  makeEdge("e-welcome-tier", "message-welcome", "condition-tier"),
  makeEdge("e-tier-ai", "condition-tier", "ai-intent"),
  makeEdge("e-tier-action", "condition-tier", "action-hand-off"),
]);

const selectedNodeId = ref(nodes.value[1]?.id ?? "");

function lookupNodeById(id: string): StudioNode | null {
  for (const node of nodes.value) {
    if (node.id === id) return node;
  }
  return null;
}

const selectedNode = computed<StudioNode | null>(() => {
  if (!selectedNodeId.value) return null;
  return lookupNodeById(selectedNodeId.value);
});

const selectedNodeKindValue = computed(
  () => selectedNode.value?.data.kind ?? "message",
);
const selectedNodeChipsValue = computed(
  () => selectedNode.value?.data.chips.join(", ") ?? "",
);

const dashboardStats = [
  {
    label: "Completion",
    value: "68.2%",
    note: "+4.1% this week",
    icon: Gauge,
  },
  {
    label: "Active Nodes",
    value: `${nodes.value.length}`,
    note: "2 branches in review",
    icon: Layers3,
  },
  {
    label: "Avg Response",
    value: "1.4s",
    note: "P95 under target",
    icon: Rocket,
  },
];

const previewMessages = [
  {
    role: "bot",
    text: "Welcome back, Aanya. Want us to curate options for your next launch?",
    stamp: "09:41",
  },
  {
    role: "user",
    text: "Yes, show options under $120 and fast shipping.",
    stamp: "09:42",
  },
  {
    role: "bot",
    text: "Perfect. I found 4 options with next-day dispatch. Should I reserve the top 2?",
    stamp: "09:42",
  },
];

const nodeTypes = {
  teleNode: FlowNodeCard,
};

function isNodeKind(value: string): value is StudioNodeKind {
  return ["trigger", "message", "condition", "ai", "action"].includes(value);
}

function updateSelectedNodeKind(value: string): void {
  if (!selectedNode.value) return;
  if (!isNodeKind(value)) return;
  selectedNode.value.data.kind = value;
}

function updateSelectedNodeChips(value: string | number): void {
  if (!selectedNode.value) return;
  const next = String(value)
    .split(",")
    .map((chip) => chip.trim())
    .filter(Boolean);
  selectedNode.value.data.chips = next;
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

function onConnect(connection: {
  source?: string | null;
  target?: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}): void {
  if (!connection.source || !connection.target) return;

  const id = `e-${connection.source}-${connection.target}-${Date.now()}`;
  const edge = makeEdge(id, connection.source, connection.target);
  edge.sourceHandle = connection.sourceHandle;
  edge.targetHandle = connection.targetHandle;
  edges.value = [...edges.value, edge];
}

function onNodeClick(payload: NodeMouseEvent): void {
  selectedNodeId.value = payload.node.id;
}

function addNode(kind: StudioNodeKind): void {
  const base = nodeBlueprints[kind];
  const id = `${kind}-${Date.now()}`;
  const index = nodes.value.length;
  const node: StudioNode = {
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
      makeEdge(`e-${source}-${node.id}`, source, node.id),
    ];
  }
}

function focusNode(id: string): void {
  selectedNodeId.value = id;
  mobileSheetOpen.value = true;
}
</script>

<template>
  <div class="relative min-h-screen overflow-x-hidden pb-8 text-slate-900">
    <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        class="absolute -top-52 right-[-8rem] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.25),_transparent_66%)] blur-2xl"
      />
      <div
        class="absolute -left-20 top-52 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(249,115,22,0.24),_transparent_68%)] blur-2xl"
      />
      <div
        class="absolute bottom-[-12rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(16,185,129,0.2),_transparent_70%)] blur-3xl"
      />
    </div>

    <main
      class="mx-auto max-w-[1680px] space-y-5 px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8"
    >
      <section
        class="animate-fade-up rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur-xl"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div class="flex min-w-[16rem] items-center gap-3">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-lg"
            >
              <Bot class="h-6 w-6" />
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.22em] text-slate-500">
                Telegraph Studio
              </p>
              <h1 class="text-2xl font-semibold tracking-tight">
                {{ projectName }}
              </h1>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              class="border border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              Live Shadow Test
            </Badge>
            <Badge
              variant="secondary"
              class="border border-sky-200 bg-sky-50 text-sky-700"
            >
              Telegram Runtime v2.8
            </Badge>
            <Button variant="outline" class="border-white/80 bg-white/70">
              <CirclePlay class="mr-2 h-4 w-4" />
              Simulate
            </Button>
            <Button class="bg-slate-900 text-white hover:bg-slate-800">
              <Send class="mr-2 h-4 w-4" />
              Publish Flow
            </Button>
            <Sheet v-model:open="mobileSheetOpen">
              <SheetTrigger as-child>
                <Button
                  variant="outline"
                  size="icon"
                  class="border-white/80 bg-white/70 xl:hidden"
                >
                  <Menu class="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                class="w-[92vw] max-w-md overflow-y-auto border-white/60 bg-white/95 backdrop-blur-xl"
              >
                <SheetHeader>
                  <SheetTitle>Flow Assistant Panel</SheetTitle>
                  <SheetDescription
                    >Edit selected node and add new blocks.</SheetDescription
                  >
                </SheetHeader>

                <div class="mt-6 space-y-5">
                  <Card class="border-slate-200/80 bg-white/90">
                    <CardHeader class="pb-3">
                      <CardTitle class="text-base">Quick Add</CardTitle>
                    </CardHeader>
                    <CardContent class="grid gap-2">
                      <Button
                        v-for="item in nodeKit"
                        :key="`mobile-${item.kind}`"
                        variant="outline"
                        class="justify-start border-slate-200 bg-white"
                        @click="addNode(item.kind)"
                      >
                        <Plus class="mr-2 h-4 w-4" />
                        {{ item.title }}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card class="border-slate-200/80 bg-white/90">
                    <CardHeader class="pb-3">
                      <CardTitle class="text-base">Selected Node</CardTitle>
                      <CardDescription
                        >Node metadata and runtime hints</CardDescription
                      >
                    </CardHeader>
                    <CardContent v-if="selectedNode" class="space-y-4">
                      <div class="space-y-2">
                        <label
                          class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                        >
                          Label
                        </label>
                        <Input
                          :model-value="selectedNode.data.title"
                          class="border-slate-200 bg-white"
                          @update:model-value="
                            selectedNode.data.title = String($event)
                          "
                        />
                      </div>
                      <div class="space-y-2">
                        <label
                          class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                        >
                          Node Type
                        </label>
                        <Select
                          :model-value="selectedNodeKindValue"
                          @update:model-value="updateSelectedNodeKind"
                        >
                          <SelectTrigger class="border-slate-200 bg-white">
                            <SelectValue placeholder="Select node type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trigger">Trigger</SelectItem>
                            <SelectItem value="message">Message</SelectItem>
                            <SelectItem value="condition">Condition</SelectItem>
                            <SelectItem value="ai">AI</SelectItem>
                            <SelectItem value="action">Action</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div class="space-y-2">
                        <label
                          class="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500"
                        >
                          Description
                        </label>
                        <Textarea
                          :model-value="selectedNode.data.subtitle"
                          class="min-h-[90px] border-slate-200 bg-white"
                          @update:model-value="
                            selectedNode.data.subtitle = $event
                          "
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div
            v-for="stat in dashboardStats"
            :key="stat.label"
            class="rounded-2xl border border-white/60 bg-white/70 p-3.5 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-xs uppercase tracking-[0.18em] text-slate-500">
                  {{ stat.label }}
                </p>
                <p
                  class="mt-1 text-2xl font-semibold tracking-tight text-slate-900"
                >
                  {{ stat.value }}
                </p>
                <p class="mt-1 text-xs text-slate-500">{{ stat.note }}</p>
              </div>
              <div class="rounded-lg bg-slate-900 p-2 text-white">
                <component :is="stat.icon" class="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        class="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_320px]"
      >
        <aside class="hidden space-y-5 lg:block">
          <Card class="border-white/60 bg-white/75 shadow-lg backdrop-blur-xl">
            <CardHeader class="pb-4">
              <CardTitle class="flex items-center gap-2 text-base">
                <Sparkles class="h-4 w-4 text-sky-600" />
                Flow Kit
              </CardTitle>
              <CardDescription
                >Drop high-quality blocks quickly.</CardDescription
              >
            </CardHeader>
            <CardContent class="space-y-2.5">
              <button
                v-for="item in nodeKit"
                :key="item.kind"
                class="group w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                @click="addNode(item.kind)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-slate-800">
                      {{ item.title }}
                    </p>
                    <p class="mt-1 text-xs leading-relaxed text-slate-500">
                      {{ item.subtitle }}
                    </p>
                  </div>
                  <Plus
                    class="mt-0.5 h-4 w-4 text-slate-400 transition group-hover:text-slate-700"
                  />
                </div>
              </button>
            </CardContent>
          </Card>

          <Card class="border-white/60 bg-white/75 shadow-lg backdrop-blur-xl">
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Runtime Status</CardTitle>
              <CardDescription>Latest pipeline checkpoints</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3 text-sm">
              <div class="rounded-lg bg-slate-900 px-3 py-2 text-white">
                <p class="text-xs uppercase tracking-[0.16em] text-slate-300">
                  Deployment
                </p>
                <p class="mt-1 font-semibold">Green on us-east runtime</p>
              </div>
              <div class="rounded-lg bg-sky-50 px-3 py-2 text-sky-900">
                <p class="text-xs uppercase tracking-[0.16em] text-sky-600">
                  Queue Health
                </p>
                <p class="mt-1 font-semibold">
                  BullMQ pending: 23 / processing: 4
                </p>
              </div>
              <div class="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
                <p class="text-xs uppercase tracking-[0.16em] text-amber-600">
                  Attention
                </p>
                <p class="mt-1 font-semibold">1 node missing fallback reply</p>
              </div>
            </CardContent>
          </Card>
        </aside>

        <div class="space-y-5">
          <Card
            class="canvas-shell overflow-hidden border-white/60 bg-white/75 shadow-xl backdrop-blur-xl"
          >
            <CardContent class="relative p-0">
              <div
                class="absolute left-3 top-3 z-20 hidden items-center gap-2 rounded-xl border border-white/70 bg-white/80 px-2 py-1.5 shadow-sm sm:flex"
              >
                <Compass class="h-4 w-4 text-sky-600" />
                <span class="text-xs font-medium text-slate-700"
                  >Drag nodes to shape the journey</span
                >
              </div>
              <div class="absolute right-3 top-3 z-20 w-[180px]">
                <Select default-value="premium-customers">
                  <SelectTrigger
                    class="h-8 border-white/80 bg-white/85 text-xs shadow-sm"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium-customers"
                      >Premium Customers</SelectItem
                    >
                    <SelectItem value="new-leads">New Leads</SelectItem>
                    <SelectItem value="reactivation"
                      >Reactivation Segment</SelectItem
                    >
                  </SelectContent>
                </Select>
              </div>

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
                class="studio-flow h-[62vh] min-h-[520px] w-full"
                @connect="onConnect"
                @node-click="onNodeClick"
              >
                <template #node-teleNode="nodeProps">
                  <FlowNodeCard v-bind="nodeProps" />
                </template>

                <Background
                  :gap="22"
                  :size="1.15"
                  color="rgba(15,23,42,0.08)"
                  variant="dots"
                />
                <Background
                  :gap="140"
                  :line-width="1"
                  color="rgba(14,165,233,0.09)"
                  variant="lines"
                />

                <MiniMap
                  :height="152"
                  :mask-color="'rgba(15, 23, 42, 0.32)'"
                  :mask-stroke-color="'rgba(255, 255, 255, 0.68)'"
                  :node-color="miniMapColor"
                  :node-stroke-color="miniMapStroke"
                  :node-stroke-width="2"
                  class="rounded-xl border border-white/60 bg-white/80 p-2 shadow-md backdrop-blur"
                  pannable
                  zoomable
                />

                <Controls
                  class="rounded-xl border border-white/70 bg-white/80 p-1 shadow-md backdrop-blur"
                  position="bottom-left"
                />
              </VueFlow>
            </CardContent>
          </Card>

          <Card class="border-white/60 bg-white/75 shadow-lg backdrop-blur-xl">
            <CardHeader class="pb-3">
              <CardTitle class="flex items-center gap-2 text-base">
                <WandSparkles class="h-4 w-4 text-indigo-600" />
                Conversation Preview
              </CardTitle>
              <CardDescription
                >Live simulation of the selected path tone.</CardDescription
              >
            </CardHeader>
            <CardContent class="space-y-3">
              <div
                v-for="(message, idx) in previewMessages"
                :key="`${message.role}-${idx}`"
                :class="
                  message.role === 'bot'
                    ? 'mr-8 rounded-2xl rounded-tl-md bg-slate-900 px-4 py-3 text-sm text-white'
                    : 'ml-8 rounded-2xl rounded-tr-md bg-sky-50 px-4 py-3 text-sm text-slate-800'
                "
              >
                <p class="leading-relaxed">{{ message.text }}</p>
                <p
                  :class="
                    message.role === 'bot'
                      ? 'mt-1 text-right text-[11px] text-slate-300'
                      : 'mt-1 text-right text-[11px] text-slate-400'
                  "
                >
                  {{ message.stamp }}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside class="hidden space-y-5 xl:block">
          <Card class="border-white/60 bg-white/75 shadow-lg backdrop-blur-xl">
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Node Inspector</CardTitle>
              <CardDescription
                >Precision controls for the selected block.</CardDescription
              >
            </CardHeader>

            <CardContent v-if="selectedNode" class="space-y-4">
              <div
                class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
              >
                <Avatar class="h-9 w-9 border border-slate-200">
                  <AvatarFallback class="bg-slate-900 text-xs text-white"
                    >TB</AvatarFallback
                  >
                </Avatar>
                <div>
                  <p class="text-sm font-semibold text-slate-800">
                    Flow Maintainer
                  </p>
                  <p class="text-xs text-slate-500">
                    Publishing in staged mode
                  </p>
                </div>
              </div>

              <Separator />

              <div class="space-y-2">
                <label
                  class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  Node Label
                </label>
                <Input
                  :model-value="selectedNode.data.title"
                  class="border-slate-200 bg-white"
                  @update:model-value="selectedNode.data.title = String($event)"
                />
              </div>

              <div class="space-y-2">
                <label
                  class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  Node Type
                </label>
                <Select
                  :model-value="selectedNodeKindValue"
                  @update:model-value="updateSelectedNodeKind"
                >
                  <SelectTrigger class="border-slate-200 bg-white">
                    <SelectValue placeholder="Select node type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trigger">Trigger</SelectItem>
                    <SelectItem value="message">Message</SelectItem>
                    <SelectItem value="condition">Condition</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="action">Action</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="space-y-2">
                <label
                  class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  Description
                </label>
                <Textarea
                  :model-value="selectedNode.data.subtitle"
                  class="min-h-[86px] border-slate-200 bg-white"
                  @update:model-value="selectedNode.data.subtitle = $event"
                />
              </div>

              <div class="space-y-2">
                <label
                  class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                >
                  Chips (comma separated)
                </label>
                <Input
                  :model-value="selectedNodeChipsValue"
                  class="border-slate-200 bg-white"
                  @update:model-value="updateSelectedNodeChips"
                />
              </div>

              <div
                class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5"
              >
                <p class="text-xs uppercase tracking-[0.16em] text-slate-500">
                  Runtime metric
                </p>
                <Input
                  :model-value="selectedNode.data.metric"
                  class="mt-2 border-slate-200 bg-white"
                  @update:model-value="
                    selectedNode.data.metric = String($event)
                  "
                />
              </div>
            </CardContent>
          </Card>

          <Card class="border-white/60 bg-white/75 shadow-lg backdrop-blur-xl">
            <CardHeader class="pb-3">
              <CardTitle class="text-base">Node Rail</CardTitle>
              <CardDescription
                >Jump to any block in the active graph.</CardDescription
              >
            </CardHeader>
            <CardContent class="p-0">
              <ScrollArea class="h-[280px] px-4 pb-4">
                <div class="space-y-2 pt-1">
                  <button
                    v-for="node in nodes"
                    :key="`rail-${node.id}`"
                    :class="
                      node.id === selectedNodeId
                        ? 'w-full rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-left text-white shadow'
                        : 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-slate-700 transition hover:border-slate-300'
                    "
                    @click="focusNode(node.id)"
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
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  </div>
</template>

<style scoped>
.canvas-shell {
  animation: rise-in 520ms cubic-bezier(0.21, 1.05, 0.5, 1) both;
}

:deep(.vue-flow__edge-path) {
  stroke-linecap: round;
}

:deep(.vue-flow__pane) {
  cursor: crosshair;
}

:deep(.vue-flow__controls-button) {
  border-color: rgb(226 232 240 / 0.9);
  background: rgb(255 255 255 / 0.92);
  color: rgb(15 23 42);
}

:deep(.vue-flow__controls-button:hover) {
  background: rgb(241 245 249 / 1);
}

:deep(.vue-flow__minimap-mask) {
  rx: 12;
  ry: 12;
}

@keyframes rise-in {
  0% {
    opacity: 0;
    transform: translateY(18px) scale(0.985);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
