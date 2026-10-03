<template>
  <canvas
    aria-hidden="true"
    class="kid-mascot"
    ref="canvasRef"
    :height="pixelSize"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :width="pixelSize"
  />
</template>

<script lang="ts" setup>
  import { drawMascot, type MascotPose } from "@mindkid/game-engine";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import { useMascotSprites } from "~/composables/play/use-mascot-sprites";

  /**
   * Gấu Con trên bề mặt DOM của trẻ (màn tổng kết, trang bài học) — cùng
   * `drawMascot` với vùng lời dẫn trên canvas (`feedback-and-celebration.md` §7.4).
   */
  const props = withDefaults(
    defineProps<{
      pose?: MascotPose;
      /** Cạnh hiển thị, px CSS. */
      size?: number;
    }>(),
    { pose: "idle", size: 112 }
  );

  const MAX_DEVICE_PIXEL_RATIO = 2;

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const sprites = useMascotSprites();
  const pixelRatio =
    typeof window === "undefined"
      ? 1
      : Math.min(MAX_DEVICE_PIXEL_RATIO, window.devicePixelRatio || 1);
  const pixelSize = computed(() => Math.round(props.size * pixelRatio));

  let rafId: number | null = null;
  let startMs = 0;

  function prefersReducedMotion(): boolean {
    return (
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
    );
  }

  function renderFrame(nowMs: number): void {
    const ctx = canvasRef.value?.getContext("2d");
    if (!ctx) {
      return;
    }
    const side = pixelSize.value;
    ctx.clearRect(0, 0, side, side);
    drawMascot(
      ctx,
      { cx: side / 2, cy: side * 0.58, radius: side * 0.3 },
      props.pose,
      nowMs - startMs,
      { sprites: sprites.value, reducedMotion: prefersReducedMotion() }
    );
    rafId = requestAnimationFrame(renderFrame);
  }

  // Dáng mới chạy hoạt ảnh từ đầu.
  watch(
    () => props.pose,
    () => {
      startMs = performance.now();
    }
  );

  onMounted(() => {
    if (typeof requestAnimationFrame === "undefined") {
      return;
    }
    startMs = performance.now();
    rafId = requestAnimationFrame(renderFrame);
  });

  onUnmounted(() => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
  });
</script>
