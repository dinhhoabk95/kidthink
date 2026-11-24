<template>
  <div :class="['game-play-container', `theme-${currentThemeId}`]">
    <div aria-hidden="true" class="ambient-theme-layer">
      <div class="ambient-shape shape-1" />
      <div class="ambient-shape shape-2" />
    </div>

    <div class="loading-state" v-if="isLoading">
      <div class="loading-box">
        <KidMascot :pose="'listen'" :size="96" />
        <p class="loading-text">Đang chuẩn bị bài học cho bé...</p>
      </div>
    </div>

    <div class="error-state" v-else-if="errorMessage">
      <div class="error-card">
        <KidMascot :pose="'encourage'" :size="96" />
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-desc">{{ errorMessage }}</p>
        <div class="error-actions">
          <button
            aria-label="Nghe hướng dẫn"
            class="btn-audio-speak min-h-16 min-w-16"
            type="button"
            @click="speakErrorPrompt"
          >
            <UIcon class="w-6 h-6 text-brand-600" name="i-lucide-volume-2" />
            <span>Nghe giải thích</span>
          </button>
          <button
            class="btn-primary min-h-16 min-w-16"
            type="button"
            v-if="errorActionText"
            @click="handleErrorAction"
          >
            {{ errorActionText }}
          </button>
          <NuxtLink class="btn-secondary min-h-16 min-w-16" to="/play">
            Về sảnh trò chơi
          </NuxtLink>
        </div>
      </div>
    </div>
    <div
      class="game-viewport"
      v-show="!(isLoading || errorMessage)"
      :style="{ '--hud-touch-floor': `${hudTouchFloorPx}px` }"
    >
      <header
        class="top-hud-bar"
        :class="{ 'ring-4 ring-brand-400 animate-pulse': isPromptPillPulsing }"
        :style="{ '--hud-touch-floor': `${hudTouchFloorPx}px` }"
      >
        <button
          aria-label="Cổng phụ huynh / Thoát (nhấn giữ 1 giây)"
          class="btn-parent-lock min-h-16 min-w-16"
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
        <div class="progress-container">
          <KidRoundProgressIndicator
            :current="currentRound"
            :total="totalRounds"
          />
        </div>
        <button
          aria-label="Nghe lại hướng dẫn"
          class="btn-audio-replay clay-button min-h-16 min-w-16"
          type="button"
          @click="replayInstructionAudio"
        >
          <UIcon class="w-6 h-6 shrink-0" name="i-lucide-volume-2" />
        </button>
      </header>
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
          <div
            class="portrait-gate"
            role="alert"
            v-if="needsPortrait"
            :aria-label="PORTRAIT_GATE_LABEL"
            @pointerdown="attemptPortraitLock"
          >
            <UIcon
              aria-hidden="true"
              class="portrait-gate__icon"
              name="i-lucide-smartphone"
            />
            <UIcon
              aria-hidden="true"
              class="portrait-gate__arrow"
              name="i-lucide-rotate-cw"
            />
            <span class="sr-only">{{ PORTRAIT_GATE_LABEL }}</span>
            <p
              aria-live="polite"
              class="portrait-gate__hint"
              v-if="showPortraitParentHint"
            >
              {{ PORTRAIT_GATE_PARENT_HINT }}
            </p>
          </div>
          <KidPlayAccessibleStage
            :action-button="actionButton"
            :current-round="currentRound"
            :staged-entity-id="stagedEntityId"
            :total-rounds="totalRounds"
            :view-entities="viewEntities"
            @action-press="pressActionButton"
            @entity-tap="handleAccessibleEntityTap"
          />
          <button
            aria-label="Bỏ qua câu này"
            class="btn-skip-floating clay-button min-h-16 min-w-16"
            type="button"
            v-if="canSkipRound"
            @click="handleSkipRound"
          >
            <UIcon class="w-6 h-6 shrink-0" name="i-lucide-forward" />
          </button>
        </div>
      </main>
      <KidPlayIntroControls
        v-if="isIntroCardStep"
        :intro-step-index="introStepIndex"
        :is-echo-step="isEchoStep"
        @advance="handleEchoDone"
        @prev="handleIntroPrev"
        @replay="handleEchoReplay"
      />
      <KidVictoryModal
        :age-band="ageBand"
        :celebration="earnedCelebration"
        :is-guest="!loggedIn"
        :is-intro="isIntroLevel"
        :koguma-unit-code="queryKogumaCode"
        :level-code="levelCode"
        :moet-theme-id="queryMoetThemeId"
        :show="showVictoryModal"
        :skill-code="activeSkillCode"
        :stars="earnedStars"
        :sticker="earnedSticker"
        :template-code="getCachedPayload()?.template_code"
        :theme-id="currentThemeId"
        @announce="speakCelebration"
        @continue="handleContinueNext"
        @replay="handleReplayGame"
      />
    </div>
    <ParentGateModal
      v-if="showParentGate"
      :client-only="true"
      @cancel="showParentGate = false"
      @verified="handleParentVerified"
    />
    <KidPlayLimitModal
      v-if="isPlayLimitReached"
      :child-uuid="activeChildUuid"
      @granted="handleExtraTimeGranted"
      @leave="router.push('/play')"
    />
  </div>
</template>

<script lang="ts" setup>
  import {
    computeZonesForSession,
    drawActiveGestureOverlay,
    drawCommitButton,
    drawFeedbackPulses,
    drawPromptZone,
    FeedbackOverlay,
    type GameEngine,
    getTouchFloor,
    type MascotPose,
    resolveBaseMascotPose,
    type StageZones,
    TemplateGameSession,
  } from "@mindkid/game-engine";
  import { computed, onMounted, onUnmounted, ref, watch } from "vue";
  import KidMascot from "~/components/kid/mascot.vue";
  import KidPlayAccessibleStage from "~/components/kid/play-accessible-stage.vue";
  import KidPlayIntroControls from "~/components/kid/play-intro-controls.vue";
  import { resolveNextPlayDestination } from "~/composables/play/adventure-navigation";
  import {
    attachPlayDebugBridge,
    createClientPointMapper,
    detachPlayDebugBridge,
  } from "~/composables/play/play-debug-bridge";
  import {
    PORTRAIT_GATE_LABEL,
    PORTRAIT_GATE_PARENT_HINT,
    PORTRAIT_GATE_PARENT_HINT_DELAY_MS,
    readOrientationEnv,
    releaseOrientationLock,
    resolveRequiresPortrait,
    tryLockPortrait,
  } from "~/composables/play/play-portrait-gate";
  import { resolveZonePromptText } from "~/composables/play/play-prompt-zone";
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

  const nextDestination = (): string => resolveNextPlayDestination(route.query);
  const { loggedIn, fetch: fetchSession } = useUserSession();

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const showParentGate = ref(false);
  const pendingParentNavigation = ref("");
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
  let canvasObserver: ResizeObserver | null = null;

  const feedbackOverlay = new FeedbackOverlay();
  const mascotSprites = useMascotSprites();

  function baseMascotPose(engine: GameEngine | null): MascotPose {
    return resolveBaseMascotPose({
      acceptingInput: engine?.acceptingInput ?? false,
      hintLevel: engine?.scaffolding?.getCurrentLevel() ?? 0,
      session: engine?.activeSession,
    });
  }

  const {
    errorMessage,
    errorTitle,
    errorEmoji,
    errorActionLink,
    errorActionText,
    isPlayLimitReached,
    handleApiError,
  } = usePlayError();

  const activeChildCookie = useCookie<string | null>("active_child_id");
  const activeChildUuid = computed(() => activeChildCookie.value ?? "");

  function applyLoadError(err: Error | Record<string, string | number>): void {
    isLoading.value = false;
    errorMessage.value = handleApiError(err, levelCode, loggedIn.value).message;
  }

  async function handleExtraTimeGranted(): Promise<void> {
    isPlayLimitReached.value = false;
    errorMessage.value = null;
    isLoading.value = true;
    try {
      await fetchAndStartGame(levelCode);
      observeCanvasSize();
    } catch (err) {
      applyLoadError(err as Error | Record<string, string | number>);
    }
  }

  const playSession = usePlaySession({
    canvasRef,
    loggedIn,
    syncView: () => gesture.syncView(),
    onFallbackCue: triggerVisualFallbackCue,
    refreshStageZones: updateStageZones,
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
      const activePrompt = resolveZonePromptText(session);
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
          icon: session.commitIcon,
          hint: engine?.actionHinted
            ? { timeMs: now, reducedMotion: rs.reducedMotion }
            : undefined,
        });
      }
      const gestureVisual = gesture.getGestureVisualState?.(now);
      if (gestureVisual) {
        drawActiveGestureOverlay(ctx, rs, gestureVisual, now);
      }
      feedbackOverlay.drawMilestoneBanner(ctx, rs, now, zones.stage);
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
    earnedSticker,
    getEngine,
    getRoundRunner,
    getCachedPayload,
    fetchAndStartGame,
    handleSkipRound,
    setPaused,
    cleanupSession,
  } = playSession;

  function speakCelebration(phrase: string): void {
    getEngine()?.audio.speakPrompt(phrase);
  }

  const hudTouchFloorPx = computed(() => getTouchFloor(ageBand.value));
  const stageZones = ref<StageZones | null>(null);
  const needsPortrait = ref(false);
  const showPortraitParentHint = ref(false);
  let portraitHintTimer: ReturnType<typeof setTimeout> | null = null;

  function clearPortraitHintTimer(): void {
    if (portraitHintTimer !== null) {
      clearTimeout(portraitHintTimer);
      portraitHintTimer = null;
    }
  }

  function attemptPortraitLock(): void {
    const env = readOrientationEnv();
    if (env) {
      tryLockPortrait(env);
    }
  }

  function syncPortraitGate(): void {
    const next = resolveRequiresPortrait(getEngine()?.activeSession);
    if (next === needsPortrait.value) {
      return;
    }
    needsPortrait.value = next;
    clearPortraitHintTimer();
    showPortraitParentHint.value = false;
    if (next) {
      attemptPortraitLock();
      portraitHintTimer = setTimeout(() => {
        showPortraitParentHint.value = needsPortrait.value;
      }, PORTRAIT_GATE_PARENT_HINT_DELAY_MS);
      setPaused(true, "rotate_device");
    } else if (!(showVictoryModal.value || showParentGate.value)) {
      setPaused(false);
    }
  }

  function updateStageZones(): StageZones | null {
    const engine = getEngine();
    if (!engine) {
      return null;
    }
    const vp = engine.renderSystem?.viewport;
    if (!vp?.logicSpace) {
      return null;
    }
    const zones = computeZonesForSession(
      {
        logicW: vp.logicSpace.w,
        logicH: vp.logicSpace.h,
        ageBand: ageBand.value,
        cssPerLogic: vp.scale,
      },
      engine.activeSession
    );
    stageZones.value = zones;
    return zones;
  }

  let roundWonPending = false;

  const gesture = usePlayGesture({
    getEngine,
    getAgeBand: () => ageBand.value,
    canvasRef,
    onRoundWon: () => {
      roundWonPending = true;
      playSession.handleRoundWonInternal();
    },
    onRetryDisallowed: playSession.handleRetryDisallowed,
    onVerdict: playSession.handleAnswerVerdict,
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
    actionButton,
    pressActionButton,
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

  function handleErrorAction(): void {
    if (!errorActionLink.value) {
      handleReplayGame();
      return;
    }
    if (errorActionLink.value.startsWith("/play")) {
      navigateTo(errorActionLink.value);
    } else {
      pendingParentNavigation.value = errorActionLink.value;
      showParentGate.value = true;
    }
  }

  function handleParentVerified(): void {
    showParentGate.value = false;
    if (pendingParentNavigation.value) {
      const target = pendingParentNavigation.value;
      pendingParentNavigation.value = "";
      navigateTo(
        target.startsWith("/") && !target.startsWith("//") ? target : "/play"
      );
      return;
    }
    router.push(nextDestination());
  }

  function replayInstructionAudio(): void {
    const engine = getEngine();
    engine?.audio.playTapSound();
    getRoundRunner()?.replayCurrentRoundNarration();
  }

  function sendCommitIntent(intent: "replay" | "advance" | "prev"): void {
    dispatchGesture({ type: "commit", timeMs: Date.now(), intent });
  }
  const handleEchoReplay = () => sendCommitIntent("replay");
  const handleEchoDone = () => sendCommitIntent("advance");
  const handleIntroPrev = () => sendCommitIntent("prev");

  function handleContinueNext(): void {
    showVictoryModal.value = false;
    router.push(nextDestination());
  }

  const queryKogumaCode = computed(() =>
    typeof route.query.kgm === "string" ? route.query.kgm : undefined
  );
  const queryMoetThemeId = computed(() =>
    typeof route.query.moet === "string" ? route.query.moet : undefined
  );
  const activeSkillCode = computed(() => {
    const skill = getCachedPayload()?.content_pack?.skill_code;
    return typeof skill === "string" ? skill : undefined;
  });

  function handleReplayGame(): void {
    roundWonPending = false;
    cleanupSession();
    showVictoryModal.value = false;
    errorMessage.value = null;
    isLoading.value = true;
    fetchAndStartGame(levelCode).catch(applyLoadError);
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
              zones.tray ?? undefined,
              vp.scale
            );
          } else {
            roundRunner.setLogicSpace(vp.logicSpace);
          }
        }
        gesture.syncView();
        syncPortraitGate();
      }
    }, 150);
  }

  function handleVisibilityChange(): void {
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      setPaused(true, "tab_hidden");
    } else if (
      !(showVictoryModal.value || showParentGate.value || needsPortrait.value)
    ) {
      setPaused(false);
    }
  }

  watch(currentRound, (next, prev) => {
    feedbackOverlay.reset();
    if (roundWonPending && prev !== undefined && next > prev) {
      roundWonPending = false;
      feedbackOverlay.triggerMilestone(
        "praise",
        ageBand.value,
        performance.now()
      );
    } else {
      roundWonPending = false;
    }
  });

  watch(
    [showVictoryModal, showParentGate, isPlayLimitReached],
    ([victoryOpen, gateOpen, limitReached], [prevVictory]) => {
      if (victoryOpen && !prevVictory) {
        roundWonPending = false;
        feedbackOverlay.celebrate(ageBand.value, performance.now());
      }
      if (victoryOpen || gateOpen || limitReached) {
        let pauseReason = "parent_gate";
        if (limitReached) {
          pauseReason = "play_limit";
        } else if (victoryOpen) {
          pauseReason = "victory_modal";
        }
        setPaused(true, pauseReason);
      } else if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        !needsPortrait.value
      ) {
        setPaused(false);
      }
    }
  );

  function observeCanvasSize(): void {
    if (typeof ResizeObserver === "undefined" || !canvasRef.value) {
      return;
    }
    canvasObserver?.disconnect();
    canvasObserver = new ResizeObserver(() => handleResize());
    canvasObserver.observe(canvasRef.value);
  }

  let debugBridgeRef: Parameters<typeof attachPlayDebugBridge>[0] | undefined;

  onMounted(async () => {
    debugBridgeRef = {
      getEngine,
      getRoundRunner,
      getStageZones: () => stageZones.value ?? updateStageZones(),
      getCachedPayload,
      dispatchGesture,
      pressActionButton,
      toClientPoint: createClientPointMapper(canvasRef, getEngine),
      getState: () => ({
        isLoading: isLoading.value,
        errorMessage: errorMessage.value,
        currentRound: currentRound.value,
        totalRounds: totalRounds.value,
        showVictoryModal: showVictoryModal.value,
        earnedStars: earnedStars.value,
        earnedCelebration: earnedCelebration.value,
        needsPortrait: needsPortrait.value,
        isEchoStep: isEchoStep.value,
        isIntroCardStep: isIntroCardStep.value,
        introStepIndex: introStepIndex.value,
        acceptingInput: Boolean(getEngine()?.acceptingInput),
        actionButton: actionButton.value,
        viewEntitiesCount: viewEntities.value.length,
      }),
    };
    attachPlayDebugBridge(debugBridgeRef);
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
      observeCanvasSize();
    } catch (err) {
      applyLoadError(err as Error | Record<string, string | number>);
    }
  });

  onUnmounted(() => {
    detachPlayDebugBridge(debugBridgeRef);
    window.removeEventListener("resize", handleResize);
    canvasObserver?.disconnect();
    canvasObserver = null;
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
    clearPortraitHintTimer();
    const orientationEnv = readOrientationEnv();
    if (orientationEnv) {
      releaseOrientationLock(orientationEnv);
    }
    stopNarrationAudio();
    cleanupSession();
  });
</script>

<style scoped>
  @import "~/assets/css/play-surface.css";
</style>
