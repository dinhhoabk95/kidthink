<template>
  <div
    class="round-progress"
    role="progressbar"
    v-if="total > 1"
    :aria-label="`Vòng ${current + 1} trên ${total}`"
    :aria-valuemax="total"
    :aria-valuemin="1"
    :aria-valuenow="current + 1"
  >
    <div
      class="round-dot"
      v-for="i in total"
      :key="i"
      :class="{
        'round-dot--done': i - 1 < current,
        'round-dot--active': i - 1 === current,
        'round-dot--future': i - 1 > current,
      }"
    />
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    current: number;
    total: number;
  }>();
</script>

<style scoped>
  .round-progress {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    pointer-events: none;
    position: absolute;
    top: 16px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
  }

  .round-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    transition:
      transform 200ms ease,
      background-color 200ms ease,
      box-shadow 200ms ease;
  }

  .round-dot--done {
    background-color: var(--color-success-500);
    transform: scale(1);
  }

  .round-dot--active {
    background-color: var(--color-brand-600);
    transform: scale(1.25);
    box-shadow: 0 0 0 4px
      color-mix(in srgb, var(--color-brand-600) 25%, transparent);
  }

  .round-dot--future {
    background-color: var(--color-surface-300);
    transform: scale(1);
  }
</style>
