<template>
  <div
    aria-label="Chúc mừng hoàn thành bài học"
    aria-modal="true"
    class="victory-overlay"
    role="dialog"
    v-if="show"
  >
    <!-- Background Backdrop with warm dark indigo tint -->
    <div class="backdrop-glow" />

    <!-- Main Victory Modal Box -->
    <div class="modal-wrapper">
      <!-- Popping Mascot (Cheerful Bear) -->
      <div class="mascot-container animate-float">
        <span aria-hidden="true" class="mascot-emoji">🐻</span>
      </div>

      <!-- Modal Card -->
      <div class="clay-card">
        <!-- 3-Star Arc -->
        <div class="stars-arc">
          <div class="star-pill star-pill--left star-anim">
            <span class="star-icon">⭐</span>
          </div>
          <div class="star-pill star-pill--center star-anim">
            <span class="star-icon star-icon--big">⭐</span>
          </div>
          <div class="star-pill star-pill--right star-anim">
            <span class="star-icon">⭐</span>
          </div>
        </div>

        <!-- Headline -->
        <h1 class="victory-title">
          <span class="victory-gradient-text"
            >{{ isIntro ? 'Đã Học Xong!' : 'Bé Giỏi Quá!' }}</span
          >
          <span class="victory-subtitle"
            >{{ isIntro ? 'Bé đã hoàn thành bài làm quen! 🎉' : 'Hoàn Thành Xuất Sắc! 🎉' }}</span
          >
        </h1>

        <!-- Score / Mastery Badge -->
        <div class="score-badge" v-if="!isIntro">
          <span class="score-icon">🌟</span>
          <span class="score-text">+100 Điểm Tư Duy</span>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button
            class="btn-continue clay-button"
            type="button"
            @click="emit('continue')"
          >
            <span class="btn-text"
              >{{ isIntro ? 'Vào Trò Chơi' : 'Tiếp Tục Chơi' }}</span
            >
            <span class="btn-icon">➔</span>
          </button>
          <button class="btn-replay" type="button" @click="emit('replay')">
            <span class="btn-icon">🔄</span>
            <span>Chơi lại</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    show: boolean;
    stars?: number;
    isIntro?: boolean;
  }>();

  const emit = defineEmits<{
    continue: [];
    replay: [];
  }>();
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

  .mascot-emoji {
    font-size: 5.5rem;
    filter: drop-shadow(0 12px 16px rgba(0, 0, 0, 0.25));
  }

  .clay-card {
    background-color: #fdfbf7;
    border-radius: 2.5rem;
    border: 4px solid #d4c5ab;
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
    background-color: #ffbf00;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 4px solid #fdfbf7;
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
    color: #006d37;
  }

  .victory-subtitle {
    font-size: 1.5rem;
    color: #795900;
  }

  .score-badge {
    background-color: #eae8e4;
    border: 2px solid #d4c5ab;
    border-radius: 9999px;
    padding: 0.6rem 1.5rem;
    margin-bottom: 1.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .score-icon {
    font-size: 1.4rem;
  }

  .score-text {
    font-family: var(--font-sans, "Quicksand", sans-serif);
    font-size: 1.15rem;
    font-weight: 700;
    color: #795900;
  }

  .action-buttons {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .clay-button {
    box-shadow:
      inset 0 4px 6px rgba(255, 255, 255, 0.4),
      inset 0 -6px 8px rgba(0, 0, 0, 0.2),
      0 8px 15px rgba(121, 89, 0, 0.2);
    border-bottom: 6px solid #d97706;
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
    background-color: #ffbf00;
    color: #1b1c1a;
    border-radius: 9999px;
    height: 4.5rem;
    width: 100%;
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
    height: 3.5rem;
    width: 100%;
    border-radius: 9999px;
    border: 3px solid #d4c5ab;
    background-color: #f5f3ef;
    color: #504532;
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
    background-color: #eae8e4;
  }

  .btn-replay:active {
    transform: translateY(2px);
  }

  @keyframes float {
    0% {
      transform: translate(-50%, 0px) rotate(0deg);
    }
    50% {
      transform: translate(-50%, -8px) rotate(3deg);
    }
    100% {
      transform: translate(-50%, 0px) rotate(0deg);
    }
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
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
