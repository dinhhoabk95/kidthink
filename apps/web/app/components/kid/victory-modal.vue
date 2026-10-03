<template>
  <div
    aria-label="Chúc mừng hoàn thành bài học"
    aria-modal="true"
    class="victory-overlay"
    role="dialog"
    v-if="show"
    ref="modalRef"
  >
    <!-- Background Backdrop with warm dark indigo tint -->
    <div class="backdrop-glow" />

    <!-- Main Victory Modal Box -->
    <div class="modal-wrapper">
      <!-- Gấu Con ăn mừng (`feedback-and-celebration.md` §7.4) -->
      <div class="mascot-container">
        <KidMascot pose="celebrate" :size="112" />
      </div>

      <!-- Modal Card -->
      <div class="clay-card">
        <!-- 3-Star Arc -->
        <div class="stars-arc" v-if="stars != null && stars > 0">
          <div
            class="star-pill star-pill--left star-anim"
            :class="{ 'star-pill--dim': (stars ?? 0) < 1 }"
          >
            <span class="star-icon" v-if="(stars ?? 0) >= 1">⭐</span>
          </div>
          <div
            class="star-pill star-pill--center star-anim"
            :class="{ 'star-pill--dim': (stars ?? 0) < 2 }"
          >
            <span class="star-icon star-icon--big" v-if="(stars ?? 0) >= 2"
              >⭐</span
            >
          </div>
          <div
            class="star-pill star-pill--right star-anim"
            :class="{ 'star-pill--dim': (stars ?? 0) < 3 }"
          >
            <span class="star-icon" v-if="(stars ?? 0) >= 3">⭐</span>
          </div>
        </div>

        <!-- Headline -->
        <h1 class="victory-title">
          <span class="victory-gradient-text">{{ celebrationTitle }}</span>
          <span class="victory-subtitle">{{ celebrationSubtitle }}</span>
        </h1>

        <!-- Nút chỉ có icon, chữ ở aria-label (`BR-FBK-12`) -->
        <div class="action-buttons">
          <button
            class="btn-continue clay-button"
            type="button"
            :aria-label="isIntro ? 'Vào trò chơi' : 'Chơi tiếp'"
            @click="emit('continue')"
          >
            <UIcon class="btn-icon" name="i-lucide-play" />
          </button>
          <button
            aria-label="Chơi lại"
            class="btn-replay"
            type="button"
            @click="emit('replay')"
          >
            <UIcon class="btn-icon" name="i-lucide-rotate-ccw" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { FeedbackSystem } from "@mindkid/game-engine";
  import { computed, ref, toRef, watch } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import { useFocusTrap } from "~/composables/play/use-focus-trap";
  import type { CelebrationTier } from "~/composables/play/use-play-telemetry";

  const props = withDefaults(
    defineProps<{
      show: boolean;
      stars?: number | null;
      isIntro?: boolean;
      celebration?: CelebrationTier;
    }>(),
    {
      stars: null,
      isIntro: false,
      celebration: "great",
    }
  );

  const emit = defineEmits<{
    continue: [];
    replay: [];
    /** Lời khen cần đọc thành tiếng khi modal mở (`BR-FBK-12`). */
    announce: [phrase: string];
  }>();

  const feedback = new FeedbackSystem();

  watch(
    () => props.show,
    (isOpen) => {
      if (isOpen) {
        emit("announce", feedback.getCompliment());
      }
    },
    { immediate: true }
  );

  const modalRef = ref<HTMLElement | null>(null);
  // Escape đóng modal bằng hành động chính đang hiện trên nút ("Tiếp Tục Chơi")
  // và `useFocusTrap` trả focus về phần tử gọi (BR-A11-12).
  useFocusTrap(modalRef, toRef(props, "show"), {
    onEscape: () => emit("continue"),
  });

  const celebrationTitle = computed(() => {
    if (props.isIntro) {
      return "Đã Học Xong!";
    }
    if (props.celebration === "good") {
      return "Bé Làm Tốt Lắm!";
    }
    if (props.celebration === "nice_try") {
      return "Bé Đã Hoàn Thành!";
    }
    return "Bé Giỏi Quá!";
  });

  const celebrationSubtitle = computed(() => {
    if (props.isIntro) {
      return "Bé đã hoàn thành bài làm quen! 🎉";
    }
    if (props.celebration === "good") {
      return "Bé đã hoàn thành cả bài rồi! 🎉";
    }
    if (props.celebration === "nice_try") {
      return "Bé đi hết chặng đường rồi, giỏi lắm! 🎉";
    }
    return "Bé làm đúng hết rồi! 🎉";
  });
</script>

<style scoped>
  .victory-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    overflow: hidden;
  }

  .backdrop-glow {
    position: absolute;
    inset: 0;
    background-color: rgba(30, 27, 75, 0.65);
    backdrop-filter: blur(8px);
  }

  .modal-wrapper {
    position: relative;
    z-index: 10;
    width: 100%;
    max-width: 32rem;
    margin-top: 3.5rem;
  }

  .mascot-container {
    position: absolute;
    top: -5rem;
    left: 50%;
    transform: translateX(-50%);
    width: 7rem;
    height: 7rem;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .clay-card {
    background-color: var(--color-surface-50);
    border-radius: 2.5rem;
    border: 4px solid var(--color-surface-300);
    padding: 3rem 2rem 2rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    box-shadow:
      inset 0 4px 8px rgba(255, 255, 255, 0.8),
      inset 0 -4px 8px rgba(0, 0, 0, 0.05),
      0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .stars-arc {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: -3.5rem;
    margin-bottom: 1.5rem;
    position: relative;
    z-index: 30;
  }

  .star-pill {
    width: 3.5rem;
    height: 3.5rem;
    background-color: var(--color-warning-400);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px solid var(--color-surface-50);
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.5),
      0 6px 12px rgba(121, 89, 0, 0.25);
  }

  .star-pill--center {
    width: 5rem;
    height: 5rem;
    transform: translateY(-0.75rem);
    box-shadow:
      inset 0 4px 8px rgba(255, 255, 255, 0.5),
      0 8px 16px rgba(121, 89, 0, 0.35);
  }

  .star-pill--left {
    transform: rotate(-12deg);
  }

  .star-pill--right {
    transform: rotate(12deg);
  }

  .star-icon {
    font-size: 2rem;
    line-height: 1;
  }

  .star-icon--big {
    font-size: 3rem;
  }

  .victory-title {
    font-family: var(--font-heading, "Fredoka", "Quicksand", sans-serif);
    font-weight: 700;
    margin: 0.5rem 0 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .victory-gradient-text {
    font-size: 2rem;
    color: var(--color-success-700);
  }

  .victory-subtitle {
    font-size: 1.5rem;
    color: var(--color-warning-700);
  }

  .star-pill--dim {
    background-color: var(--color-surface-200);
    border-color: var(--color-surface-300);
    box-shadow: none;
    opacity: 0.35;
    animation: none;
  }

  .action-buttons {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.5rem;
  }

  .btn-icon {
    width: 2.25rem;
    height: 2.25rem;
  }

  .clay-button {
    box-shadow:
      inset 0 4px 6px rgba(255, 255, 255, 0.4),
      inset 0 -6px 8px rgba(0, 0, 0, 0.2),
      0 8px 15px rgba(121, 89, 0, 0.2);
    border-bottom: 6px solid var(--color-warning-600);
  }

  .clay-button:active {
    transform: translateY(4px);
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.2),
      inset 0 -2px 4px rgba(0, 0, 0, 0.1),
      0 2px 5px rgba(121, 89, 0, 0.1);
    border-bottom-width: 2px;
  }

  .btn-continue {
    background-color: var(--color-warning-400);
    color: var(--color-surface-950);
    border-radius: 9999px;
    height: 6rem;
    width: 6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 1.5rem;
    font-weight: 700;
    border-top: none;
    border-left: none;
    border-right: none;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-replay {
    height: var(--hud-touch-floor, 4.5rem);
    width: var(--hud-touch-floor, 4.5rem);
    min-height: 4.5rem;
    min-width: 4.5rem;
    border-radius: 9999px;
    border: 3px solid var(--color-surface-300);
    background-color: var(--color-surface-100);
    color: var(--color-surface-800);
    font-family: var(--font-sans, "Quicksand", sans-serif);
    font-size: 1.15rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .btn-replay:hover {
    background-color: var(--color-surface-200);
  }

  .btn-replay:active {
    transform: translateY(2px);
  }

  @keyframes starPulse {
    0% {
      transform: scale(1);
      filter: brightness(1);
    }
    50% {
      transform: scale(1.08);
      filter: brightness(1.15);
    }
    100% {
      transform: scale(1);
      filter: brightness(1);
    }
  }

  .star-anim {
    animation: starPulse 2.5s ease-in-out infinite;
  }
</style>
