<template>
  <div class="diorama-wrapper w-full max-w-3xl">
    <!-- Bức tranh bối cảnh chủ đề tương tác (kéo thả + tap-tap cho trẻ 3–4 tuổi, BR-SDM-04..07) -->
    <section
      aria-label="Bức tranh bối cảnh dán sticker của bé"
      class="diorama-stage"
      data-testid="sticker-diorama-stage"
      ref="stageRef"
      :class="`diorama-stage--${sceneVariant}`"
    >
      <!-- Phong cảnh minh hoạ SVG thuần vector theo chủ đề (không chữ, không số) -->
      <svg
        aria-hidden="true"
        class="diorama-backdrop-svg"
        preserveAspectRatio="none"
        viewBox="0 0 800 360"
      >
        <circle class="diorama-sun" cx="690" cy="76" r="42" />
        <ellipse class="diorama-cloud" cx="170" cy="74" rx="56" ry="24" />
        <ellipse class="diorama-cloud" cx="215" cy="68" rx="42" ry="20" />
        <ellipse class="diorama-cloud" cx="470" cy="60" rx="50" ry="20" />
        <path
          class="diorama-hill-back"
          d="M 0 240 Q 220 155, 450 230 T 800 210 L 800 360 L 0 360 Z"
        />
        <path
          class="diorama-hill-front"
          d="M 0 275 Q 260 215, 540 270 T 800 255 L 800 360 L 0 360 Z"
        />
      </svg>

      <!-- Viền gợi ý khi bé đang chọn 1 sticker ở khay để chạm-dán (BR-SDM-05) -->
      <div
        aria-hidden="true"
        class="diorama-tap-ready-ring"
        data-testid="diorama-tap-ready"
        v-if="pendingSticker"
      />

      <!-- Các sticker đã bày trên tranh -->
      <button
        class="diorama-placed-item"
        data-testid="diorama-placed-sticker"
        type="button"
        v-for="item in placements"
        :key="`${item.emoji}-${item.instance_index}`"
        :aria-label="item.label"
        :class="{
          'diorama-placed-item--bounce':
            bouncingKey === `${item.emoji}:${item.instance_index}`,
        }"
        :style="{
          left: `${item.norm_x * 100}%`,
          top: `${item.norm_y * 100}%`,
          transform: `translate(-50%, -50%) scale(${item.scale})`,
        }"
        @click.stop="handlePlacedTap(item)"
        @pointerdown.stop="handlePlacedPointerDown($event, item)"
      >
        <span aria-hidden="true" class="diorama-placed-emoji">
          <BrandEmoji :emoji="item.emoji" />
        </span>
      </button>

      <!-- Nút dọn bức tranh nhẹ nhàng về khay (không xoá bộ sưu tập gốc, BR-SDM-02) -->
      <button
        aria-label="Cất các sticker trên tranh về khay"
        class="diorama-clear-btn min-h-16 min-w-16"
        data-testid="diorama-clear-scene"
        type="button"
        v-if="placements.length > 0"
        @click.stop="handleClearScene"
      >
        <UIcon class="w-7 h-7 text-surface-700" name="i-lucide-eraser" />
      </button>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import {
    DIORAMA_NORM_MAX,
    DIORAMA_NORM_MIN,
    MAX_DIORAMA_PLACEMENTS,
    type StickerDioramaPlacementItem,
  } from "@mindkid/shared/client";
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { computed, onBeforeUnmount, onMounted, ref } from "vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  export interface PendingTraySticker {
    readonly theme_code: string;
    readonly emoji: string;
    readonly label: string;
  }

  const props = defineProps<{
    themeCode: string;
    placements: readonly StickerDioramaPlacementItem[];
    pendingSticker: PendingTraySticker | null;
  }>();

  const emit = defineEmits<{
    updatePlacements: [next: StickerDioramaPlacementItem[]];
  }>();

  const { playSfx, playMarimba, speakVi } = useKidSound();
  const stageRef = ref<HTMLElement | null>(null);
  const bouncingKey = ref<string | null>(null);

  interface ActiveDragState {
    readonly emoji: string;
    readonly instanceIndex: number;
    readonly startX: number;
    readonly startY: number;
    moved: boolean;
  }

  const activeDrag = ref<ActiveDragState | null>(null);

  const sceneVariant = computed(() => {
    if (props.themeCode === "ocean" || props.themeCode === "water") {
      return "water";
    }
    if (props.themeCode === "space") {
      return "sky";
    }
    if (props.themeCode === "school" || props.themeCode === "home") {
      return "warm";
    }
    return "meadow";
  });

  function clampNorm(value: number): number {
    return Math.min(DIORAMA_NORM_MAX, Math.max(DIORAMA_NORM_MIN, value));
  }

  function resolvePointerNorm(event: MouseEvent | PointerEvent): {
    normX: number;
    normY: number;
    rawY: number;
  } {
    const rect = stageRef.value?.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) {
      return { normX: 0.5, normY: 0.55, rawY: 0.55 };
    }
    const rawX = (event.clientX - rect.left) / rect.width;
    const rawY = (event.clientY - rect.top) / rect.height;
    return {
      normX: Number(clampNorm(rawX).toFixed(4)),
      normY: Number(clampNorm(rawY).toFixed(4)),
      rawY,
    };
  }

  function nextAvailableInstanceIndex(emoji: string): number | null {
    const used = new Set(
      props.placements
        .filter((p) => p.emoji === emoji)
        .map((p) => p.instance_index)
    );
    for (let idx = 0; idx < MAX_DIORAMA_PLACEMENTS; idx++) {
      if (!used.has(idx)) {
        return idx;
      }
    }
    return null;
  }

  function placePendingAt(normX: number, normY: number): void {
    const pending = props.pendingSticker;
    if (
      !pending ||
      pending.theme_code !== props.themeCode ||
      props.placements.length >= MAX_DIORAMA_PLACEMENTS
    ) {
      return;
    }
    const instanceIndex = nextAvailableInstanceIndex(pending.emoji);
    if (instanceIndex === null) {
      return;
    }
    const nextItem: StickerDioramaPlacementItem = {
      emoji: pending.emoji,
      label: pending.label,
      instance_index: instanceIndex,
      norm_x: normX,
      norm_y: normY,
      scale: 1,
    };
    playSfx("wood_clack_snap");
    speakVi(pending.label);
    emit("updatePlacements", [...props.placements, nextItem]);
  }

  function handleStageTap(event: MouseEvent): void {
    if (!props.pendingSticker) {
      return;
    }
    const { normX, normY } = resolvePointerNorm(event);
    placePendingAt(normX, normY);
  }

  function handlePlacedTap(item: StickerDioramaPlacementItem): void {
    if (activeDrag.value?.moved) {
      return;
    }
    const key = `${item.emoji}:${item.instance_index}`;
    bouncingKey.value = key;
    playMarimba(item.instance_index);
    speakVi(item.label);
    setTimeout(() => {
      if (bouncingKey.value === key) {
        bouncingKey.value = null;
      }
    }, 450);
  }

  function handlePlacedPointerDown(
    event: PointerEvent,
    item: StickerDioramaPlacementItem
  ): void {
    playSfx("wood_pickup");
    activeDrag.value = {
      emoji: item.emoji,
      instanceIndex: item.instance_index,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
  }

  function handlePointerMove(event: PointerEvent): void {
    const drag = activeDrag.value;
    if (!drag) {
      return;
    }
    const dist = Math.hypot(
      event.clientX - drag.startX,
      event.clientY - drag.startY
    );
    if (dist > 6) {
      drag.moved = true;
    }
    if (!drag.moved) {
      return;
    }
    const { normX, normY, rawY } = resolvePointerNorm(event);
    if (rawY > 1.05) {
      // Kéo ra khỏi đáy khung tranh -> cất về khay (BR-SDM-02)
      activeDrag.value = null;
      playSfx("whoosh_return");
      emit(
        "updatePlacements",
        props.placements.filter(
          (p) =>
            !(p.emoji === drag.emoji && p.instance_index === drag.instanceIndex)
        )
      );
      return;
    }
    emit(
      "updatePlacements",
      props.placements.map((p) =>
        p.emoji === drag.emoji && p.instance_index === drag.instanceIndex
          ? { ...p, norm_x: normX, norm_y: normY }
          : p
      )
    );
  }

  function handlePointerUp(): void {
    if (activeDrag.value?.moved) {
      playSfx("wood_clack_snap");
    }
    activeDrag.value = null;
  }

  function handleClearScene(): void {
    playSfx("whoosh_return");
    emit("updatePlacements", []);
  }

  onMounted(() => {
    const el = stageRef.value;
    if (!el) {
      return;
    }
    el.addEventListener("click", handleStageTap);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("pointercancel", handlePointerUp);
  });

  onBeforeUnmount(() => {
    const el = stageRef.value;
    if (!el) {
      return;
    }
    el.removeEventListener("click", handleStageTap);
    el.removeEventListener("pointermove", handlePointerMove);
    el.removeEventListener("pointerup", handlePointerUp);
    el.removeEventListener("pointercancel", handlePointerUp);
  });
</script>

<style scoped>
  .diorama-stage {
    position: relative;
    width: 100%;
    height: 15rem;
    border-radius: 2rem;
    border: 4px solid var(--color-warning-400);
    box-shadow: 0 8px 0 var(--color-warning-300);
    overflow: hidden;
    touch-action: none;
    user-select: none;
    cursor: pointer;
  }

  @media (min-width: 640px) {
    .diorama-stage {
      height: 18rem;
    }
  }

  .diorama-stage--meadow {
    background-color: var(--color-brand-50);
  }

  .diorama-stage--water {
    background-color: var(--color-brand-100);
  }

  .diorama-stage--sky {
    background-color: var(--color-surface-200);
  }

  .diorama-stage--warm {
    background-color: var(--color-warning-50);
  }

  .diorama-backdrop-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .diorama-sun {
    fill: var(--color-warning-300);
  }

  .diorama-cloud {
    fill: var(--color-surface-0, var(--color-surface-50));
    opacity: 0.9;
  }

  .diorama-hill-back {
    fill: var(--color-success-400);
    opacity: 0.35;
  }

  .diorama-stage--water .diorama-hill-back {
    fill: var(--color-brand-300);
    opacity: 0.45;
  }

  .diorama-hill-front {
    fill: var(--color-success-500);
    opacity: 0.45;
  }

  .diorama-stage--water .diorama-hill-front {
    fill: var(--color-brand-400);
    opacity: 0.55;
  }

  .diorama-stage--warm .diorama-hill-front {
    fill: var(--color-warning-300);
    opacity: 0.55;
  }

  .diorama-tap-ready-ring {
    position: absolute;
    inset: 0.5rem;
    border-radius: 1.5rem;
    border: 3px dashed var(--color-cta);
    pointer-events: none;
  }

  .diorama-placed-item {
    position: absolute;
    min-width: 4rem;
    min-height: 4rem;
    width: 4.25rem;
    height: 4.25rem;
    border-radius: 9999px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    padding: 0;
    z-index: 10;
  }

  .diorama-placed-emoji {
    font-family:
      "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
    font-size: 3rem;
    line-height: 1;
    filter: drop-shadow(0 4px 4px rgba(30, 27, 75, 0.18));
  }

  .diorama-placed-item--bounce .diorama-placed-emoji {
    animation: placedBounce 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .diorama-clear-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 20;
    border-radius: 1.25rem;
    border: 3px solid var(--color-surface-300);
    background-color: var(--color-surface-50);
    box-shadow: 0 4px 0 var(--color-surface-300);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  @keyframes placedBounce {
    0% {
      transform: scale(1);
    }
    35% {
      transform: scale(1.24, 0.84);
    }
    70% {
      transform: scale(0.94, 1.1);
    }
    100% {
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .diorama-placed-item--bounce .diorama-placed-emoji {
      animation: none;
    }
  }
</style>
