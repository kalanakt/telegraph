<script setup lang="ts">
import { cn } from '@/lib/utils';
import { DropdownMenuItem as DropdownMenuItemPrimitive, type DropdownMenuItemProps } from 'radix-vue';
import type { HTMLAttributes } from 'vue';

interface Props extends DropdownMenuItemProps {
  class?: HTMLAttributes['class'];
  inset?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <DropdownMenuItemPrimitive
    :class="
      cn(
        'relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        inset && 'pl-8',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItemPrimitive>
</template>
