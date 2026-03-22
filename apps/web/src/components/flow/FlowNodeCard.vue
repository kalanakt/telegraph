<script setup lang="ts">
import { cn } from "@/lib/utils";
import { Handle, Position, type NodeProps } from "@vue-flow/core";
import {
  Bot,
  BrainCircuit,
  GitBranch,
  Megaphone,
  MessageSquareText,
  Rocket,
} from "lucide-vue-next";
import { computed } from "vue";

type StudioNodeKind = "trigger" | "message" | "condition" | "ai" | "action";

export interface StudioNodeData {
  kind: StudioNodeKind;
  title: string;
  subtitle: string;
  chips: string[];
  metric: string;
}

const props = defineProps<NodeProps<StudioNodeData>>();

const kindMeta = computed(() => {
  const byKind: Record<
    StudioNodeKind,
    { accent: string; iconBg: string; icon: typeof Bot; label: string }
  > = {
    trigger: {
      accent: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-100 text-amber-700",
      icon: Rocket,
      label: "Trigger",
    },
    message: {
      accent: "from-sky-500 to-cyan-500",
      iconBg: "bg-sky-100 text-sky-700",
      icon: MessageSquareText,
      label: "Message",
    },
    condition: {
      accent: "from-fuchsia-500 to-rose-500",
      iconBg: "bg-fuchsia-100 text-fuchsia-700",
      icon: GitBranch,
      label: "Condition",
    },
    ai: {
      accent: "from-emerald-500 to-teal-500",
      iconBg: "bg-emerald-100 text-emerald-700",
      icon: BrainCircuit,
      label: "AI Step",
    },
    action: {
      accent: "from-indigo-500 to-violet-500",
      iconBg: "bg-indigo-100 text-indigo-700",
      icon: Megaphone,
      label: "Action",
    },
  };

  return byKind[props.data.kind] ?? byKind.message;
});

const nodeChips = computed(() => props.data.chips.slice(0, 3));
</script>

<template>
  <div
    :class="
      cn(
        'group relative w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 transition-all duration-200',
        selected &&
          'ring-2 ring-sky-300/80 ring-offset-2 ring-offset-transparent',
      )
    "
  >
    <div
      class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r"
      :class="kindMeta.accent"
    />

    <Handle
      type="target"
      :position="Position.Left"
      class="studio-handle !-left-2 !h-3 !w-3 !border-2 !border-white !bg-slate-500"
    />
    <Handle
      type="source"
      :position="Position.Right"
      class="studio-handle !-right-2 !h-3 !w-3 !border-2 !border-white !bg-sky-500"
    />

    <div class="space-y-3 p-4">
      <div class="flex items-center justify-between">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-lg"
          :class="kindMeta.iconBg"
        >
          <component :is="kindMeta.icon" class="h-4 w-4" />
        </div>
        <span
          class="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500"
        >
          {{ kindMeta.label }}
        </span>
      </div>

      <div>
        <p class="text-sm font-semibold leading-tight text-slate-900">
          {{ data.title }}
        </p>
        <p class="mt-1 text-xs leading-relaxed text-slate-500">
          {{ data.subtitle }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <span
          v-for="chip in nodeChips"
          :key="chip"
          class="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600"
        >
          {{ chip }}
        </span>
      </div>

      <div
        class="flex items-center justify-between rounded-lg bg-slate-900/5 px-2.5 py-2"
      >
        <span class="text-[11px] font-medium text-slate-500"
          >Current throughput</span
        >
        <span class="text-xs font-semibold text-slate-800">{{
          data.metric
        }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.studio-handle {
  transition: transform 180ms ease;
}

.studio-handle:hover {
  transform: scale(1.15);
}
</style>
