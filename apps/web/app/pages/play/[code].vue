<template>
  <div class="game-play-container">
    <div class="loading-state" v-if="isLoading">
      <div class="loading-box">
        <span aria-hidden="true" class="loading-emoji animate-bounce">🎮</span>
        <p class="loading-text">Đang tải trò chơi cho bé...</p>
      </div>
    </div>
    <div class="error-state" v-else-if="errorMessage">
      <div class="error-card">
        <span aria-hidden="true" class="error-emoji">{{ errorEmoji }}</span>
        <h2 class="error-title">{{ errorTitle }}</h2>
        <p class="error-desc">{{ errorMessage }}</p>
        <div class="error-actions">
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
    <template v-else>
      <KidRoundProgressIndicator :current="currentRound" :total="totalRounds" />
      <canvas class="game-canvas" ref="canvasRef" />
    </template>
  </div>
</template>

<script lang="ts" setup>
  import {
    createGameSessionSync,
    type EngineConfig,
    GameEngine,
    type RoundConfig,
    RoundRunner,
  } from "@mindkid/game-engine";
  import { onMounted, onUnmounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { definePageMeta, useUserSession } from "#imports";
  import { createSessionFactory } from "~/utils/game-session-factory";

  definePageMeta({ layout: false });

  interface RoundPayload {
    round_index: number;
    instruction?: string | null;
    instruction_audio_path?: string | null;
    content_pack: unknown;
    difficulty_params: unknown;
    difficulty?: number;
  }

  interface ConfigPayload {
    level_code: string;
    code: string;
    content_version?: number;
    template_code: string;
    content_pack?: unknown;
    difficulty_params?: unknown;
    theme_id: string;
    age_band?: "3-4" | "4-5" | "5-6";
    scoring?: { mode: "rounds" | "attempts" };
    rounds?: RoundPayload[];
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
  const levelCode = route.params.code as string;
  const { loggedIn, fetch: fetchSession } = useUserSession();

  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);
  const errorTitle = ref<string>("Đã có lỗi xảy ra");
  const errorEmoji = ref<string>("😢");
  const errorActionLink = ref<string | null>(null);
  const errorActionText = ref<string>("Thử lại");

  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const currentRound = ref(0);
  const totalRounds = ref(1);

  let engine: GameEngine | null = null;
  let roundRunner: RoundRunner | null = null;

  async function preloadAssets(
    assets: Array<{ ref: string; kind: string; url?: string; glyph?: string }>
  ) {
    const promises: Promise<unknown>[] = [];
    for (const asset of assets) {
      if (asset.kind === "image" && asset.url) {
        const srcUrl = asset.url;
        promises.push(
          new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = srcUrl;
          })
        );
      } else if (asset.kind === "audio" && asset.url) {
        const srcUrl = asset.url;
        promises.push(
          new Promise((resolve) => {
            const aud = new Audio();
            aud.oncanplaythrough = resolve;
            aud.onerror = resolve;
            aud.src = srcUrl;
          })
        );
      }
    }
    await Promise.all(promises);
  }

  function startMultiRound(
    payload: ConfigPayload,
    rounds: RoundPayload[],
    engineConfig: EngineConfig
  ) {
    totalRounds.value = rounds.length;
    currentRound.value = 0;

    const roundConfigs: RoundConfig[] = rounds.map((r) => ({
      round_index: r.round_index,
      instruction: r.instruction,
      instruction_audio_path: r.instruction_audio_path,
      content_pack: r.content_pack,
      difficulty_params: r.difficulty_params,
    }));

    roundRunner = new RoundRunner({
      rounds: roundConfigs,
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
        const session = roundRunner?.getCurrentSession();
        if (session && engine) {
          engine.activeSession = session;
        }
      },
      onRoundCompleted: (_roundIndex, _wasSkipped) => {
        // Advance to next round after small pop delay
      },
      onAllRoundsCompleted: () => {
        // Big celebration only here
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
      engine = new GameEngine();
      engine.load(engineConfig, factory);
      engine.start(canvasRef.value);
    }
  }

  function startSingleRound(
    payload: ConfigPayload,
    engineConfig: EngineConfig
  ) {
    totalRounds.value = 1;
    currentRound.value = 0;

    if (canvasRef.value) {
      engine = new GameEngine();
      engine.load(engineConfig, createSessionFactory(payload.template_code));
      engine.start(canvasRef.value);
    }
  }

  function handleApiError(status: number, message?: string): Error {
    if (status === 403) {
      if (!loggedIn.value) {
        errorTitle.value = "Yêu cầu đăng nhập";
        errorEmoji.value = "🔒";
        errorActionLink.value = "/login";
        errorActionText.value = "Đăng nhập để chơi";
        return new Error(
          "Trò chơi này yêu cầu đăng nhập tài khoản để bé có thể tham gia và lưu tiến độ."
        );
      }

      errorTitle.value = "Cần nâng cấp gói học";
      errorEmoji.value = "⭐";
      errorActionLink.value = "/pricing";
      errorActionText.value = "Xem các gói học";
      return new Error(
        "Trò chơi này thuộc gói nâng cấp. Phụ huynh vui lòng mở khoá gói học để bé tiếp tục trải nghiệm."
      );
    }

    if (status === 428) {
      errorTitle.value = "Chưa chọn hồ sơ bé";
      errorEmoji.value = "👶";
      errorActionLink.value = "/me/children";
      errorActionText.value = "Chọn hồ sơ bé";
      return new Error(
        "Vui lòng chọn hoặc tạo hồ sơ của bé trước khi bắt đầu bài học."
      );
    }

    if (status === 404) {
      errorTitle.value = "Không tìm thấy trò chơi";
      errorEmoji.value = "📦";
      errorActionLink.value = "/games";
      errorActionText.value = "Xem danh sách trò chơi";
      return new Error("Trò chơi không tồn tại hoặc đã ngừng phát hành.");
    }

    errorTitle.value = "Lỗi tải trò chơi";
    errorEmoji.value = "⚠️";
    return new Error(message || `Lỗi tải cấu hình trò chơi (${status})`);
  }

  function buildEngineConfig(
    payload: ConfigPayload,
    firstRound?: RoundPayload
  ): EngineConfig {
    return {
      level_code: payload.level_code || payload.code,
      content_version: payload.content_version ?? 1,
      template_code: payload.template_code,
      content_pack: firstRound?.content_pack ?? payload.content_pack,
      difficulty_params:
        firstRound?.difficulty_params ?? payload.difficulty_params,
      theme_id: payload.theme_id,
      age_band: payload.age_band || "3-4",
      reduced_motion: payload.flags?.reduced_motion ?? false,
      audio_enabled: payload.flags?.audio_enabled ?? true,
    };
  }

  async function fetchAndStartGame() {
    if (!loggedIn.value) {
      await fetchSession().catch(() => {
        // session not established yet
      });
    }

    const endpoint = loggedIn.value
      ? `/api/users/levels/${levelCode}/config`
      : `/api/guest/levels/${levelCode}/config`;

    const res = await fetch(endpoint);
    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as {
        statusMessage?: string;
        message?: string;
      };
      throw handleApiError(res.status, errJson.message);
    }

    const payload: ConfigPayload = await res.json();

    if (payload.assets && Array.isArray(payload.assets)) {
      await preloadAssets(payload.assets);
    }

    const rounds = payload.rounds ?? [];
    const engineConfig = buildEngineConfig(payload, rounds[0]);

    if (rounds.length > 1) {
      startMultiRound(payload, rounds, engineConfig);
    } else {
      startSingleRound(payload, engineConfig);
    }
  }

  onMounted(async () => {
    try {
      isLoading.value = true;
      errorMessage.value = null;
      await fetchAndStartGame();
      isLoading.value = false;
    } catch (err: unknown) {
      isLoading.value = false;
      errorMessage.value =
        err instanceof Error ? err.message : "Lỗi tải cấu hình game";
    }
  });

  onUnmounted(() => {
    if (roundRunner) {
      roundRunner.destroy();
      roundRunner = null;
    }
    if (engine) {
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
    background-color: var(--color-surface-100);
    position: relative;
    overflow: hidden;
  }

  .game-canvas {
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .loading-state,
  .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    width: 100%;
    max-width: 32rem;
  }

  .loading-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    background-color: white;
    padding: 2.5rem 2rem;
    border-radius: 1.5rem;
    border: 3px solid var(--color-surface-200);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    text-align: center;
  }

  .loading-emoji {
    font-size: 3.5rem;
    line-height: 1;
  }

  .loading-text {
    font-family: var(--font-heading, system-ui, sans-serif);
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-surface-800);
    margin: 0;
  }

  .error-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
    padding: 2.5rem 2rem;
    border-radius: 1.5rem;
    border: 3px solid var(--color-surface-300);
    box-shadow: 0 8px 0 var(--color-surface-300);
    text-align: center;
    width: 100%;
  }

  .error-emoji {
    font-size: 3.5rem;
    margin-bottom: 0.75rem;
    line-height: 1;
  }

  .error-title {
    font-family: var(--font-heading, "Fredoka", system-ui, sans-serif);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0 0 0.5rem 0;
  }

  .error-desc {
    font-size: 1rem;
    line-height: 1.5;
    color: var(--color-surface-600);
    margin: 0 0 1.75rem 0;
  }

  .error-actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .btn-primary,
  .btn-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
    padding: 0.75rem 1.5rem;
    border-radius: 1rem;
    font-family: var(--font-heading, system-ui, sans-serif);
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .btn-primary {
    background-color: var(--color-cta, #f97316);
    color: white;
    border: 2px solid transparent;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.15);
  }

  .btn-primary:hover {
    background-color: var(--color-cta-hover, #ea580c);
  }

  .btn-primary:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
  }

  .btn-secondary {
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
    border: 2px solid var(--color-surface-300);
  }

  .btn-secondary:hover {
    background-color: var(--color-surface-200);
  }

  .btn-secondary:active {
    transform: translateY(2px);
  }
</style>
