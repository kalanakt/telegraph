<script setup lang="ts">
import { Toaster as Sonner } from 'sonner';

defineProps<{
  richColors?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
}>();
</script>

<template>
  <Sonner
    :rich-colors="richColors"
    :position="position"
    class="toaster group"
  />
</template>
