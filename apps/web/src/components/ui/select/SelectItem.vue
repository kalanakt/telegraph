<script setup lang="ts">
import { cn } from '@/lib/utils';
import {
  SelectItem as SelectItemPrimitive,
  SelectItemIndicator,
  type SelectItemProps,
  SelectItemText,
} from 'radix-vue';
import type { HTMLAttributes } from 'vue';
import { Check } from 'lucide-vue-next';

interface Props extends SelectItemProps {
  class?: HTMLAttributes['class'];
}

const props = defineProps<Props>();
</script>

<template>
  <SelectItemPrimitive
    :class="
      cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.class,
      )
    "
    :value="props.value"
    :disabled="props.disabled"
    :text-value="props.textValue"
  >
    <span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectItemIndicator>
        <Check class="h-4 w-4" />
      </SelectItemIndicator>
    </span>
    <SelectItemText>
      <slot />
    </SelectItemText>
  </SelectItemPrimitive>
</template>
