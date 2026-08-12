<script lang="ts" setup>
  import {
    EngineConfig,
    GameEngine,
    GameSession,
    GT001Session,
    GT002Session,
    GT003Session,
    GT004Session,
    GT005Session,
    GT006Session,
  } from "@kidthink/game-engine";
  import { onMounted, onUnmounted, ref } from "vue";
  import { useRoute } from "vue-router";

  interface ConfigPayload {
    level_code: string;
    content_version: number;
    template_code: string;
    content_pack: unknown;
    difficulty_params: unknown;
    theme_id: string;
    age_band: "3-4" | "4-5" | "5-6";
    flags?: {
      reduced_motion?: boolean;
      audio_enabled?: boolean;
      tap_fallback?: boolean;
    };
    assets?: Array<{ ref: string; kind: string; url?: string; glyph?: string }>;
  }

  const route = useRoute();
  const levelCode = route.params.code as string;

  const isLoading = ref(true);
  const errorMessage = ref<string | null>(null);
  const canvasRef = ref<HTMLCanvasElement | null>(null);

  let engine: GameEngine | null = null;

  function createSessionFactory(
    templateCode: string
  ): (cfg: EngineConfig) => GameSession {
    switch (templateCode) {
      case "GT-001":
        return (cfg) => new GT001Session(cfg as never);
      case "GT-002":
        return (cfg) => new GT002Session(cfg as never);
      case "GT-003":
        return (cfg) => new GT003Session(cfg as never);
      case "GT-004":
        return (cfg) => new GT004Session(cfg as never);
      case "GT-005":
        return (cfg) => new GT005Session(cfg as never);
      case "GT-006":
        return (cfg) => new GT006Session(cfg as never);
      default:
        throw new Error(`TEMPLATE_NOT_SUPPORTED: ${templateCode}`);
    }
  }

  /** Preload all resolved assets before engine start() (BR-CFG-01 & BR-CFG-08) */
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

  onMounted(async () => {
    try {
      isLoading.value = true;
      errorMessage.value = null;

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

      const engineConfig: EngineConfig = {
        level_code: payload.level_code,
        content_version: payload.content_version,
        template_code: payload.template_code,
        content_pack: payload.content_pack,
        difficulty_params: payload.difficulty_params,
        theme_id: payload.theme_id,
        age_band: payload.age_band || "3-4",
        reduced_motion: payload.flags?.reduced_motion ?? false,
        audio_enabled: payload.flags?.audio_enabled ?? true,
      };

      if (canvasRef.value) {
        engine = new GameEngine();
        engine.load(engineConfig, createSessionFactory(payload.template_code));
        engine.start(canvasRef.value);
      }
      isLoading.value = false;
    } catch (err: unknown) {
      isLoading.value = false;
      errorMessage.value =
        err instanceof Error ? err.message : "Lỗi tải cấu hình game";
    }
  });

  onUnmounted(() => {
    if (engine) {
      engine.stop();
      engine = null;
    }
  });
</script>

<template>
  <div class="game-play-container">
    <div class="loading-state" v-if="isLoading">
      <p>Đang tải trò chơi...</p>
    </div>
    <div class="error-state" v-else-if="errorMessage">
      <p>{{ errorMessage }}</p>
    </div>
    <canvas class="game-canvas" v-else ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
  .game-play-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-surface-100);
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
