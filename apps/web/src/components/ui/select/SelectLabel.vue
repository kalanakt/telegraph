<script setup lang="ts">
import { cn } from '@/lib/utils';
import { SelectLabel as SelectLabelPrimitive, type SelectLabelProps } from 'radix-vue';
import type { HTMLAttributes } from 'vue';

interface Props extends SelectLabelProps {
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
</script>

<template>
  <SelectLabelPrimitive :class="cn('px-2 py-1.5 text-sm font-semibold', props.class)">
    <slot />
  </SelectLabelPrimitive>
</template>
