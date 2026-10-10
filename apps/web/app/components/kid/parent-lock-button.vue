<template>
  <!-- Lối ra duy nhất của bề mặt trẻ: nhấn giữ rồi qua cổng phụ huynh (`BR-PGT-01`). -->
  <button
    aria-label="Cổng phụ huynh / Thoát (nhấn giữ 1 giây)"
    class="relative inline-flex cursor-pointer items-center justify-center rounded-2xl border-[3px] border-surface-300 bg-white shadow-[0_4px_0_var(--color-surface-300)] transition-all active:translate-y-0.5 active:shadow-[0_1px_0_var(--color-surface-300)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    type="button"
    :style="{ width: `${KID_TOUCH_FLOOR_PX}px`, height: `${KID_TOUCH_FLOOR_PX}px` }"
    @pointercancel="cancel"
    @pointerdown="start"
    @pointerleave="cancel"
    @pointerup="cancel"
  >
    <UIcon class="w-7 h-7 text-surface-600" name="i-lucide-lock" />
    <span
      aria-hidden="true"
      class="hold-ring"
      v-if="progress > 0"
      :style="{ '--hold': `${progress}%` }"
    />
  </button>
</template>

<script lang="ts" setup>
  import { getTouchFloor } from "@mindkid/game-engine";
  import { useParentLockHold } from "~/composables/play/use-parent-lock-hold";

  /** Sàn chạm lớn nhất (band 3-4) — trang chứa nút chưa chắc biết band. */
  const KID_TOUCH_FLOOR_PX = getTouchFloor("3-4");

  const emit = defineEmits<{
    /** Giữ đủ lâu — trang mở cổng phụ huynh. */
    unlock: [];
  }>();

  const { progress, start, cancel } = useParentLockHold(() => {
    emit("unlock");
  });
</script>

<style scoped>
  .hold-ring {
    position: absolute;
    inset: -6px;
    border-radius: 1.5rem;
    background: conic-gradient(
      var(--color-brand-600) var(--hold),
      transparent var(--hold)
    );
    mask: radial-gradient(
      farthest-side,
      transparent calc(100% - 5px),
      black calc(100% - 4px)
    );
    pointer-events: none;
  }
</style>
