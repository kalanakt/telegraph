<script setup lang="ts">
import { cn } from '@/lib/utils';
import { AvatarFallback as AvatarFallbackPrimitive } from 'radix-vue';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{ class?: HTMLAttributes['class'] }>();
</script>

<template>
  <AvatarFallbackPrimitive
    :class="
      cn('flex h-full w-full items-center justify-center rounded-full bg-muted', props.class)
    "
  >
    <slot />
  </AvatarFallbackPrimitive>
</template>
