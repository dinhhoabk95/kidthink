<template>
  <div
    class="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-2xl border-2 border-dashed border-surface-200 bg-surface-50/50 space-y-3"
  >
    <div
      aria-hidden="true"
      class="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center text-surface-400 text-xl font-heading"
    >
      ∅
    </div>
    <div class="space-y-1">
      <h3 class="text-base font-bold font-heading text-surface-900">
        {{ title || "Chưa có dữ liệu" }}
      </h3>
      <p class="text-sm text-surface-600 max-w-sm" v-if="description">
        {{ description }}
      </p>
    </div>
    <slot name="action" />
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    title?: string;
    description?: string;
  }>();
</script>
