<script setup lang="ts">
import { cn } from '@/lib/utils';
import { type HTMLAttributes, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  class?: HTMLAttributes['class'];
  defaultValue?: string | number;
  modelValue?: string | number;
}>();

const emits = defineEmits<{
  'update:modelValue': [value: string | number];
}>();

const attrs = useAttrs();
</script>

<template>
  <input
    :class="
      cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
    :value="modelValue"
    v-bind="attrs"
    @input="emits('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
