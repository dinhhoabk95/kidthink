<template>
  <div
    aria-live="polite"
    class="flex flex-col items-center justify-center p-8 space-y-3 text-surface-600"
    role="status"
  >
    <div
      aria-hidden="true"
      class="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"
    />
    <p class="text-sm font-medium font-heading">
      {{ message || "Đang tải dữ liệu..." }}
    </p>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    message?: string;
  }>();
</script>
