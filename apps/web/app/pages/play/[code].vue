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
      <!-- TOP HUD BAR — đúng ba nút: khoá phụ huynh, hạt tiến độ, loa nghe
           lại (`BR-PSZ-07`). Nhãn chữ chỉ là aria-label. -->
      <header
        class="top-hud-bar"
        :class="{ 'ring-4 ring-brand-400 animate-pulse': isPromptPillPulsing }"
        :style="{ '--hud-touch-floor': `${hudTouchFloorPx}px` }"
      >
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

        <!-- Round Progress Indicator -->
        <div class="progress-container">
          <KidRoundProgressIndicator
            :current="currentRound"
            :total="totalRounds"
          />
        </div>

        <!-- Audio Replay -->
        <button
          aria-label="Nghe lại hướng dẫn"
          class="btn-audio-replay clay-button"
          type="button"
          @click="replayInstructionAudio"
        >
          <UIcon class="w-6 h-6 shrink-0" name="i-lucide-volume-2" />
        </button>
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
          <!-- Vùng thông báo riêng: `aria-live` Cấm — NEVER đặt trên container
               chứa button, vì mỗi lần đổi vòng screen reader sẽ đọc lại cả
               danh sách đối tượng (BR-A11). -->
          <div aria-live="polite" class="sr-only" role="status">
            {{ liveAnnouncement }}
          </div>

          <section
            aria-label="Các đối tượng tương tác"
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

          <!-- Bỏ qua câu này — chỗ tạm ở góc đối diện nút hành động tương lai
               (`D-277-7`, `zones.action` dựng ở #277 S4). Ra khỏi HUD để giữ
               đúng ba nút của `BR-PSZ-07`. -->
          <button
            aria-label="Bỏ qua câu này"
            class="btn-skip-floating clay-button"
            type="button"
            v-if="canSkipRound"
            @click="handleSkipRound"
          >
            <UIcon class="w-6 h-6 shrink-0" name="i-lucide-forward" />
          </button>

          <!-- Nút bước làm quen GT-000: chỉ icon, chữ ở aria-label (`BR-FBK-12`, `BR-PSZ-07`) -->
          <div
            class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 z-20 pointer-events-auto"
            v-if="isIntroCardStep"
          >
            <button
              aria-label="Quay lại thẻ trước"
              class="min-h-16 min-w-16 px-4 justify-center rounded-2xl border-[3px] border-surface-300 bg-white text-surface-700 font-heading font-bold text-xl shadow-[0_6px_0_var(--color-surface-300)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-surface-300)] flex items-center gap-2 cursor-pointer transition-all"
              type="button"
              v-if="introStepIndex > 0"
              @click="handleIntroPrev"
            >
              <UIcon class="w-8 h-8" name="i-lucide-arrow-left" />
            </button>

            <button
              aria-label="Nghe lại mẫu"
              class="min-h-16 min-w-16 px-4 justify-center rounded-2xl border-[3px] border-surface-300 bg-white text-surface-700 font-heading font-bold text-xl shadow-[0_6px_0_var(--color-surface-300)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-surface-300)] flex items-center gap-2 cursor-pointer transition-all"
              type="button"
              @click="handleEchoReplay"
            >
              <UIcon class="w-8 h-8 text-cta" name="i-lucide-volume-2" />
            </button>

            <button
              class="min-h-16 min-w-20 px-6 justify-center rounded-2xl border-[3px] border-cta-hover bg-cta text-white font-heading font-bold text-xl shadow-[0_6px_0_var(--color-cta-hover)] active:translate-y-1 active:shadow-[0_2px_0_var(--color-cta-hover)] flex items-center gap-3 cursor-pointer transition-all"
              type="button"
              :aria-label="isEchoStep ? 'Bé nói theo' : 'Tiếp tục'"
              @click="handleEchoDone"
            >
              <UIcon class="w-8 h-8" name="i-lucide-mic" v-if="isEchoStep" />
              <UIcon class="w-8 h-8" name="i-lucide-arrow-right" v-else />
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
        @announce="speakCelebration"
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
  import {
    computeStageZones,
    drawCommitButton,
    drawFeedbackPulses,
    drawPromptZone,
    FeedbackOverlay,
    type GameEngine,
    getTouchFloor,
    type MascotPose,
    type StageZones,
    TemplateGameSession,
    type ViewEntity,
  } from "@mindkid/game-engine";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import { useMascotSprites } from "~/composables/play/use-mascot-sprites";
  import { useParentLockHold } from "~/composables/play/use-parent-lock-hold";
  import { usePlayAudio } from "~/composables/play/use-play-audio";
  import { usePlayError } from "~/composables/play/use-play-error";
  import { usePlayGesture } from "~/composables/play/use-play-gesture";
  import { usePlaySession } from "~/composables/play/use-play-session";

  // Bề mặt chơi của trẻ: không navbar/footer/liên kết rời trang (`BR-PSZ-11`).
  definePageMeta({ layout: "kid" });

  const route = useRoute();
  const router = useRouter();
  const levelCode = route.params.code as string;

  const LESSON_CODE_PATTERN = /^LES-\d{4}$/;

  /** Mã bài khi trang chơi là một bước của bài (`child-lesson-flow.md`); sai định dạng thì bỏ qua. */
  function lessonCodeFromQuery(): string | null {
    const raw = route.query.lesson;
    return typeof raw === "string" && LESSON_CODE_PATTERN.test(raw)
      ? raw
      : null;
  }

  /** Đích quay về sau một level: level gốc của bài làm quen, rồi trang bài, rồi danh mục. */
  function nextDestination(): string {
    const lessonCode = lessonCodeFromQuery();
    const returnTo = route.query.return_to || route.query.return_level_code;
    if (typeof returnTo === "string" && returnTo) {
      return lessonCode
        ? `/play/${returnTo}?lesson=${lessonCode}`
        : `/play/${returnTo}`;
    }
    return lessonCode ? `/play/lesson/${lessonCode}` : "/games";
  }
  const { loggedIn, fetch: fetchSession } = useUserSession();

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const showParentGate = ref(false);
  const isPromptPillPulsing = ref(false);
  const {
    progress: parentLockHoldProgress,
    start: startParentLockHold,
    cancel: cancelParentLockHold,
  } = useParentLockHold(() => {
    showParentGate.value = true;
  });

  let pulseTimer: ReturnType<typeof setTimeout> | null = null;
  let resizeTimer: ReturnType<typeof setTimeout> | null = null;

  /** Lớp phủ phản hồi chung cho mọi engine (`BR-FBK-11`). */
  const feedbackOverlay = new FeedbackOverlay();
  const mascotSprites = useMascotSprites();

  /** Dáng nền khi không có phản hồi đang giữ: nghe lời dẫn, trợ giúp, hay nghỉ (§7.4). */
  function baseMascotPose(engine: GameEngine | null): MascotPose {
    if (!engine?.acceptingInput) {
      return "listen";
    }
    if ((engine.scaffolding?.getCurrentLevel() ?? 0) > 0) {
      return "hint";
    }
    return "idle";
  }

  const {
    errorMessage,
    errorTitle,
    errorEmoji,
    errorActionLink,
    errorActionText,
    handleApiError,
  } = usePlayError({ lessonCode: lessonCodeFromQuery() });

  const playSession = usePlaySession({
    canvasRef,
    loggedIn,
    syncView: () => gesture.syncView(),
    onAfterRender: (ctx, rs, now) => {
      const zones = stageZones.value ?? updateStageZones();
      if (!zones) {
        return;
      }
      const engine = getEngine();
      const session = engine?.activeSession;
      const feedback = feedbackOverlay.frame(
        now,
        baseMascotPose(engine),
        rs.reducedMotion
      );
      const activePrompt = session?.getView?.().activePrompt;
      if (activePrompt) {
        drawPromptZone(ctx, rs, zones, {
          promptText: activePrompt,
          mascotPose: feedback.mascotPose,
          mascotElapsedMs: feedback.mascotElapsedMs,
          mascotSprites: mascotSprites.value,
        });
      }
      if (session instanceof TemplateGameSession && session.needsCommit) {
        drawCommitButton(ctx, rs, zones.action, {
          enabled: session.canCommit?.() ?? true,
          origin: "top-left",
        });
      }
      // Lớp trên cùng: pop/nhịp hổ phách tại điểm chạm (`BR-FBK-05`, `BR-FBK-11`).
      drawFeedbackPulses(ctx, feedback.pulses);
    },
  });

  const {
    isLoading,
    currentThemeId,
    ageBand,
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

  /** Màn tổng kết đọc lời khen thành tiếng (`BR-FBK-12`). */
  function speakCelebration(phrase: string): void {
    getEngine()?.audio.speakPrompt(phrase);
  }

  /** Sàn chạm HUD theo band tuổi, trên px CSS thật — HUD là DOM (`D-277-2`, `BR-PSZ-04`). */
  const hudTouchFloorPx = computed(() => getTouchFloor(ageBand.value));

  /** Vùng của bàn chơi (`play-stage-zones.md`, `BR-PSZ-01..04`). */
  const stageZones = ref<StageZones | null>(null);

  function updateStageZones(): StageZones | null {
    const engine = getEngine();
    if (!engine) {
      return null;
    }
    const vp = engine.renderSystem?.viewport;
    if (!vp?.logicSpace) {
      return null;
    }
    const session = engine.activeSession;
    const zones = computeStageZones({
      logicW: vp.logicSpace.w,
      logicH: vp.logicSpace.h,
      ageBand: ageBand.value,
      cssPerLogic: vp.scale,
      needsTray:
        session instanceof TemplateGameSession
          ? Boolean(session.needsTray)
          : false,
      needsCommit:
        session instanceof TemplateGameSession
          ? Boolean(session.needsCommit)
          : false,
    });
    stageZones.value = zones;
    return zones;
  }

  const gesture = usePlayGesture({
    getEngine,
    canvasRef,
    onRoundWon: playSession.handleRoundWonInternal,
    onRetryDisallowed: playSession.handleRetryDisallowed,
    getStageZones: () => stageZones.value ?? updateStageZones(),
    onPromptSpeakerTap: replayInstructionAudio,
    onFeedback: (kind, point) =>
      feedbackOverlay.trigger(kind, point, performance.now()),
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

  const { stopNarrationAudio, speakErrorPrompt } = usePlayAudio({
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

  /** Câu thông báo cho screen reader — đổi theo lượt chọn và theo vòng chơi. */
  const liveAnnouncement = computed(() => {
    const staged = viewEntities.value.find(
      (entity) => entity.id === stagedEntityId.value
    );
    if (staged) {
      return `Đã chọn ${getAccessibleLabel(staged)}. Chọn ô đích rồi bấm Enter để thả.`;
    }
    return `Vòng ${currentRound.value + 1} trên ${totalRounds.value}.`;
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
    // Đi qua RoundRunner để "Nghe lại" dùng đúng nguồn giọng đã phát lúc mở
    // vòng (BR-PNR-03, BR-PNR-07). Gọi thẳng đường phát của trang thì bản ghi
    // mp3 của vòng chưa bao giờ được nạp vào đó, nên trẻ chỉ nghe được giọng
    // máy đọc lại chữ.
    getRoundRunner()?.replayCurrentRoundNarration();
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
    router.push(nextDestination());
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
        const zones = updateStageZones();
        if (vp.logicSpace && roundRunner) {
          if (zones?.stage) {
            roundRunner.setLogicSpace(
              vp.logicSpace,
              zones.stage,
              zones.tray ?? undefined
            );
          } else {
            roundRunner.setLogicSpace(vp.logicSpace);
          }
        }
        // Slot vừa tính lại theo logic space mới — danh sách nút ẩn cho bàn
        // phím/screen reader phải trỏ toạ độ mới trong cùng nhịp (`BR-PSZ-12`),
        // không phải chờ vòng chơi kế tiếp mới đồng bộ (H11).
        gesture.syncView();
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

  // Vòng mới không mang pop hay dáng của vòng trước.
  watch(currentRound, () => feedbackOverlay.reset());

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
