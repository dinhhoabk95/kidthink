<template>
  <div
    class="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-surface-300 bg-surface-100/90 backdrop-blur-sm shadow-inner"
    role="progressbar"
    :aria-label="`Vòng ${current + 1} trên ${total}`"
    :aria-valuemax="total"
    :aria-valuemin="1"
    :aria-valuenow="current + 1"
  >
    <div
      class="w-5 h-5 flex items-center justify-center rounded-full transition-transform duration-200"
      v-for="i in total"
      :key="i"
      :class="{
        'text-success-500 scale-100': i - 1 < current,
        'text-brand-600 scale-125 animate-pulse': i - 1 === current,
        'text-surface-400 opacity-40 scale-90': i - 1 > current,
      }"
    >
      <span class="w-2.5 h-2.5 rounded-full bg-current" />
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    current: number;
    total: number;
  }>();
</script>
