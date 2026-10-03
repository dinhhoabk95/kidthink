<template>
  <div
    class="lesson-surface"
    :style="{ '--hud-touch-floor': `${KID_TOUCH_FLOOR_PX}px` }"
  >
    <!-- Chỉ một lối ra: khoá phụ huynh nhấn giữ (`BR-CLF-05`). -->
    <header class="lesson-hud">
      <button
        aria-label="Cổng phụ huynh / Thoát (nhấn giữ 1 giây)"
        class="hud-button"
        data-testid="lesson-parent-lock"
        type="button"
        @pointercancel="cancelParentLockHold"
        @pointerdown="startParentLockHold"
        @pointerleave="cancelParentLockHold"
        @pointerup="cancelParentLockHold"
      >
        <UIcon class="w-7 h-7 text-surface-600" name="i-lucide-lock" />
        <span
          aria-hidden="true"
          class="hold-ring"
          v-if="parentLockHoldProgress > 0"
          :style="{ '--hold': `${parentLockHoldProgress}%` }"
        />
      </button>
    </header>

    <main class="lesson-main">
      <div aria-live="polite" class="sr-only">{{ liveAnnouncement }}</div>

      <div class="loading" v-if="isLoading">
        <KidMascot pose="listen" :size="120" />
      </div>

      <template v-else-if="progress">
        <KidMascot :pose="mascotPose" :size="160" />

        <!-- Một hạt cho mỗi bước, không số (`BR-CLF-06`). -->
        <ol
          aria-label="Các bước của bài"
          class="step-dots"
          data-testid="lesson-step-dots"
        >
          <li
            class="step-dot"
            v-for="step in progress.steps"
            :key="step.index"
            :aria-label="stepLabel(step)"
            :class="{
              'step-dot--done': step.done,
              'step-dot--current': step.index === progress.current_step,
              'step-dot--locked': step.locked,
            }"
          >
            <UIcon class="w-5 h-5" name="i-lucide-check" v-if="step.done" />
            <UIcon
              class="w-5 h-5"
              name="i-lucide-lock"
              v-else-if="step.locked"
            />
            <span class="step-emoji" v-else-if="step.thumbnail_emoji"
              >{{ step.thumbnail_emoji }}</span
            >
          </li>
        </ol>

        <button
          aria-label="Chơi bước tiếp theo"
          class="play-button"
          data-testid="lesson-play-next"
          type="button"
          v-if="currentStep"
          @click="playCurrentStep"
        >
          <UIcon class="w-14 h-14" name="i-lucide-play" />
        </button>
      </template>

      <div class="error" v-else-if="hasError">
        <KidMascot pose="encourage" :size="120" />
        <button
          aria-label="Thử tải lại bài"
          class="hud-button"
          type="button"
          @click="loadProgress"
        >
          <UIcon class="w-7 h-7" name="i-lucide-rotate-ccw" />
        </button>
      </div>
    </main>

    <!-- Thưởng cuối bài (`BR-CLF-08`): tái dùng màn tổng kết của trang chơi. -->
    <KidVictoryModal
      celebration="great"
      :show="showReward"
      :stars="3"
      @announce="speak"
      @continue="leaveLesson"
      @replay="replayLesson"
    />

    <ParentGateModal
      v-if="showParentGate"
      :client-only="true"
      @cancel="showParentGate = false"
      @verified="leaveLesson"
    />
  </div>
</template>

<script lang="ts" setup>
  import {
    getTouchFloor,
    type MascotPose,
    SpeechSynthesisAdapter,
  } from "@mindkid/game-engine";
  import { computed, onMounted, ref } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import { useParentLockHold } from "~/composables/play/use-parent-lock-hold";
  import { useApi } from "~/composables/use-api";

  /** Bề mặt trẻ: không navbar/footer (`BR-PSZ-11`, `BR-CLF-05`). */
  definePageMeta({ layout: "kid" });

  interface LessonStep {
    index: number;
    kind: "intro" | "game";
    level_code: string;
    title: string | null;
    thumbnail_emoji: string | null;
    done: boolean;
    locked: boolean;
  }

  interface LessonProgress {
    lesson: { code: string; title: string };
    play_uuid: string;
    steps: LessonStep[];
    current_step: number | null;
    status: "in_progress" | "completed";
    just_completed: boolean;
  }

  /** Sàn chạm lớn nhất (band 3-4) — trang bài chưa biết band của level. */
  const KID_TOUCH_FLOOR_PX = getTouchFloor("3-4");

  const route = useRoute();
  const router = useRouter();
  const api = useApi();
  const lessonCode = String(route.params.code);

  const progress = ref<LessonProgress | null>(null);
  const isLoading = ref(true);
  const hasError = ref(false);
  const showReward = ref(false);
  const showParentGate = ref(false);

  const {
    progress: parentLockHoldProgress,
    start: startParentLockHold,
    cancel: cancelParentLockHold,
  } = useParentLockHold(() => {
    showParentGate.value = true;
  });

  const currentStep = computed<LessonStep | null>(() => {
    const index = progress.value?.current_step;
    return index === null || index === undefined
      ? null
      : (progress.value?.steps[index] ?? null);
  });

  const mascotPose = computed<MascotPose>(() =>
    progress.value?.status === "completed" ? "celebrate" : "idle"
  );

  const liveAnnouncement = computed(() => {
    const p = progress.value;
    if (!p) {
      return "";
    }
    const done = p.steps.filter((s) => s.done).length;
    return `${p.lesson.title}. Đã xong ${done} trên ${p.steps.length} bước.`;
  });

  function stepLabel(step: LessonStep): string {
    const name =
      step.kind === "intro" ? "Làm quen" : (step.title ?? "Trò chơi");
    if (step.done) {
      return `${name} — đã xong`;
    }
    return step.locked ? `${name} — đang khoá` : name;
  }

  let speech: SpeechSynthesisAdapter | null = null;

  function speak(phrase: string): void {
    speech ??= new SpeechSynthesisAdapter();
    speech.speak(phrase);
  }

  async function loadProgress(): Promise<void> {
    isLoading.value = true;
    hasError.value = false;
    try {
      const result = await api<LessonProgress>(
        `/api/users/play/lessons/${encodeURIComponent(lessonCode)}/progress`,
        { method: "POST" }
      );
      progress.value = result;
      showReward.value = result.just_completed;
    } catch {
      // `useApi` đã điều hướng các lỗi cắt ngang (NO_ACTIVE_CHILD…); còn lại
      // thì hiện mascot khích lệ và nút tải lại, không chữ lỗi cho trẻ.
      hasError.value = true;
    } finally {
      isLoading.value = false;
    }
  }

  function playCurrentStep(): void {
    const step = currentStep.value;
    if (!step) {
      return;
    }
    router.push(`/play/${step.level_code}?lesson=${lessonCode}`);
  }

  function leaveLesson(): void {
    showParentGate.value = false;
    showReward.value = false;
    router.push("/play");
  }

  function replayLesson(): void {
    showReward.value = false;
    loadProgress();
  }

  onMounted(loadProgress);
</script>

<style scoped>
  .lesson-surface {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-100);
    padding: 1rem;
  }

  .lesson-hud {
    display: flex;
    justify-content: flex-start;
  }

  .hud-button {
    position: relative;
    width: var(--hud-touch-floor);
    height: var(--hud-touch-floor);
    border-radius: 1.25rem;
    border: 3px solid var(--color-surface-300);
    background-color: var(--color-surface-0, #fff);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

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
      #000 calc(100% - 4px)
    );
    pointer-events: none;
  }

  .lesson-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
  }

  .loading,
  .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;
  }

  .step-dots {
    display: flex;
    gap: 0.75rem;
    list-style: none;
    padding: 0.75rem 1.25rem;
    margin: 0;
    border-radius: 9999px;
    border: 2px solid var(--color-surface-300);
    background-color: var(--color-surface-50);
  }

  .step-dot {
    width: 3rem;
    height: 3rem;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-200);
    color: var(--color-surface-500);
    transition: transform 160ms ease;
  }

  .step-dot--done {
    background-color: var(--color-success-100);
    color: var(--color-success-700);
  }

  .step-dot--current {
    background-color: var(--color-brand-100);
    outline: 3px solid var(--color-brand-500);
    transform: scale(1.15);
  }

  .step-dot--locked {
    opacity: 0.5;
  }

  .step-emoji {
    font-size: 1.5rem;
    line-height: 1;
  }

  .play-button {
    width: 8rem;
    height: 8rem;
    border-radius: 9999px;
    border: none;
    border-bottom: 8px solid var(--color-cta-700, #9a3412);
    background-color: var(--color-cta-500, #f97316);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 10px 20px rgba(121, 89, 0, 0.25);
  }

  .play-button:active {
    transform: translateY(4px);
    border-bottom-width: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .step-dot {
      transition: none;
    }
  }
</style>
