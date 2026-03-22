<script setup lang="ts">
import { SelectGroup as SelectGroupPrimitive, type SelectGroupProps } from 'radix-vue';

const props = defineProps<SelectGroupProps>();
</script>

<template>
  <SelectGroupPrimitive v-bind="props">
    <slot />
  </SelectGroupPrimitive>
</template>
