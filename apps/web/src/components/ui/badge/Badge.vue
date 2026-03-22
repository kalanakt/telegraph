<script setup lang="ts">
import { cn } from '@/lib/utils';
import type { HTMLAttributes } from 'vue';
import { type BadgeVariants, badgeVariants } from '.';

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariants['variant'];
    class?: HTMLAttributes['class'];
  }>(),
  { variant: 'default' },
);
</script>

<template>
  <div :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </div>
</template>
