import {
  createGameSessionSync,
  ENGINE_EVENT_WILDCARD,
  type EngineConfig,
  GameEngine,
  preloadGameSession,
  type RoundConfig,
  RoundRunner,
} from "@mindkid/game-engine";
import type { AgeBand } from "@mindkid/shared/client";
import { nextTick, type Ref, ref } from "vue";
import {
  preloadPlayAssets,
  usePlayAudio,
} from "~/composables/play/use-play-audio";
import {
  type CelebrationTier,
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
}

/**
 * Seed dựng bàn cho lượt chơi (`BR-RNG-06`).
 *
 * `payload.layout_seed` do server phát cho **mỗi phiên chơi** (bậc random
 * thật ở `createLayoutSeed`), nên đây phải là nguồn duy nhất. Thiếu nó —
 * payload hỏng, cache cũ, hay đường phát nội bộ chưa gắn — Cấm — NEVER rơi về
 * `Math.random()`: đó là nguồn ngẫu nhiên thứ hai ngoài generator của phiên,
 * đúng thứ `BR-RNG-01`/`BR-RNG-06` cấm. Rơi về seed `0` cố định (có cảnh báo)
 * an toàn hơn — tối đa là bàn không đổi vị trí, không phải bàn không tái dựng
 * được.
 */
export function resolveLayoutSeed(payload: ConfigPayload): number {
  if (payload.layout_seed !== undefined) {
    return payload.layout_seed;
  }
  console.warn(
    `[play-session] payload thiếu layout_seed cho level ${payload.level_code} — dùng seed 0 (BR-RNG-06).`
  );
  return 0;
}

/**
 * Câu dẫn chờ tiếng chuông mở vòng dứt rồi mới vang, để hai âm không đè nhau.
 */
const ROUND_OPEN_NARRATION_DELAY_MS = 600;

export function usePlaySession(options: UsePlaySessionOptions) {
  const { canvasRef, loggedIn, syncView, onFallbackCue } = options;

  let engine: GameEngine | null = null;
  let roundRunner: RoundRunner | null = null;
  let cachedPayload: ConfigPayload | null = null;

  const isLoading = ref(true);
  const displayTitle = ref("");
  const currentThemeId = ref("default");
  const totalRounds = ref(1);
  const currentRound = ref(0);
  const canSkipRound = ref(false);

  const isEchoStep = ref(false);
  const isIntroCardStep = ref(false);
  const introStepIndex = ref(0);

  const showVictoryModal = ref(false);
  const earnedCelebration = ref<CelebrationTier>("great");
  const earnedStars = ref<number | null>(null);

  const { uploadTelemetry, finishSession } = usePlayTelemetry();
  const { setInstructionAudio, playInstructionNarration, stopNarrationAudio } =
    usePlayAudio({
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
      const s = engine.activeSession as {
        steps?: readonly { action: string }[];
        currentStepIndex?: number;
        difficulty?: { speak_along?: "off" | "tap" };
      };
      const stepIdx = s.currentStepIndex ?? 0;
      const step = s.steps?.[stepIdx];
      introStepIndex.value = stepIdx;
      // "off" (Task #273): bước echo vẫn tồn tại và vẫn đọc lại từ khoá,
      // nhưng bề mặt chơi thôi mời "nói theo" — hiện nút "Tiếp tục" thường,
      // không icon micro (xem [code].vue).
      isEchoStep.value =
        step?.action === "echo" && s.difficulty?.speak_along !== "off";
      isIntroCardStep.value =
        step?.action === "present" || step?.action === "echo";
    } else if (isIntroCardStep.value) {
      isIntroCardStep.value = false;
      isEchoStep.value = false;
    }
  }

  function buildEngineConfig(
    payload: ConfigPayload,
    levelCode: string,
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

  async function resolveCompletionOutcome(
    sessionUuid: string
  ): Promise<{ celebration: CelebrationTier; stars: number | null }> {
    if (!roundRunner) {
      return { celebration: "nice_try", stars: null };
    }
    try {
      await uploadTelemetry(
        sessionUuid,
        roundRunner,
        loggedIn.value,
        cachedPayload?.session?.started_at
      );
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
      };
    }
    return { celebration: "nice_try", stars: null };
  }

  async function completeSessionOnFinish(): Promise<void> {
    const sessionUuid = cachedPayload?.session?.uuid;
    if (sessionUuid && roundRunner) {
      const outcome = await resolveCompletionOutcome(sessionUuid);
      earnedCelebration.value = outcome.celebration;
      earnedStars.value = outcome.stars;
    } else {
      earnedCelebration.value = "nice_try";
      earnedStars.value = null;
    }
    showVictoryModal.value = true;
  }

  function handleRoundWonInternal(): void {
    if (!roundRunner) {
      return;
    }
    const sessionUuid = cachedPayload?.session?.uuid;
    if (sessionUuid) {
      uploadTelemetry(
        sessionUuid,
        roundRunner,
        loggedIn.value,
        cachedPayload?.session?.started_at
      ).catch((err) => {
        console.error(
          `[play-session] uploadTelemetry thất bại ở round won — session: ${sessionUuid}, error: ${err instanceof Error ? err.message : String(err)}`
        );
      });
    }

    // Tự động hoàn thành vòng hiện tại và chuyển sang vòng tiếp theo sau 900ms ăn mừng
    setTimeout(() => {
      if (roundRunner && !roundRunner.getState().isFinished) {
        roundRunner.completeCurrentRound();
      }
    }, 900);
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
        // vòng, và tự gate cử chỉ bằng `audioPromptCalled` của riêng nó —
        // Cấm — NEVER hạ `engine.acceptingInput` ở đây, không ai nâng lại.
        if (cachedPayload?.template_code === "GT-000") {
          roundRunner?.notePromptSettled();
          return;
        }
        const prompt =
          (roundConfig.content_pack as { prompt?: string })?.prompt ||
          roundConfig.instruction ||
          cachedPayload?.title;
        if (trigger === "replay") {
          // Nghe lại Cấm — NEVER khoá cử chỉ (BR-PNR-08): không truyền onSettled.
          playInstructionNarration(prompt);
          return;
        }
        const onNarrationSettled = () => {
          if (engine) {
            engine.acceptingInput = true;
          }
          roundRunner?.notePromptSettled();
        };
        setTimeout(() => {
          playInstructionNarration(prompt, onNarrationSettled);
        }, ROUND_OPEN_NARRATION_DELAY_MS);
      },
      onRoundStarted: (roundIndex) => {
        currentRound.value = roundIndex;
        canSkipRound.value = false;
        if (engine) {
          engine.roundIndex = roundIndex;
          // Chặn cử chỉ tới khi câu dẫn đọc xong (BR-PNR-11) — mở lại ở
          // `onNarrationSettled` bên trên. GT-000 tự quản lý gate riêng.
          engine.acceptingInput = cachedPayload?.template_code === "GT-000";
        }
        const session = roundRunner?.getCurrentSession();
        if (session && engine) {
          engine.activeSession = session;
          engine.audio.playStartSound();
        }
        syncView();
      },
      onRoundCompleted: () => {
        engine?.scaffolding?.resetOnSuccess();
        canSkipRound.value = false;
        syncView();
      },
      onAllRoundsCompleted: () => {
        engine?.audio.playLevelCelebrateSound();
        setTimeout(() => {
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
      });
      engine.onAfterRender = () => {
        syncIntroStepState();
      };
      engine.load(engineConfig, factory);
      engine.start(canvasRef.value);
      const initialSpace = engine.renderSystem.viewport?.logicSpace;
      if (initialSpace && roundRunner) {
        roundRunner.setLogicSpace(initialSpace);
      }
      syncView();
    }
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

    if (payload.assets && Array.isArray(payload.assets)) {
      await preloadPlayAssets(payload.assets);
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
    startRounds(
      payload,
      rounds,
      buildEngineConfig(payload, levelCode, rounds[0])
    );
  }

  function handleSkipRound(): void {
    canSkipRound.value = false;
    engine?.audio.playTapSound();
    engine?.scaffolding?.resetOnSuccess();
    roundRunner?.skipCurrentRound("scaffold_exhausted");
  }

  function setPaused(isPaused: boolean, reason?: string): void {
    if (!engine) {
      return;
    }
    if (isPaused) {
      engine.pause(reason);
    } else {
      engine.resume();
    }
  }

  function cleanupSession(): void {
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
  }

  return {
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
    handleRoundWonInternal,
    completeSessionOnFinish,
    setPaused,
    cleanupSession,
  };
}
