<script setup lang="ts">
import { DialogClose as DialogClosePrimitive, type DialogCloseProps } from 'radix-vue';

const props = defineProps<DialogCloseProps>();
</script>

<template>
  <DialogClosePrimitive v-bind="props">
    <slot />
  </DialogClosePrimitive>
</template>
