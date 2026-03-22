<script setup lang="ts">
import { TooltipProvider as TooltipProviderPrimitive, type TooltipProviderProps } from 'radix-vue';

const props = withDefaults(defineProps<TooltipProviderProps>(), {
  delayDuration: 200,
});
</script>

<template>
  <TooltipProviderPrimitive v-bind="props">
    <slot />
  </TooltipProviderPrimitive>
</template>
