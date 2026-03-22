<script setup lang="ts">
import { DropdownMenuTrigger as DropdownMenuTriggerPrimitive, type DropdownMenuTriggerProps } from 'radix-vue';

const props = defineProps<DropdownMenuTriggerProps>();
</script>

<template>
  <DropdownMenuTriggerPrimitive v-bind="props">
    <slot />
  </DropdownMenuTriggerPrimitive>
</template>
