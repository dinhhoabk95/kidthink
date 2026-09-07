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

          <!-- Visually hidden accessible buttons for assistive tech -->
          <section
            aria-label="Các đối tượng tương tác"
            aria-live="polite"
            class="sr-only"
          >
            <button
              type="button"
              v-for="entity in viewEntities"
              :key="entity.id"
              :aria-label="`Chọn đối tượng ${entity.id}`"
              @click="handleAccessibleEntityTap(entity)"
            >
              Chọn đối tượng {{ entity.id }}
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
  import {
    createGameSessionSync,
    type EngineConfig,
    GameEngine,
    preloadGameSession,
    type RoundConfig,
    RoundRunner,
    type Slot,
  } from "@mindkid/game-engine";
  import { usePlayError } from "~/composables/play/use-play-error";
  import { usePlayGesture } from "~/composables/play/use-play-gesture";
  import { usePlayTelemetry } from "~/composables/play/use-play-telemetry";
  import { usePlayThemes } from "~/composables/play/use-play-themes";
  import { useApi } from "~/composables/use-api";

  interface JsonObject {
    [key: string]: string | number | boolean | readonly string[] | undefined;
  }

  interface RoundPayload {
    round_index: number;
    instruction?: string | null;
    instruction_audio_path?: string | null;
    content_pack: JsonObject;
    difficulty_params: JsonObject;
  }

  interface ConfigPayload {
    level_code: string;
    code: string;
    title?: string;
    name?: string;
    content_version?: number;
    template_code: string;
    content_pack?: JsonObject;
    difficulty_params?: JsonObject;
    theme_id: string;
    age_band?: "3-4" | "4-5" | "5-6";
    scoring?: { mode: "rounds" | "attempts" };
    rounds?: RoundPayload[];
    session?: { uuid: string; started_at?: string };
    flags?: {
      reduced_motion?: boolean;
      audio_enabled?: boolean;
      tap_fallback?: boolean;
    };
    assets?: Array<{
      ref: string;
      kind: string;
      url?: string;
      glyph?: string;
    }>;
  }

  const route = useRoute();
  const router = useRouter();
  const levelCode = route.params.code as string;
  const { loggedIn, fetch: fetchSession } = useUserSession();

  const isLoading = ref(true);
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const displayTitle = ref("");
  const currentRound = ref(0);
  const totalRounds = ref(1);

  const showVictoryModal = ref(false);
  const showParentGate = ref(false);
  const earnedCelebration = ref<"great" | "good" | "nice_try">("good");
  const earnedStars = ref<number | null>(null);

  const isIntroCardStep = ref(false);
  const isEchoStep = ref(false);
  const introStepIndex = ref(0);

  const currentThemeId = ref<string>("default");
  const canSkipRound = ref(false);
  const isPromptPillPulsing = ref(false);
  const parentLockHoldProgress = ref(0);

  let holdTimer: ReturnType<typeof setInterval> | null = null;
  let pulseTimer: ReturnType<typeof setTimeout> | null = null;
  let activeNarrationAudio: HTMLAudioElement | null = null;
  let currentInstructionAudio: string | null = null;
  let cachedPayload: ConfigPayload | null = null;
  let roundRunner: RoundRunner | null = null;
  let engine: GameEngine | null = null;

  const { currentThemeInfo } = usePlayThemes(currentThemeId);
  const {
    errorMessage,
    errorTitle,
    errorEmoji,
    errorActionLink,
    errorActionText,
    handleApiError,
  } = usePlayError();
  const { uploadTelemetry, finishSession } = usePlayTelemetry();

  const isIntroLevel = computed(() => {
    return (
      cachedPayload?.template_code === "GT-000" ||
      Boolean(route.query.return_to) ||
      Boolean(route.query.return_level_code)
    );
  });

  const {
    viewEntities,
    syncView,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleAccessibleEntityTap,
  } = usePlayGesture({
    getEngine: () => engine,
    canvasRef,
    onRoundWon: handleRoundWonInternal,
  });

  function triggerVisualFallbackCue(): void {
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

  function stopNarrationAudio(): void {
    if (activeNarrationAudio) {
      try {
        activeNarrationAudio.pause();
        activeNarrationAudio.currentTime = 0;
      } catch {
        // Safe ignore
      }
      activeNarrationAudio = null;
    }
  }

  function playInstructionNarration(promptText?: string): void {
    stopNarrationAudio();
    if (currentInstructionAudio) {
      try {
        const aud = new Audio(currentInstructionAudio);
        activeNarrationAudio = aud;
        aud.onended = () => {
          if (activeNarrationAudio === aud) {
            activeNarrationAudio = null;
          }
        };
        aud.play().catch(() => {
          if (promptText && engine) {
            engine.audio.speakPrompt(
              promptText,
              undefined,
              triggerVisualFallbackCue
            );
          }
        });
      } catch {
        if (promptText && engine) {
          engine.audio.speakPrompt(
            promptText,
            undefined,
            triggerVisualFallbackCue
          );
        }
      }
    } else if (promptText && engine) {
      engine.audio.speakPrompt(promptText, undefined, triggerVisualFallbackCue);
    }
  }

  function replayInstructionAudio(): void {
    engine?.audio.playTapSound();
    const currentRoundCfg = roundRunner?.getCurrentRoundConfig();
    const prompt =
      (currentRoundCfg?.content_pack as { prompt?: string })?.prompt ||
      currentRoundCfg?.instruction ||
      cachedPayload?.title;
    playInstructionNarration(prompt);
  }

  function speakErrorPrompt(): void {
    if (engine) {
      engine.audio.speakPrompt(
        "Bé ơi, chưa tải được trò chơi. Bé bấm nút màu vàng để thử lại nhé!"
      );
    }
  }

  function handleSkipRound(): void {
    canSkipRound.value = false;
    engine?.audio.playTapSound();
    engine?.scaffolding?.reset();
    roundRunner?.skipCurrentRound("scaffold_exhausted");
  }

  function handleEchoReplay(): void {
    if (engine?.activeSession) {
      engine.activeSession.validateAction({
        type: "tap_item",
        data: { intent: "replay" },
      });
    }
  }

  function handleEchoDone(): void {
    if (engine?.activeSession) {
      engine.activeSession.validateAction({
        type: "tap_item",
        data: { intent: "advance" },
      });
    }
  }

  function handleIntroPrev(): void {
    if (engine?.activeSession) {
      engine.activeSession.validateAction({
        type: "tap_item",
        data: { intent: "prev" },
      });
    }
  }

  function handleRoundWonInternal(): void {
    if (!roundRunner) {
      return;
    }
    const sessionUuid = cachedPayload?.session?.uuid;
    if (sessionUuid) {
      uploadTelemetry(sessionUuid, roundRunner, loggedIn.value).catch(() => {
        // Telemetry errors should not block completion
      });
    }
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
    fetchAndStartGame().catch(
      (err: Error | Record<string, string | number>) => {
        const appErr = handleApiError(err, levelCode, loggedIn.value);
        errorMessage.value = appErr.message;
      }
    );
  }

  async function completeSessionOnFinish(): Promise<void> {
    const sessionUuid = cachedPayload?.session?.uuid;
    if (sessionUuid && roundRunner) {
      try {
        await uploadTelemetry(sessionUuid, roundRunner, loggedIn.value);
      } catch {
        // Continue to finish
      }

      const resp = await finishSession(
        sessionUuid,
        roundRunner,
        loggedIn.value
      );
      if (resp) {
        earnedCelebration.value = resp.celebration ?? "good";
        earnedStars.value = typeof resp.stars === "number" ? resp.stars : null;
      }
    }
    showVictoryModal.value = true;
  }

  async function preloadAssets(
    assets: Array<{ ref: string; kind: string; url?: string; glyph?: string }>
  ): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const asset of assets) {
      if (asset.kind === "image" && asset.url) {
        const srcUrl = asset.url;
        promises.push(
          new Promise<void>((resolve) => {
            const img = new Image();
            const timer = setTimeout(() => resolve(), 3000);
            img.onload = () => {
              clearTimeout(timer);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timer);
              resolve();
            };
            img.src = srcUrl;
          })
        );
      } else if (asset.kind === "audio" && asset.url) {
        const srcUrl = asset.url;
        promises.push(
          new Promise<void>((resolve) => {
            const aud = new Audio();
            const timer = setTimeout(() => resolve(), 3000);
            aud.oncanplaythrough = () => {
              clearTimeout(timer);
              resolve();
            };
            aud.onerror = () => {
              clearTimeout(timer);
              resolve();
            };
            aud.src = srcUrl;
          })
        );
      }
    }

    const overallTimeout = new Promise<void>((resolve) =>
      setTimeout(resolve, 5000)
    );

    await Promise.race([Promise.all(promises), overallTimeout]);
  }

  function renderScaffoldingAura(
    ctx: CanvasRenderingContext2D,
    nowMs: number
  ): void {
    if (!engine || engine.focusIndex === null) {
      return;
    }
    const slots =
      (engine.activeSession as { slots?: readonly Slot[] })?.slots ||
      engine.slots ||
      [];
    const focusSlot = slots[engine.focusIndex];
    if (focusSlot) {
      const r = Math.max(focusSlot.w, focusSlot.h) / 2 + 18;
      ctx.save();
      const pulse = 0.5 + 0.5 * Math.sin((nowMs / 1000) * Math.PI * 2);
      ctx.strokeStyle = `rgba(245, 158, 11, ${0.4 + pulse * 0.4})`;
      ctx.lineWidth = 4 + pulse * 2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -(nowMs / 50) % 14;
      ctx.beginPath();
      ctx.arc(focusSlot.x, focusSlot.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function syncIntroStepState(): void {
    if (cachedPayload?.template_code === "GT-000" && engine?.activeSession) {
      const s = engine.activeSession as {
        steps?: readonly { action: string }[];
        currentStepIndex?: number;
      };
      const stepIdx = s.currentStepIndex ?? 0;
      const step = s.steps?.[stepIdx];
      introStepIndex.value = stepIdx;
      isEchoStep.value = step?.action === "echo";
      isIntroCardStep.value =
        step?.action === "present" || step?.action === "echo";
    } else if (isIntroCardStep.value) {
      isIntroCardStep.value = false;
      isEchoStep.value = false;
    }
  }

  function startRounds(
    payload: ConfigPayload,
    rounds: RoundPayload[],
    engineConfig: EngineConfig
  ): void {
    totalRounds.value = rounds.length;
    currentRound.value = 0;
    earnedStars.value = null;

    const roundConfigs: RoundConfig[] = rounds.map((r) => ({
      round_index: r.round_index,
      instruction: r.instruction,
      instruction_audio_path: r.instruction_audio_path,
      content_pack: r.content_pack,
      difficulty_params: r.difficulty_params,
    }));

    roundRunner = new RoundRunner({
      rounds: roundConfigs,
      ageBand: engineConfig.age_band,
      sessionFactory: (contentPack, difficultyParams, seed) => {
        const roundCfg: EngineConfig = {
          ...engineConfig,
          content_pack: contentPack,
          difficulty_params: difficultyParams,
          layout_seed: seed,
        };
        return createGameSessionSync(payload.template_code, roundCfg);
      },
      onRoundStarted: (roundIndex) => {
        currentRound.value = roundIndex;
        canSkipRound.value = false;
        currentInstructionAudio =
          rounds[roundIndex]?.instruction_audio_path || null;
        const session = roundRunner?.getCurrentSession();
        if (session && engine) {
          engine.activeSession = session;
          engine.audio.playStartSound();
        }
        syncView();
        const currentRoundCfg = rounds[roundIndex];
        const prompt =
          (currentRoundCfg?.content_pack as { prompt?: string })?.prompt ||
          currentRoundCfg?.instruction ||
          cachedPayload?.title;
        if (cachedPayload?.template_code !== "GT-000") {
          setTimeout(() => {
            playInstructionNarration(prompt);
          }, 350);
        }
      },
      onRoundCompleted: () => {
        engine?.scaffolding?.resetOnSuccess();
        canSkipRound.value = false;
        syncView();
      },
      onAllRoundsCompleted: () => {
        engine?.audio.playLevelCelebrateSound();
        setTimeout(() => {
          completeSessionOnFinish().catch(() => {
            showVictoryModal.value = true;
          });
        }, 500);
      },
    });

    const factory = (cfg: EngineConfig) => {
      roundRunner?.startFirstRound();
      const session = roundRunner?.getCurrentSession();
      if (!session) {
        return createGameSessionSync(payload.template_code, cfg);
      }
      return session;
    };

    if (canvasRef.value) {
      if (engine) {
        engine.destroy();
        engine = null;
      }
      engine = new GameEngine();
      engine.on("skip_suggested", () => {
        canSkipRound.value = true;
      });
      engine.onAfterRender = (ctx, _rs, nowMs) => {
        renderScaffoldingAura(ctx, nowMs);
        syncIntroStepState();
      };
      engine.load(engineConfig, factory);
      engine.start(canvasRef.value);
      syncView();
    }
  }

  function buildEngineConfig(
    payload: ConfigPayload,
    firstRound?: RoundPayload
  ): EngineConfig {
    return {
      level_code: payload.code || payload.level_code || levelCode,
      content_version: payload.content_version ?? 1,
      template_code: payload.template_code,
      content_pack: (firstRound?.content_pack ??
        payload.content_pack) as EngineConfig["content_pack"],
      difficulty_params: (firstRound?.difficulty_params ??
        payload.difficulty_params) as EngineConfig["difficulty_params"],
      theme_id: payload.theme_id,
      age_band: payload.age_band || "3-4",
      reduced_motion: payload.flags?.reduced_motion ?? false,
      audio_enabled: payload.flags?.audio_enabled ?? true,
    };
  }

  async function fetchAndStartGame(): Promise<void> {
    if (!loggedIn.value) {
      await fetchSession().catch(() => {
        // session not established yet
      });
    }

    const endpoint = loggedIn.value
      ? `/api/users/levels/${levelCode}/config`
      : `/api/guest/levels/${levelCode}/config`;

    const api = useApi();
    const payload = await api<ConfigPayload>(endpoint);
    cachedPayload = payload;
    displayTitle.value =
      payload.title || payload.name || `Bài học: ${levelCode}`;
    currentThemeId.value = payload.theme_id || "default";

    if (payload.assets && Array.isArray(payload.assets)) {
      await preloadAssets(payload.assets);
    }

    isLoading.value = false;
    await nextTick();

    const rounds = payload.rounds ?? [];
    if (rounds.length === 0) {
      throw new Error(
        "Cấu hình trò chơi thiếu danh sách câu hỏi. Bé thử lại sau nhé!"
      );
    }
    await preloadGameSession(payload.template_code);
    startRounds(payload, rounds, buildEngineConfig(payload, rounds[0]));
  }

  function handleResize(): void {
    if (engine && canvasRef.value) {
      engine.renderSystem.setupCanvas(canvasRef.value);
    }
  }

  function handleVisibilityChange(): void {
    if (!engine) {
      return;
    }
    if (
      typeof document !== "undefined" &&
      document.visibilityState === "hidden"
    ) {
      engine.pause("tab_hidden");
    } else if (!(showVictoryModal.value || showParentGate.value)) {
      engine.resume();
    }
  }

  watch([showVictoryModal, showParentGate], ([victoryOpen, gateOpen]) => {
    if (!engine) {
      return;
    }
    if (victoryOpen || gateOpen) {
      engine.pause(victoryOpen ? "victory_modal" : "parent_gate");
    } else if (
      typeof document !== "undefined" &&
      document.visibilityState === "visible"
    ) {
      engine.resume();
    }
  });

  onMounted(async () => {
    window.addEventListener("resize", handleResize);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    try {
      isLoading.value = true;
      errorMessage.value = null;
      await fetchAndStartGame();
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
    stopNarrationAudio();
    if (roundRunner) {
      roundRunner.destroy();
      roundRunner = null;
    }
    if (engine) {
      engine.audio.stopAll();
      engine.destroy();
      engine = null;
    }
  });
</script>

<style scoped>
  .game-play-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-50);
    position: relative;
    overflow: hidden;
    user-select: none;
    transition: background 0.5s ease;
  }

  /* THEME GRADIENTS */
  .game-play-container.theme-nature {
    background: linear-gradient(
      145deg,
      rgba(238, 247, 238, 0.95),
      rgba(229, 242, 229, 0.95)
    );
    --ambient-1: rgba(200, 230, 201, 0.5);
    --ambient-2: rgba(220, 237, 200, 0.5);
  }

  .game-play-container.theme-farm {
    background: linear-gradient(
      145deg,
      rgba(253, 248, 235, 0.95),
      rgba(247, 238, 215, 0.95)
    );
    --ambient-1: rgba(255, 224, 130, 0.5);
    --ambient-2: rgba(200, 230, 201, 0.5);
  }

  .game-play-container.theme-ocean {
    background: linear-gradient(
      145deg,
      rgba(232, 244, 248, 0.95),
      rgba(216, 236, 244, 0.95)
    );
    --ambient-1: rgba(179, 229, 252, 0.5);
    --ambient-2: rgba(178, 223, 219, 0.5);
  }

  .game-play-container.theme-space {
    background: linear-gradient(
      145deg,
      rgba(237, 234, 245, 0.95),
      rgba(224, 218, 240, 0.95)
    );
    --ambient-1: rgba(209, 196, 233, 0.5);
    --ambient-2: rgba(197, 202, 233, 0.5);
  }

  .game-play-container.theme-school {
    background: linear-gradient(
      145deg,
      rgba(253, 246, 236, 0.95),
      rgba(249, 237, 215, 0.95)
    );
    --ambient-1: rgba(255, 224, 178, 0.5);
    --ambient-2: rgba(255, 236, 179, 0.5);
  }

  .game-play-container.theme-default {
    background: linear-gradient(
      145deg,
      rgba(247, 245, 240, 0.95),
      rgba(237, 232, 222, 0.95)
    );
    --ambient-1: rgba(224, 216, 204, 0.5);
    --ambient-2: rgba(234, 228, 216, 0.5);
  }

  /* AMBIENT SHAPES */
  .ambient-theme-layer {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: 1;
  }

  .ambient-shape {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.38;
    transition: all 0.8s ease;
  }

  .shape-1 {
    width: 440px;
    height: 440px;
    top: -100px;
    left: -80px;
    background: var(--ambient-1, rgba(255, 230, 180, 0.4));
  }

  .shape-2 {
    width: 480px;
    height: 480px;
    bottom: -120px;
    right: -100px;
    background: var(--ambient-2, rgba(200, 240, 220, 0.4));
  }

  .game-viewport {
    position: relative;
    z-index: 10;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  /* TOP HUD BAR */
  .top-hud-bar {
    width: 100%;
    height: 5.5rem;
    min-height: 5.5rem;
    padding: 0.5rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    background-color: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(12px);
    border-bottom: 3px solid var(--color-surface-200);
  }

  @media (max-width: 640px) {
    .top-hud-bar {
      height: auto;
      min-height: 4.5rem;
      padding: 0.5rem 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .lesson-meta-box {
      display: none;
    }
  }

  .lesson-info-pill {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: rgba(255, 255, 255, 0.85);
    border: 3px solid var(--color-surface-200);
    border-radius: 9999px;
    padding: 0.35rem 1rem 0.35rem 0.45rem;
    box-shadow: 0 4px 6px rgba(30, 27, 75, 0.05);
    transition: all 0.2s ease;
  }

  .avatar-circle {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    background-color: var(--color-brand-50);
    border: 2px solid var(--color-brand-200);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .avatar-emoji {
    font-size: 1.5rem;
    line-height: 1;
  }

  .lesson-meta-box {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .theme-tag-text {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--color-surface-500);
  }

  .lesson-title-text {
    font-family: var(--font-heading, sans-serif);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-surface-900);
  }

  .progress-container {
    display: flex;
    align-items: center;
  }

  .hud-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-audio-replay,
  .btn-skip-round {
    min-height: 4rem;
    min-width: 4rem;
    padding: 0.75rem 1.25rem;
    font-family: var(--font-heading, sans-serif);
    font-size: 1.1rem;
    font-weight: 700;
    border-radius: 9999px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .btn-audio-replay {
    background: linear-gradient(
      180deg,
      var(--color-warning-400),
      var(--color-warning-500)
    );
    color: var(--color-surface-900);
    border: 3px solid var(--color-warning-200);
    box-shadow: 0 4px 0 var(--color-warning-600);
  }

  .btn-audio-replay:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 var(--color-warning-600);
  }

  .btn-skip-round {
    background: linear-gradient(
      180deg,
      var(--color-surface-100),
      var(--color-surface-200)
    );
    color: var(--color-surface-800);
    border: 3px solid var(--color-surface-300);
    box-shadow: 0 4px 0 var(--color-surface-400);
  }

  .btn-skip-round:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 var(--color-surface-400);
  }

  .btn-parent-lock {
    width: 4rem;
    height: 4rem;
    min-width: 4rem;
    min-height: 4rem;
    border-radius: 50%;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.95),
      var(--color-surface-100)
    );
    border: 3px solid var(--color-surface-300);
    box-shadow: 0 4px 0 var(--color-surface-400);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
  }

  .btn-parent-lock:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 var(--color-surface-400);
  }

  /* MAIN ARENA */
  .main-arena {
    position: relative;
    z-index: 10;
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem 1rem 1rem;
  }

  .wooden-tray-container {
    position: relative;
    width: 100%;
    height: 100%;
    max-width: 1200px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: rgba(233, 223, 203, 0.9);
    border-radius: 2rem;
    box-shadow:
      inset 0 4px 10px rgba(80, 60, 30, 0.18),
      0 10px 24px rgba(80, 69, 50, 0.1);
    border: 4px solid rgba(246, 238, 223, 0.95);
  }

  .game-canvas {
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: calc(85vh - 20px);
    object-fit: contain;
    touch-action: none;
    border-radius: 1.75rem;
    box-shadow: 0 6px 18px rgba(70, 55, 35, 0.12);
  }

  /* Loading & Error States */
  .loading-state,
  .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    width: 100%;
    max-width: 32rem;
    z-index: 10;
  }

  .loading-box,
  .error-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    background-color: white;
    padding: 2.5rem 2rem;
    border-radius: 1.5rem;
    border: 3px solid var(--color-surface-300);
    box-shadow: 0 8px 16px rgba(130, 118, 96, 0.08);
    text-align: center;
    width: 100%;
  }

  .loading-emoji,
  .error-emoji {
    font-size: 3.5rem;
    line-height: 1;
  }

  .loading-text,
  .error-title {
    font-family: var(--font-heading, sans-serif);
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0;
  }

  .error-desc {
    font-size: 1rem;
    line-height: 1.5;
    color: var(--color-surface-700);
    margin: 0 0 1rem 0;
  }

  .error-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .btn-audio-speak,
  .btn-primary,
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 48px;
    padding: 0.75rem 1.5rem;
    border-radius: 1rem;
    font-family: var(--font-heading, sans-serif);
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.15s ease;
    cursor: pointer;
  }

  .btn-audio-speak {
    background-color: var(--color-brand-50);
    color: var(--color-brand-700);
    border: 2px solid var(--color-brand-200);
  }

  .btn-primary {
    background-color: var(--color-cta);
    color: white;
    border: 2px solid transparent;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.15);
  }

  .btn-primary:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
  }

  .btn-secondary {
    background-color: var(--color-surface-100);
    color: var(--color-surface-800);
    border: 2px solid var(--color-surface-300);
  }

  .btn-secondary:active {
    transform: translateY(2px);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
</style>
