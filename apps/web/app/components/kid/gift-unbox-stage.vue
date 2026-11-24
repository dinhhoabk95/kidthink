<template>
  <div
    class="gift-stage"
    ref="stageRef"
    :class="{ 'gift-stage--unboxed': isUnboxed }"
    :data-unboxed="isUnboxed ? 'true' : 'false'"
  >
    <span aria-hidden="true" class="sticker-emoji">
      <BrandEmoji hero :emoji="sticker.emoji" />
    </span>

    <div
      aria-hidden="true"
      class="gift-lid-overlay"
      data-testid="gift-unbox-lid"
      v-if="!isUnboxed"
    >
      <div class="gift-ribbon-vertical" />
      <div class="gift-ribbon-horizontal" />
      <UIcon
        class="w-10 h-10 text-warning-700 relative z-10"
        name="i-lucide-gift"
      />
    </div>

    <div aria-hidden="true" class="gift-sparkles" v-if="isUnboxed">
      <UIcon
        class="sparkle-dot sparkle-dot--left w-5 h-5 text-warning-500"
        name="i-lucide-sparkles"
      />
      <UIcon
        class="sparkle-dot sparkle-dot--right w-5 h-5 text-brand-500"
        name="i-lucide-star"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { onBeforeUnmount, onMounted, ref, watch } from "vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  interface GiftSticker {
    readonly emoji: string;
    readonly label: string;
  }

  const props = defineProps<{
    sticker: GiftSticker;
  }>();

  const emit = defineEmits<{
    unboxed: [phrase: string];
  }>();

  const { playSfx } = useKidSound();
  const stageRef = ref<HTMLElement | null>(null);
  const isUnboxed = ref(false);

  watch(
    () => props.sticker.emoji,
    () => {
      isUnboxed.value = false;
    }
  );

  function handleUnbox(): void {
    if (isUnboxed.value) {
      playSfx("pop_celebrate");
      emit("unboxed", props.sticker.label);
      return;
    }
    playSfx("gift_rustle");
    playSfx("gift_pop");
    isUnboxed.value = true;
    emit(
      "unboxed",
      `Tùng dinh dinh! Hộp quà mây mở tặng bé ${props.sticker.label}!`
    );
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleUnbox();
    }
  }

  onMounted(() => {
    const el = stageRef.value;
    if (!el) {
      return;
    }
    el.addEventListener("click", handleUnbox);
    el.addEventListener("keydown", handleKeydown);
  });

  onBeforeUnmount(() => {
    const el = stageRef.value;
    if (!el) {
      return;
    }
    el.removeEventListener("click", handleUnbox);
    el.removeEventListener("keydown", handleKeydown);
  });
</script>

<style scoped>
  .gift-stage {
    position: relative;
    width: 100%;
    height: 100%;
    min-width: 4rem;
    min-height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
  }

  .sticker-emoji {
    font-size: 4rem;
    line-height: 1;
    transform: scale(0.55);
    opacity: 0.15;
    transition:
      transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1),
      opacity 160ms ease;
  }

  .gift-stage--unboxed .sticker-emoji {
    transform: scale(1.06);
    opacity: 1;
  }

  .gift-lid-overlay {
    position: absolute;
    inset: 0.2rem;
    border-radius: 1.35rem;
    border: 3px solid var(--color-warning-500);
    background-color: var(--color-warning-100);
    background-image: repeating-linear-gradient(
      45deg,
      var(--color-warning-100) 0px,
      var(--color-warning-100) 8px,
      var(--color-warning-200) 8px,
      var(--color-warning-200) 16px
    );
    box-shadow: 0 5px 0 var(--color-warning-500);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    animation: giftWiggle 2.2s ease-in-out infinite;
  }

  .gift-ribbon-vertical {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 0.85rem;
    background-color: var(--color-cta);
    opacity: 0.85;
  }

  .gift-ribbon-horizontal {
    position: absolute;
    left: 0;
    right: 0;
    height: 0.85rem;
    background-color: var(--color-cta);
    opacity: 0.85;
  }

  .gift-sparkles {
    position: absolute;
    inset: -0.35rem;
    pointer-events: none;
  }

  .sparkle-dot {
    position: absolute;
    animation: sparklePop 420ms ease-out;
  }

  .sparkle-dot--left {
    top: -0.25rem;
    left: -0.25rem;
  }

  .sparkle-dot--right {
    bottom: -0.25rem;
    right: -0.25rem;
  }

  @keyframes giftWiggle {
    0%,
    100% {
      transform: rotate(0deg) scale(1);
    }
    20% {
      transform: rotate(-4deg) scale(1.04);
    }
    40% {
      transform: rotate(4deg) scale(1.04);
    }
    60% {
      transform: rotate(0deg) scale(1);
    }
  }

  @keyframes sparklePop {
    0% {
      transform: scale(0.3);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .gift-lid-overlay,
    .sparkle-dot {
      animation: none;
    }
  }

  @media (max-height: 500px) and (orientation: landscape) {
    .sticker-emoji {
      font-size: 2.75rem;
    }
  }
</style>
