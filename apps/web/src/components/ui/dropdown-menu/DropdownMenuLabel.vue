<script setup lang="ts">
import { cn } from '@/lib/utils';
import { DropdownMenuLabel as DropdownMenuLabelPrimitive, type DropdownMenuLabelProps } from 'radix-vue';
import type { HTMLAttributes } from 'vue';

interface Props extends DropdownMenuLabelProps {
  class?: HTMLAttributes['class'];
  inset?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <DropdownMenuLabelPrimitive
    :class="cn('px-2 py-1.5 text-sm font-semibold', inset && 'pl-8', props.class)"
  >
    <slot />
  </DropdownMenuLabelPrimitive>
</template>
