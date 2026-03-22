<script setup lang="ts">
import { DialogTrigger as DialogTriggerPrimitive, type DialogTriggerProps } from 'radix-vue';

const props = defineProps<DialogTriggerProps>();
</script>

<template>
  <DialogTriggerPrimitive v-bind="props">
    <slot />
  </DialogTriggerPrimitive>
</template>
