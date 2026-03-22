<script setup lang="ts">
import { SelectValue as SelectValuePrimitive, type SelectValueProps } from 'radix-vue';

const props = defineProps<SelectValueProps>();
</script>

<template>
  <SelectValuePrimitive v-bind="props">
    <slot />
  </SelectValuePrimitive>
</template>
