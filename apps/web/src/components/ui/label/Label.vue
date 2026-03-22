<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Label as LabelPrimitive } from 'radix-vue';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  for?: string;
}>();
</script>

<template>
  <LabelPrimitive
    :class="
      cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        props.class,
      )
    "
    :for="props.for"
  >
    <slot />
  </LabelPrimitive>
</template>
