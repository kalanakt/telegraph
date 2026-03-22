<script setup lang="ts">
import { computed } from "vue";

import { dismissToast, type ToastRecord, useToastState } from "./toast-state";

const props = withDefaults(
  defineProps<{
    richColors?: boolean;
    position?:
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "top-center"
      | "bottom-center";
  }>(),
  {
    richColors: true,
    position: "top-right",
  },
);

const { toasts } = useToastState();

const containerClass = computed(() => {
  switch (props.position) {
    case "top-left":
      return "left-4 top-4 items-start";
    case "bottom-left":
      return "bottom-4 left-4 items-start";
    case "bottom-right":
      return "bottom-4 right-4 items-end";
    case "top-center":
      return "left-1/2 top-4 -translate-x-1/2 items-center";
    case "bottom-center":
      return "bottom-4 left-1/2 -translate-x-1/2 items-center";
    default:
      return "right-4 top-4 items-end";
  }
});

function toastClass(toast: ToastRecord): string {
  if (!props.richColors) {
    return "border-slate-200 bg-white text-slate-800";
  }

  if (toast.variant === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-900";
  }

  if (toast.variant === "error") {
    return "border-rose-200 bg-rose-50 text-rose-900";
  }

  return "border-slate-200 bg-white text-slate-800";
}
</script>

<template>
  <div
    class="pointer-events-none fixed z-[110] flex w-[min(420px,calc(100vw-1.25rem))] flex-col gap-2"
    :class="containerClass"
    aria-live="polite"
    aria-atomic="true"
  >
    <TransitionGroup name="tele-toast">
      <div
        v-for="item in toasts"
        :key="item.id"
        class="pointer-events-auto relative rounded-lg border px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur-sm"
        :class="toastClass(item)"
      >
        <p class="pr-6 text-sm font-semibold leading-tight">{{ item.title }}</p>
        <p v-if="item.description" class="mt-1 pr-6 text-xs opacity-90">
          {{ item.description }}
        </p>
        <button
          type="button"
          class="absolute right-2 top-1.5 rounded px-1 text-sm opacity-70 transition hover:opacity-100"
          aria-label="Dismiss"
          @click="dismissToast(item.id)"
        >
          ×
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.tele-toast-enter-active,
.tele-toast-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.tele-toast-enter-from,
.tele-toast-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.985);
}
</style>
