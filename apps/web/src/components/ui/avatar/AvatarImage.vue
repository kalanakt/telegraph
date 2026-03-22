<script setup lang="ts">
import { cn } from '@/lib/utils';
import { AvatarImage as AvatarImagePrimitive } from 'radix-vue';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  src?: string;
  alt?: string;
}>();
</script>

<template>
  <AvatarImagePrimitive
    :class="cn('aspect-square h-full w-full', props.class)"
    :src="props.src ?? ''"
    :alt="props.alt"
  />
</template>
