<script setup lang="ts">
import { TooltipTrigger as TooltipTriggerPrimitive, type TooltipTriggerProps } from 'radix-vue';

const props = defineProps<TooltipTriggerProps>();
</script>

<template>
  <TooltipTriggerPrimitive v-bind="props">
    <slot />
  </TooltipTriggerPrimitive>
</template>
