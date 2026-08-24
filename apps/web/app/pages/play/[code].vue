<template>
  <div class="game-play-container">
    <div class="loading-state" v-if="isLoading">
      <p>Đang tải trò chơi...</p>
    </div>
    <div class="error-state" v-else-if="errorMessage">
      <p>{{ errorMessage }}</p>
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
  import { createSessionFactory } from "~/utils/game-session-factory";

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

  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);
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

  async function fetchAndStartGame() {
    const res = await fetch(`/api/users/levels/${levelCode}/config`);
    if (!res.ok) {
      const errJson = (await res.json().catch(() => ({}))) as {
        message?: string;
      };
      throw new Error(errJson.message || `Lỗi ${res.status}`);
    }
    const payload: ConfigPayload = await res.json();

    if (payload.assets && Array.isArray(payload.assets)) {
      await preloadAssets(payload.assets);
    }

    const rounds = payload.rounds ?? [];
    const firstRound = rounds[0];

    const engineConfig: EngineConfig = {
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
  }

  .game-canvas {
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .loading-state,
  .error-state {
    font-family: system-ui, sans-serif;
    font-size: 1.2rem;
    color: var(--color-surface-900);
  }
</style>
