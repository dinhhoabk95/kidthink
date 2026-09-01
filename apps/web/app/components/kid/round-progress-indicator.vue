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
      class="round-star-pill"
      v-for="i in total"
      :key="i"
      :class="{
        'round-star--done': i - 1 < current,
        'round-star--active': i - 1 === current,
        'round-star--future': i - 1 > current,
      }"
    >
      <span class="star-icon">⭐</span>
    </div>
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
    gap: 8px;
    align-items: center;
    justify-content: center;
    background-color: rgba(245, 243, 239, 0.9);
    backdrop-filter: blur(6px);
    border: 2px solid #d4c5ab;
    border-radius: 9999px;
    padding: 6px 16px;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.04);
  }

  .round-star-pill {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .round-star--done {
    filter: drop-shadow(0 2px 4px rgba(16, 185, 129, 0.35));
    transform: scale(1.05);
  }

  .round-star--active {
    filter: drop-shadow(0 4px 8px rgba(255, 191, 0, 0.5));
    transform: scale(1.25);
    animation: pulseActive 2s infinite ease-in-out;
  }

  .round-star--future {
    opacity: 0.35;
    filter: grayscale(1);
    transform: scale(0.85);
  }

  .star-icon {
    font-size: 18px;
    line-height: 1;
  }

  @keyframes pulseActive {
    0% {
      transform: scale(1.2);
    }
    50% {
      transform: scale(1.32);
    }
    100% {
      transform: scale(1.2);
    }
  }
</style>
