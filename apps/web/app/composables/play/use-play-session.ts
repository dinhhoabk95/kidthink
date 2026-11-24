import {
  computeZonesForSession,
  createGameSessionSync,
  ENGINE_EVENT_WILDCARD,
  type EngineConfig,
  GameEngine,
  type NarrationTrigger,
  preloadGameSession,
  type RenderSystem,
  type RoundConfig,
  RoundRunner,
  type StageZones,
} from "@mindkid/game-engine";
import type { AgeBand } from "@mindkid/shared/client";
import { nextTick, type Ref, ref } from "vue";
import {
  type CompletionOutcome,
  presentCompletion,
} from "~/composables/play/completion-outcome";
import { isRereadPromptEscalation } from "~/composables/play/hint-narration";
import { playOpeningAudioThenSettle } from "~/composables/play/opening-audio";
import {
  assertPlayRoundsValid,
  buildPlayEngineConfig,
  handleIntroRoundNarration,
  type IntroSessionView,
  isSameZoneRect,
  openingAudioSource,
  readIntroStepFlags,
} from "~/composables/play/play-intro-narration";
import {
  createTimerBag,
  scheduleRetryDisallowedSkip,
  scheduleRoundOpenNarration,
  scheduleWonRoundCompletion,
  skipCurrentRoundIfUnwon,
} from "~/composables/play/play-round-token";
import {
  preloadSpritesForSession,
  type SpriteScanValue,
} from "~/composables/play/use-item-sprites";
import {
  preloadPlayAssets,
  usePlayAudio,
} from "~/composables/play/use-play-audio";
import {
  type CelebrationTier,
  type SessionCompleteSticker,
  usePlayTelemetry,
} from "~/composables/play/use-play-telemetry";
import { useApi } from "~/composables/use-api";

export interface JsonObject {
  [key: string]: string | number | boolean | readonly string[] | undefined;
}

export interface RoundPayload {
  round_index: number;
  instruction?: string | null;
  instruction_audio_path?: string | null;
  narration_template?: string | null;
  content_pack: JsonObject;
  difficulty_params: JsonObject;
}

export interface ConfigPayload {
  level_code: string;
  code: string;
  title?: string;
  name?: string;
  content_version?: number;
  template_code: string;
  content_pack?: JsonObject;
  difficulty_params?: JsonObject;
  theme_id: string;
  age_band?: AgeBand;
  layout_seed?: number;
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

export interface UsePlaySessionOptions {
  readonly canvasRef: Ref<HTMLCanvasElement | null>;
  readonly loggedIn: Ref<boolean>;
  readonly syncView: () => void;
  readonly onFallbackCue?: () => void;
  /**
   * Tính lại vùng bàn chơi cho session đang chạy (`BR-PSZ-13`): số vật khay
   * đổi theo vòng nên khay đổi cao. Trả `null` khi chưa có viewport.
   */
  readonly refreshStageZones?: () => StageZones | null;
  readonly onAfterRender?: (
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    now: number
  ) => void;
}

/** Seed dựng bàn cho lượt chơi (`BR-RNG-06`) — thiếu thì rơi về `0` cố định thay vì `Math.random()`. */
export function resolveLayoutSeed(payload: ConfigPayload): number {
  if (payload.layout_seed !== undefined) {
    return payload.layout_seed;
  }
  console.warn(
    `[play-session] payload thiếu layout_seed cho level ${payload.level_code} — dùng seed 0 (BR-RNG-06).`
  );
  return 0;
}

/** Gom tài nguyên (ảnh + âm câu dẫn mọi vòng) để preload trước Vòng 1 (`BR-OFF-02`). */
export function collectSessionAssets(
  payload: ConfigPayload
): Array<{ ref: string; kind: string; url?: string; glyph?: string }> {
  const result: Array<{
    ref: string;
    kind: string;
    url?: string;
    glyph?: string;
  }> = [];
  const seenUrls = new Set<string>();
  const pushUniqueAsset = (asset: {
    ref: string;
    kind: string;
    url?: string;
    glyph?: string;
  }): void => {
    if (asset.url) {
      if (seenUrls.has(asset.url)) {
        return;
      }
      seenUrls.add(asset.url);
    }
    result.push(asset);
  };
  for (const asset of payload.assets ?? []) {
    pushUniqueAsset(asset);
  }
  for (const round of payload.rounds ?? []) {
    if (round.instruction_audio_path) {
      pushUniqueAsset({
        ref: `round_audio_${round.round_index}`,
        kind: "audio",
        url: round.instruction_audio_path,
      });
    }
  }
  return result;
}

/** Câu dẫn chờ tiếng chuông mở vòng dứt rồi mới vang, để hai âm không đè nhau. */
const ROUND_OPEN_NARRATION_DELAY_MS = 600;

/** Nhịp ăn mừng giữa lúc thắng một vòng và lúc mở vòng kế. */
const ROUND_WON_ADVANCE_DELAY_MS = 900;
/** Chờ sau khi trả lời sai ở vòng cấm thử lại, để bé kịp thấy đáp án đúng. */
const RETRY_DISALLOWED_REVEAL_MS = 1500;

export function usePlaySession(options: UsePlaySessionOptions) {
  const { canvasRef, loggedIn, syncView, onFallbackCue } = options;

  let engine: GameEngine | null = null;

  /** Hint L3 đã đọc lại đề trong vòng hiện tại chưa. */

  let rereadDone = false;
  let roundRunner: RoundRunner | null = null;
  const roundTimers = createTimerBag();
  let sessionStartGen = 0;
  let cachedPayload: ConfigPayload | null = null;

  const isLoading = ref(true);
  const displayTitle = ref("");
  const currentThemeId = ref("default");
  const ageBand = ref<AgeBand>("3-4");
  const totalRounds = ref(1);
  const currentRound = ref(0);
  const canSkipRound = ref(false);

  const isEchoStep = ref(false);
  const isIntroCardStep = ref(false);
  const introStepIndex = ref(0);

  const showVictoryModal = ref(false);
  const earnedCelebration = ref<CelebrationTier>("great");
  const earnedStars = ref<number | null>(null);
  const earnedSticker = ref<SessionCompleteSticker | null>(null);

  const {
    initTelemetrySession,
    setActiveRoundRunner,
    uploadTelemetry,
    finishSession,
    destroyTelemetrySession,
  } = usePlayTelemetry();
  const {
    setInstructionAudio,
    playInstructionNarration,
    stopNarrationAudio,
    pauseNarration,
    resumeNarration,
  } = usePlayAudio({
    getEngine: () => engine,
    onFallbackCue:
      onFallbackCue ??
      (() => {
        /* noop */
      }),
  });

  function getEngine(): GameEngine | null {
    return engine;
  }

  function getRoundRunner(): RoundRunner | null {
    return roundRunner;
  }

  function getCachedPayload(): ConfigPayload | null {
    return cachedPayload;
  }

  function syncIntroStepState(): void {
    if (cachedPayload?.template_code === "GT-000" && engine?.activeSession) {
      const flags = readIntroStepFlags(
        engine.activeSession as IntroSessionView
      );
      introStepIndex.value = flags.stepIndex;
      isEchoStep.value = flags.isEchoStep;
      isIntroCardStep.value = flags.isIntroCardStep;
    } else if (isIntroCardStep.value) {
      isIntroCardStep.value = false;
      isEchoStep.value = false;
    }
  }

  let lastUploadedTelemetryCount = -1;

  async function uploadTelemetrySafely(sessionUuid: string): Promise<void> {
    if (!roundRunner) {
      return;
    }
    const events = roundRunner.getAllTelemetry();
    const currentCount = events.length;
    if (currentCount > 0 && currentCount === lastUploadedTelemetryCount) {
      return;
    }
    await uploadTelemetry(
      sessionUuid,
      roundRunner,
      loggedIn.value,
      cachedPayload?.session?.started_at,
      events
    );
    lastUploadedTelemetryCount = currentCount;
  }

  async function resolveCompletionOutcome(
    sessionUuid: string
  ): Promise<CompletionOutcome | null> {
    if (!roundRunner) {
      return null;
    }
    try {
      await uploadTelemetrySafely(sessionUuid);
    } catch (err) {
      console.error(
        `[play-session] uploadTelemetry thất bại trước complete — session: ${sessionUuid}, error: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const result = await finishSession(
      sessionUuid,
      roundRunner,
      loggedIn.value
    );
    if (result.ok) {
      return {
        celebration: result.data.celebration ?? "good",
        stars: typeof result.data.stars === "number" ? result.data.stars : null,
        sticker: result.data.sticker ?? null,
      };
    }
    return null;
  }

  async function completeSessionOnFinish(): Promise<void> {
    const sessionUuid = cachedPayload?.session?.uuid;
    if (!(sessionUuid && roundRunner)) {
      earnedCelebration.value = "nice_try";
      earnedStars.value = null;
      earnedSticker.value = null;
      showVictoryModal.value = true;
      return;
    }
    // Modal hiện ngay; tier/sao/sticker cập nhật khi server trả lời (Task #313 B4, BR-FBK-18).
    await presentCompletion({
      fetchOutcome: () => resolveCompletionOutcome(sessionUuid),
      show: (outcome) => {
        earnedCelebration.value = outcome.celebration;
        earnedStars.value = outcome.stars;
        earnedSticker.value = outcome.sticker ?? null;
        showVictoryModal.value = true;
      },
      update: (outcome) => {
        earnedCelebration.value = outcome.celebration;
        earnedStars.value = outcome.stars;
        earnedSticker.value = outcome.sticker ?? null;
      },
    });
  }

  function handleRoundWonInternal(): void {
    if (!roundRunner) {
      return;
    }
    engine?.resetScaffolding();
    const sessionUuid = cachedPayload?.session?.uuid;
    if (sessionUuid) {
      uploadTelemetrySafely(sessionUuid).catch((err) => {
        console.error(
          `[play-session] uploadTelemetry thất bại ở round won — session: ${sessionUuid}, error: ${err instanceof Error ? err.message : String(err)}`
        );
      });
    }

    // Đóng vòng vừa thắng sau nhịp ăn mừng — neo vào đúng vòng đó (Task #274
    // E2): bỏ qua, chơi lại hay rời trang trong lúc chờ thì hẹn giờ tự huỷ.
    scheduleWonRoundCompletion(
      roundTimers,
      getRoundRunner,
      ROUND_WON_ADVANCE_DELAY_MS
    );
  }

  function startRounds(
    payload: ConfigPayload,
    rounds: RoundPayload[],
    engineConfig: EngineConfig
  ): void {
    // Chơi lại dựng runner mới — hẹn giờ của lượt trước Cấm — NEVER chạy tiếp.
    roundTimers.clearAll();
    totalRounds.value = rounds.length;
    currentRound.value = 0;
    earnedStars.value = null;
    earnedSticker.value = null;

    const roundConfigs: RoundConfig[] = rounds.map((r) => ({
      round_index: r.round_index,
      instruction: r.instruction,
      instruction_audio_path: r.instruction_audio_path,
      narration_template: r.narration_template,
      content_pack: r.content_pack,
      difficulty_params: r.difficulty_params,
    }));

    const seed = resolveLayoutSeed(payload);

    roundRunner = new RoundRunner({
      rounds: roundConfigs,
      ageBand: engineConfig.age_band,
      layoutSeed: seed,
      // Đồng hồ vòng và hẹn giờ trợ giúp chỉ tính từ lúc câu dẫn đọc xong,
      // không phải từ lúc mở vòng (BR-PNR-11). `notePromptSettled()` được
      // gọi từ `onSettled` của `playInstructionNarration` dưới đây.
      gateOnPromptSettle: true,
      sessionFactory: (contentPack, difficultyParams, roundSeed) => {
        const roundCfg: EngineConfig = {
          ...engineConfig,
          content_pack: contentPack,
          difficulty_params: difficultyParams,
          layout_seed: roundSeed,
        };
        return createGameSessionSync(payload.template_code, roundCfg);
      },
      onPlayNarration: (roundConfig, trigger) => {
        // Bề mặt chơi là nguồn giọng duy nhất của vòng (BR-PNR-03): RoundRunner
        // gọi vào đây thay vì tự phát, nên câu dẫn không bao giờ vang hai lần.
        setInstructionAudio(roundConfig.instruction_audio_path);
        // GT-000 tự kể lời dẫn theo từng bước làm quen, không dùng câu dẫn
        // vòng ở `round_open` (tránh chồng giọng), còn ở `replay` thì uỷ quyền
        // cho `replayStepAudio()` đọc lại đúng câu dẫn bước hiện tại.
        if (cachedPayload?.template_code === "GT-000") {
          handleIntroRoundNarration({
            trigger,
            currentSession:
              roundRunner?.getCurrentSession() ?? engine?.activeSession,
            notePromptSettled: () => {
              roundRunner?.notePromptSettled();
            },
            fallbackSpeak: (text) => {
              playInstructionNarration(text);
            },
          });
          return;
        }
        // Khung chuyện đứng trước câu dẫn ở vòng đầu (`BR-FBK-16`).
        const spokenPrompt = (
          text: string | undefined,
          when: NarrationTrigger
        ): string | undefined =>
          text ? (roundRunner?.spokenPromptFor(text, when) ?? text) : text;
        const prompt =
          (roundConfig.content_pack as { prompt?: string })?.prompt ||
          roundConfig.instruction ||
          cachedPayload?.title;
        if (trigger === "replay") {
          // Nghe lại Cấm — NEVER khoá cử chỉ (BR-PNR-08): không truyền onSettled.
          playInstructionNarration(spokenPrompt(prompt, trigger));
          return;
        }
        // Hẹn giờ và settle mang token vòng (Task #274 E6): câu dẫn của vòng
        // cũ hay của lượt chơi trước Cấm — NEVER mở cổng vòng đang chơi.
        scheduleRoundOpenNarration({
          timers: roundTimers,
          getRunner: getRoundRunner,
          delayMs: ROUND_OPEN_NARRATION_DELAY_MS,
          // Âm đề tự phát sau câu dẫn, trước khi mở cử chỉ (`BR-E018-05`).
          play: (settle) =>
            playInstructionNarration(spokenPrompt(prompt, trigger), () =>
              playOpeningAudioThenSettle(
                openingAudioSource(roundRunner?.getCurrentSession()),
                (text, onEnd, onError) =>
                  engine
                    ? engine.audio.speakPrompt(text, onEnd, onError)
                    : onEnd(),
                settle
              )
            ),
          onSettled: () => {
            if (engine) {
              engine.acceptingInput = true;
            }
            roundRunner?.notePromptSettled();
          },
        });
      },
      onRoundStarted: (roundIndex, roundConfig) => {
        currentRound.value = roundIndex;
        canSkipRound.value = false;
        rereadDone = false;
        if (engine) {
          engine.roundIndex = roundIndex;
          // Mỗi vòng một ngưỡng `hint_after_ms` riêng (Task #313 B8).
          engine.setRoundHintAfterMs(
            roundConfig.difficulty_params as EngineConfig["difficulty_params"]
          );
          engine.resetScaffolding();
          // Chặn cử chỉ tới khi câu dẫn đọc xong (BR-PNR-11) — mở lại ở
          // `onNarrationSettled` bên trên. GT-000 tự quản lý gate riêng.
          engine.acceptingInput = cachedPayload?.template_code === "GT-000";
        }
        const session = roundRunner?.getCurrentSession();
        if (session && engine) {
          engine.activeSession = session;
          engine.audio.playStartSound();
        }
        applyRoundZones();
        syncView();
      },
      onRoundCompleted: () => {
        engine?.resetScaffolding();
        canSkipRound.value = false;
        syncView();
        const sessionUuid = cachedPayload?.session?.uuid;
        if (sessionUuid && roundRunner && !roundRunner.getState().isFinished) {
          uploadTelemetrySafely(sessionUuid).catch((err) => {
            console.error(
              `[play-session] uploadTelemetry thất bại ở round completed — session: ${sessionUuid}, error: ${err instanceof Error ? err.message : String(err)}`
            );
          });
        }
      },
      onAllRoundsCompleted: () => {
        // Hết vòng: session cuối đã huỷ, cổng cử chỉ phải đóng (Task #313 B11).
        if (engine) {
          engine.acceptingInput = false;
        }
        engine?.audio.playLevelCelebrateSound();
        roundTimers.set(() => {
          completeSessionOnFinish().catch((err) => {
            console.error(
              `[play-session] completeSessionOnFinish gặp lỗi — session: ${cachedPayload?.session?.uuid}, error: ${err instanceof Error ? err.message : String(err)}`
            );
            earnedCelebration.value = "nice_try";
            earnedStars.value = null;
            showVictoryModal.value = true;
          });
        }, 500);
      },
    });
    setActiveRoundRunner(roundRunner);

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
      engine.onSkipAvailable = () => {
        canSkipRound.value = true;
      };
      // `GameEngine.emitEvent` chỉ gọi listener; không có đường này thì event
      // scaffolding của engine không bao giờ tới `/events`.
      engine.on(ENGINE_EVENT_WILDCARD, (event) => {
        roundRunner?.recordExternalEvent(event);
        // Hint L3: đọc lại đề, một lần mỗi vòng (spec §7.2).
        if (isRereadPromptEscalation(event) && !rereadDone) {
          rereadDone = true;
          roundRunner?.replayCurrentRoundNarration();
        }
      });
      // Vòng thắng ở nhịp `update()` (GT-026 chốt lượt cuối khi ISI hết): không
      // có cử chỉ nào để `usePlayGesture` thấy, nên engine báo thẳng.
      engine.onSessionWon = handleRoundWonInternal;
      engine.onViewChanged = syncView;
      // Lượt hết giờ không chạm (GT-026, BR-E026-06) cũng là một lần thử.
      engine.onUpdateVerdict = handleAnswerVerdict;
      engine.onAfterRender = (ctx, rs, now) => {
        syncIntroStepState();
        options.onAfterRender?.(ctx, rs, now);
      };
      engine.load(engineConfig, factory);
      engine.start(canvasRef.value);
      syncRunnerStageZones(roundRunner, engine, ageBand.value);
      syncView();
    }
  }

  function syncRunnerStageZones(
    runner: RoundRunner | null,
    targetEngine: GameEngine | null,
    band: AgeBand
  ): void {
    const vp = targetEngine?.renderSystem.viewport;
    if (!(vp?.logicSpace && runner)) {
      return;
    }
    const zones = computeZonesForSession(
      {
        logicW: vp.logicSpace.w,
        logicH: vp.logicSpace.h,
        ageBand: band,
        cssPerLogic: vp.scale,
      },
      runner.getCurrentSession()
    );
    runner.setLogicSpace(
      vp.logicSpace,
      zones.stage,
      zones.tray ?? undefined,
      vp.scale
    );
    options.refreshStageZones?.();
  }

  /**
   * Đầu mỗi vòng: session mới có thể có số vật khay khác vòng trước, nên vùng
   * tính lại và chỉ cấp lại cho runner khi khay hoặc sân khấu đổi
   * (`BR-PSZ-13`).
   */
  function applyRoundZones(): void {
    const vp = engine?.renderSystem.viewport;
    const zones = options.refreshStageZones?.();
    if (!(zones && vp?.logicSpace && roundRunner)) {
      return;
    }
    const stage = roundRunner.getStageRect();
    const tray = roundRunner.getTrayRect() ?? null;
    if (
      isSameZoneRect(stage, zones.stage) &&
      isSameZoneRect(tray, zones.tray)
    ) {
      return;
    }
    roundRunner.setLogicSpace(
      vp.logicSpace,
      zones.stage,
      zones.tray ?? undefined,
      vp.scale
    );
  }

  function initSessionTelemetryIfPresent(
    payload: ConfigPayload,
    levelCode: string
  ): void {
    const sessionUuid = payload.session?.uuid;
    if (!sessionUuid) {
      return;
    }
    const startedAtStr = payload.session?.started_at;
    initTelemetrySession({
      session_uuid: sessionUuid,
      level_code: payload.code || payload.level_code || levelCode,
      content_version: payload.content_version ?? 1,
      is_guest: !loggedIn.value,
      started_at: startedAtStr ? new Date(startedAtStr).getTime() : Date.now(),
    });
  }

  async function fetchAndStartGame(levelCode: string): Promise<void> {
    const endpoint = loggedIn.value
      ? `/api/users/levels/${levelCode}/config`
      : `/api/guest/levels/${levelCode}/config`;

    const api = useApi();
    const payload = await api<ConfigPayload>(endpoint);
    cachedPayload = payload;
    displayTitle.value =
      payload.title || payload.name || `Bài học: ${levelCode}`;
    currentThemeId.value = payload.theme_id || "default";
    ageBand.value = payload.age_band || "3-4";

    const rounds = payload.rounds ?? [];
    if (rounds.length === 0) {
      throw new Error(
        "Cấu hình trò chơi thiếu danh sách câu hỏi. Bé thử lại sau nhé!"
      );
    }

    assertPlayRoundsValid(payload.template_code, rounds);

    initSessionTelemetryIfPresent(payload, levelCode);

    // BR-OFF-02: Tải trọn vẹn tài nguyên của toàn bộ các vòng + template session
    // trước khi tắt màn hình chờ và bắt đầu Vòng 1.
    const gen = ++sessionStartGen;
    const allAssets = collectSessionAssets(payload);
    const spriteSource: SpriteScanValue = [
      payload.content_pack,
      rounds.map((round) => round.content_pack),
      allAssets.map((asset) => ({
        kind: asset.kind,
        url: asset.url,
        ref: asset.ref,
        glyph: asset.glyph,
      })),
    ];
    await Promise.all([
      preloadPlayAssets(allAssets),
      preloadGameSession(payload.template_code),
      preloadSpritesForSession(spriteSource, {
        includeFlashcardCounters: payload.template_code === "GT-000",
        highRes: payload.template_code === "GT-000",
      }),
    ]);

    if (gen !== sessionStartGen || !canvasRef.value) {
      return;
    }

    isLoading.value = false;
    await nextTick();
    if (gen !== sessionStartGen || !canvasRef.value) {
      return;
    }

    startRounds(
      payload,
      rounds,
      buildPlayEngineConfig(payload, levelCode, rounds[0])
    );
  }

  function handleSkipRound(): void {
    canSkipRound.value = false;
    if (!roundRunner) {
      return;
    }
    // Vòng đã thắng đang chờ nhịp ăn mừng thì không bỏ qua — hẹn giờ ở
    // `handleRoundWonInternal` sẽ đóng nó như một vòng hoàn thành.
    if (skipCurrentRoundIfUnwon(roundRunner, "scaffold_exhausted")) {
      engine?.audio.playTapSound();
      engine?.resetScaffolding();
    }
  }

  /**
   * Trả lời sai ở vòng cấm thử lại thì đóng vòng ngay, giữ nguyên thành quả đã
   * đúng (`GT-003.md` §5, nhánh 2). Vòng đã thắng đang chờ nhịp ăn mừng thì
   * `skipCurrentRoundIfUnwon` tự bỏ qua.
   */
  function handleRetryDisallowed(): void {
    if (!roundRunner?.isRetryDisallowed()) {
      return;
    }
    // Hiện đáp án đúng rồi mới bỏ qua, không đóng vòng cùng nhịp với tiếng sai
    // (Task #313 B10). Cổng cử chỉ đóng tới khi vòng sau mở.
    scheduleRetryDisallowedSkip({
      timers: roundTimers,
      getRunner: getRoundRunner,
      delayMs: RETRY_DISALLOWED_REVEAL_MS,
      onReveal: () => {
        if (engine) {
          engine.acceptingInput = false;
          engine.revealAnswer();
        }
      },
      onSkipped: () => engine?.resetScaffolding(),
    });
  }

  function handleAnswerVerdict(isCorrect: boolean): void {
    roundRunner?.recordAnswerVerdict(isCorrect);
  }

  function setPaused(isPaused: boolean, reason?: string): void {
    if (!engine) {
      return;
    }
    // Pause dừng cả lời dẫn, hẹn giờ vòng và đồng hồ vòng của runner
    // (BR-HPL-07, Task #313 B5), không chỉ nét vẽ.
    if (isPaused) {
      engine.pause(reason);
      roundRunner?.pause();
      roundTimers.pause();
      pauseNarration();
    } else {
      engine.resume();
      roundRunner?.resume();
      roundTimers.resume();
      resumeNarration();
    }
  }

  function cleanupSession(): void {
    sessionStartGen++;
    lastUploadedTelemetryCount = -1;
    roundTimers.clearAll();
    stopNarrationAudio();
    setActiveRoundRunner(null);
    destroyTelemetrySession();
    if (roundRunner) {
      roundRunner.destroy();
      roundRunner = null;
    }
    if (engine) {
      engine.audio.stopAll();
      engine.destroy();
      engine = null;
    }
  }

  return {
    isLoading,
    displayTitle,
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
    handleRetryDisallowed,
    handleAnswerVerdict,
    handleRoundWonInternal,
    completeSessionOnFinish,
    setPaused,
    cleanupSession,
  };
}
