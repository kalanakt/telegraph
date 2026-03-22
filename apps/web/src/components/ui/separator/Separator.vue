<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Separator as SeparatorPrimitive, type SeparatorProps } from 'radix-vue';
import type { HTMLAttributes } from 'vue';

interface Props extends SeparatorProps {
  class?: HTMLAttributes['class'];
}

const props = withDefaults(defineProps<Props>(), {
  orientation: 'horizontal',
  decorative: true,
});
</script>

<template>
  <SeparatorPrimitive
    :class="
      cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        props.class,
      )
    "
    :orientation="orientation"
    :decorative="decorative"
  />
</template>
