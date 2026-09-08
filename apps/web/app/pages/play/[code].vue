<template>
  <div :class="['game-play-container', `theme-${currentThemeId}`]">
    <!-- Ambient theme background decorative elements -->
    <div aria-hidden="true" class="ambient-theme-layer">
      <div class="ambient-shape shape-1" />
      <div class="ambient-shape shape-2" />
    </div>

    <!-- Loading State -->
    <div class="loading-state" v-if="isLoading">
      <div class="loading-box">
        <span aria-hidden="true" class="loading-emoji animate-bounce">🐻</span>
        <p class="loading-text">Đang chuẩn bị bài học cho bé...</p>
      </div>
    </div>

    <!-- Error State (Pre-reader friendly) -->
    <div class="error-state" v-else-if="errorMessage">
      <div class="error-card">
        <span aria-hidden="true" class="error-emoji">{{ errorEmoji }}</span>
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-desc">{{ errorMessage }}</p>
        <div class="error-actions">
          <button
            aria-label="Nghe hướng dẫn"
            class="btn-audio-speak"
            type="button"
            @click="speakErrorPrompt"
          >
            <UIcon class="w-6 h-6 text-brand-600" name="i-lucide-volume-2" />
            <span>Nghe giải thích</span>
          </button>
          <NuxtLink
            class="btn-primary"
            v-if="errorActionLink"
            :to="errorActionLink"
          >
            {{ errorActionText }}
          </NuxtLink>
          <NuxtLink class="btn-secondary" to="/games">
            Về danh sách trò chơi
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Active Game Viewport -->
    <div class="game-viewport" v-show="!(isLoading || errorMessage)">
      <!-- TOP HUD BAR (Kinder-Tactile Montessori) -->
      <header class="top-hud-bar">
        <!-- Left: Lesson Info Pill with Theme Badge -->
        <div
          class="lesson-info-pill"
          :class="{ 'ring-4 ring-brand-400 animate-pulse': isPromptPillPulsing }"
        >
          <div class="avatar-circle">
            <span aria-hidden="true" class="avatar-emoji">
              {{ currentThemeInfo.icon }}
            </span>
          </div>
          <div class="lesson-meta-box">
            <span class="theme-tag-text">{{ currentThemeInfo.label_vi }}</span>
            <span class="lesson-title-text">{{ displayTitle }}</span>
          </div>
        </div>

        <!-- Center: Round Progress Indicator -->
        <div class="progress-container">
          <KidRoundProgressIndicator
            :current="currentRound"
            :total="totalRounds"
          />
        </div>

        <!-- Right: Actions (Audio Replay, Skip Round, Parent Lock) -->
        <div class="hud-actions">
          <!-- Skip button when scaffolding exhausted -->
          <button
            aria-label="Bỏ qua câu này"
            class="btn-skip-round clay-button"
            type="button"
            v-if="canSkipRound"
            @click="handleSkipRound"
          >
            <UIcon class="w-6 h-6 shrink-0" name="i-lucide-forward" />
            <span class="btn-label">Bỏ qua</span>
          </button>

          <!-- Audio Replay -->
          <button
            aria-label="Nghe lại hướng dẫn"
            class="btn-audio-replay clay-button"
            type="button"
            @click="replayInstructionAudio"
          >
            <UIcon class="w-6 h-6 shrink-0" name="i-lucide-volume-2" />
            <span class="btn-label">Nghe lại</span>
          </button>

          <!-- Parent Lock (800ms Long-Press) -->
          <button
            aria-label="Cổng phụ huynh / Thoát (nhấn giữ 1 giây)"
            class="btn-parent-lock"
            type="button"
            @pointercancel="cancelParentLockHold"
            @pointerdown="startParentLockHold"
            @pointerleave="cancelParentLockHold"
            @pointerup="cancelParentLockHold"
          >
            <div class="relative flex items-center justify-center">
              <svg
                aria-hidden="true"
                class="absolute -inset-1 w-14 h-14 -rotate-90 pointer-events-none"
                viewBox="0 0 36 36"
                v-if="parentLockHoldProgress > 0"
              >
                <path
                  class="text-surface-300"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3.5"
                />
                <path
                  class="text-brand-600 transition-all duration-75"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-width="3.5"
                  :stroke-dasharray="100"
                  :stroke-dashoffset="100 - parentLockHoldProgress"
                />
              </svg>
              <UIcon class="w-6 h-6 text-surface-600" name="i-lucide-lock" />
            </div>
          </button>
        </div>
      </header>

      <!-- MAIN ARENA: Montessori Wooden Tray Canvas -->
      <main class="main-arena">
        <div class="wooden-tray-container">
          <canvas
            class="game-canvas"
            ref="canvasRef"
            @pointercancel="handlePointerCancel"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
          />

          <!-- Accessible DOM buttons for assistive tech & keyboard navigation -->
          <section
            aria-label="Các đối tượng tương tác"
            aria-live="polite"
            class="absolute inset-0 pointer-events-none z-10"
          >
            <button
              class="sr-only focus:not-sr-only focus:fixed focus:z-40 focus:px-4 focus:py-2 focus:rounded-2xl focus:bg-white focus:text-surface-900 focus:border-[3px] focus:border-brand-600 focus:shadow-2xl focus:ring-4 focus:ring-brand-500/30 focus:ring-offset-2 focus:outline-none focus:font-heading focus:font-bold focus:text-base pointer-events-auto transition-all active:scale-95"
              type="button"
              v-for="entity in viewEntities"
              :key="entity.id"
              :aria-label="getAccessibleLabel(entity)"
              :class="{
                'ring-4 ring-warning-500 ring-offset-2 !bg-warning-50':
                  stagedEntityId === entity.id,
              }"
              @click="handleAccessibleEntityTap(entity)"
              @keydown.enter.prevent="handleAccessibleEntityTap(entity)"
              @keydown.space.prevent="handleAccessibleEntityTap(entity)"
            >
              {{ getAccessibleLabel(entity) }}
              <span
                class="ml-1 text-xs text-warning-700"
                v-if="stagedEntityId === entity.id"
              >
                (Đang chọn)
              </span>
            </button>
          </section>

          <!-- Intro Flashcard & Echo Step Controls (GT-000) -->
          <div
            class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20 pointer-events-auto"
            v-if="isIntroCardStep"
          >
            <button
              aria-label="Quay lại thẻ trước"
              class="min-h-16 px-6 rounded-2xl border-[3px] border-surface-300 bg-white text-surface-700 font-heading font-bold text-xl shadow-[0_6px_0_var(--color-surface-300)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-surface-300)] flex items-center gap-2 cursor-pointer transition-all"
              type="button"
              v-if="introStepIndex > 0"
              @click="handleIntroPrev"
            >
              <UIcon class="w-6 h-6" name="i-lucide-arrow-left" />
              <span>Trước</span>
            </button>

            <button
              aria-label="Nghe lại mẫu"
              class="min-h-16 px-6 rounded-2xl border-[3px] border-surface-300 bg-white text-surface-700 font-heading font-bold text-xl shadow-[0_6px_0_var(--color-surface-300)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-surface-300)] flex items-center gap-2 cursor-pointer transition-all"
              type="button"
              @click="handleEchoReplay"
            >
              <UIcon class="w-6 h-6 text-cta" name="i-lucide-volume-2" />
              <span>Nghe lại</span>
            </button>

            <button
              class="min-h-16 px-8 rounded-2xl border-[3px] border-cta-hover bg-cta text-white font-heading font-bold text-xl shadow-[0_6px_0_var(--color-cta-hover)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-cta-hover)] flex items-center gap-3 cursor-pointer transition-all"
              type="button"
              :aria-label="isEchoStep ? 'Bé nói theo' : 'Tiếp tục'"
              @click="handleEchoDone"
            >
              <UIcon class="w-6 h-6" name="i-lucide-mic" v-if="isEchoStep" />
              <span>{{ isEchoStep ? "Bé nói theo" : "Tiếp tục" }}</span>
              <UIcon class="w-6 h-6" name="i-lucide-arrow-right" />
            </button>
          </div>
        </div>
      </main>

      <!-- Victory Celebration Modal -->
      <KidVictoryModal
        :celebration="earnedCelebration"
        :is-intro="isIntroLevel"
        :show="showVictoryModal"
        :stars="earnedStars"
        @continue="handleContinueNext"
        @replay="handleReplayGame"
      />

      <!-- Parent Gate Exit Modal -->
      <ParentGateModal
        v-if="showParentGate"
        :client-only="true"
        @cancel="showParentGate = false"
        @verified="handleParentVerified"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { ViewEntity } from "@mindkid/game-engine";
  import { TemplateGameSession } from "@mindkid/game-engine";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import { usePlayAudio } from "~/composables/play/use-play-audio";
  import { usePlayError } from "~/composables/play/use-play-error";
  import { usePlayGesture } from "~/composables/play/use-play-gesture";
  import { usePlaySession } from "~/composables/play/use-play-session";
  import { usePlayThemes } from "~/composables/play/use-play-themes";

  const route = useRoute();
  const router = useRouter();
  const levelCode = route.params.code as string;
  const { loggedIn, fetch: fetchSession } = useUserSession();

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const showParentGate = ref(false);
  const isPromptPillPulsing = ref(false);
  const parentLockHoldProgress = ref(0);

  let holdTimer: ReturnType<typeof setInterval> | null = null;
  let pulseTimer: ReturnType<typeof setTimeout> | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  const {
    errorMessage,
    errorTitle,
    errorEmoji,
    errorActionLink,
    errorActionText,
    handleApiError,
  } = usePlayError();

  const playSession = usePlaySession({
    canvasRef,
    loggedIn,
    syncView: () => gesture.syncView(),
  });

  const {
    isLoading,
    displayTitle,
    currentThemeId,
    totalRounds,
    currentRound,
    canSkipRound,
    isEchoStep,
    isIntroCardStep,
    introStepIndex,
    showVictoryModal,
    earnedCelebration,
    earnedStars,
    getEngine,
    getRoundRunner,
    getCachedPayload,
    fetchAndStartGame,
    handleSkipRound,
    setPaused,
    cleanupSession,
  } = playSession;

  const { currentThemeInfo } = usePlayThemes(currentThemeId);

  const gesture = usePlayGesture({
    getEngine,
    canvasRef,
    onRoundWon: playSession.handleRoundWonInternal,
  });

  const {
    viewEntities,
    stagedEntityId,
    dispatchGesture,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleAccessibleEntityTap,
  } = gesture;

  const { stopNarrationAudio, playInstructionNarration, speakErrorPrompt } =
    usePlayAudio({
      getEngine,
      onFallbackCue: triggerVisualFallbackCue,
    });

  const isIntroLevel = computed(() => {
    const cached = getCachedPayload();
    return (
      cached?.template_code === "GT-000" ||
      Boolean(route.query.return_to) ||
      Boolean(route.query.return_level_code)
    );
  });

  function getAccessibleLabel(entity: ViewEntity): string {
    if (entity.spokenLabel) {
      return entity.spokenLabel;
    }
    if (entity.glyph) {
      return `Ký hiệu ${entity.glyph}`;
    }
    if (entity.label) {
      return entity.label;
    }
    if (entity.role === "target") {
      return `Ô đích ${entity.id}`;
    }
    if (entity.role === "source") {
      return `Vật phẩm ${entity.id}`;
    }
    return `Đối tượng ${entity.id}`;
  }

  function triggerVisualFallbackCue(): void {
    const engine = getEngine();
    if (engine?.scaffolding) {
      const targetIdx =
        engine.activeSession instanceof TemplateGameSession
          ? engine.activeSession.getHintTargetIndex()
          : null;
      engine.scaffolding.triggerVisualFallback(targetIdx ?? undefined);
    }
    isPromptPillPulsing.value = true;
    if (pulseTimer) {
      clearTimeout(pulseTimer);
    }
    pulseTimer = setTimeout(() => {
      isPromptPillPulsing.value = false;
    }, 1200);
  }

  function startParentLockHold(): void {
    parentLockHoldProgress.value = 0;
    const startTime = Date.now();
    const duration = 800;

    if (holdTimer !== null) {
      clearInterval(holdTimer);
    }

    holdTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.round((elapsed / duration) * 100));
      parentLockHoldProgress.value = progress;

      if (progress >= 100) {
        if (holdTimer !== null) {
          clearInterval(holdTimer);
          holdTimer = null;
        }
        parentLockHoldProgress.value = 0;
        showParentGate.value = true;
      }
    }, 40);
  }

  function cancelParentLockHold(): void {
    if (holdTimer !== null) {
      clearInterval(holdTimer);
      holdTimer = null;
    }
    parentLockHoldProgress.value = 0;
  }

  function handleParentVerified(): void {
    showParentGate.value = false;
    const returnTo = route.query.return_to || route.query.return_level_code;
    if (typeof returnTo === "string" && returnTo) {
      router.push(`/play/${returnTo}`);
      return;
    }
    router.push("/games");
  }

  function replayInstructionAudio(): void {
    const engine = getEngine();
    engine?.audio.playTapSound();
    const currentRoundCfg = getRoundRunner()?.getCurrentRoundConfig();
    const prompt =
      (currentRoundCfg?.content_pack as { prompt?: string })?.prompt ||
      currentRoundCfg?.instruction ||
      getCachedPayload()?.title;
    playInstructionNarration(prompt);
  }

  function handleEchoReplay(): void {
    dispatchGesture({
      type: "commit",
      timeMs: Date.now(),
      intent: "replay",
    });
  }

  function handleEchoDone(): void {
    dispatchGesture({
      type: "commit",
      timeMs: Date.now(),
      intent: "advance",
    });
  }

  function handleIntroPrev(): void {
    dispatchGesture({
      type: "commit",
      timeMs: Date.now(),
      intent: "prev",
    });
  }

  function handleContinueNext(): void {
    showVictoryModal.value = false;
    const returnTo = route.query.return_to || route.query.return_level_code;
    if (typeof returnTo === "string" && returnTo) {
      router.push(`/play/${returnTo}`);
      return;
    }
    router.push("/games");
  }

  function handleReplayGame(): void {
    showVictoryModal.value = false;
    isLoading.value = true;
    fetchAndStartGame(levelCode).catch(
      (err: Error | Record<string, string | number>) => {
        isLoading.value = false;
        const appErr = handleApiError(err, levelCode, loggedIn.value);
        errorMessage.value = appErr.message;
      }
    );
  }

  function handleResize(): void {
    if (resizeTimer !== null) {
      clearTimeout(resizeTimer);
    }
    resizeTimer = setTimeout(() => {
      const engine = getEngine();
      const roundRunner = getRoundRunner();
      if (engine && canvasRef.value) {
        const vp = engine.renderSystem.setupCanvas(canvasRef.value);
        if (vp.logicSpace && roundRunner) {
          roundRunner.setLogicSpace(vp.logicSpace);
        }
      }
    }, 150);
  }

  function handleVisibilityChange(): void {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      setPaused(true, "tab_hidden");
    } else if (!(showVictoryModal.value || showParentGate.value)) {
      setPaused(false);
    }
  }

  watch([showVictoryModal, showParentGate], ([victoryOpen, gateOpen]) => {
    if (victoryOpen || gateOpen) {
      setPaused(true, victoryOpen ? "victory_modal" : "parent_gate");
    } else if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      setPaused(false);
    }
  });

  onMounted(async () => {
    window.addEventListener("resize", handleResize);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (!loggedIn.value) {
      await fetchSession().catch(() => {
        // guest session
      });
    }
    try {
      isLoading.value = true;
      errorMessage.value = null;
      await fetchAndStartGame(levelCode);
    } catch (err) {
      isLoading.value = false;
      const appErr = handleApiError(
        err as Error | Record<string, string | number>,
        levelCode,
        loggedIn.value
      );
      errorMessage.value = appErr.message;
    }
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    }
    cancelParentLockHold();
    if (pulseTimer !== null) {
      clearTimeout(pulseTimer);
    }
    if (resizeTimer !== null) {
      clearTimeout(resizeTimer);
    }
    stopNarrationAudio();
    cleanupSession();
  });
</script>

<style scoped>
  @import "~/assets/css/play-surface.css";
</style>
