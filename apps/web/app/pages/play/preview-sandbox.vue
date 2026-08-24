<script lang="ts" setup>
  import { type EngineConfig, GameEngine } from "@mindkid/game-engine";
  import { onMounted, onUnmounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { createSessionFactory } from "~/utils/game-session-factory";

  interface StudioUpdatePayload {
    templateCode?: string;
    levelData?: Record<string, unknown>;
    ageBand?: "3-4" | "4-5" | "5-6";
    reducedMotion?: boolean;
    muted?: boolean;
  }

  const route = useRoute();
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const errorMessage = ref<string | null>(null);

  let engine: GameEngine | null = null;
  let currentConfig: EngineConfig | null = null;
  let currentTemplateCode = (route.query.template as string) || "GT-001";

  function startSession(config: EngineConfig, templateCode: string) {
    if (!canvasRef.value) {
      return;
    }

    try {
      errorMessage.value = null;
      if (engine) {
        engine.destroy();
        engine = null;
      }

      engine = new GameEngine();
      engine.load(config, createSessionFactory(templateCode));
      engine.start(canvasRef.value);
    } catch (err: unknown) {
      errorMessage.value =
        err instanceof Error ? err.message : "Lỗi khởi chạy engine";
      if (window.parent) {
        window.parent.postMessage(
          {
            type: "MindKid_STUDIO_ENGINE_ERROR",
            error: errorMessage.value,
          },
          "*"
        );
      }
    }
  }

  function buildEngineConfig(
    payload: StudioUpdatePayload,
    tCode: string
  ): EngineConfig {
    const levelData = payload.levelData || {};
    const versionNum =
      Number(levelData.contentVersion || levelData.content_version) || 1;
    const themeId =
      (levelData.theme_id as string) ||
      (levelData.themeId as string) ||
      "nature";
    const ageBand =
      payload.ageBand || (levelData.age_band as "3-4" | "4-5" | "5-6") || "3-4";

    return {
      level_code: (levelData.code as string) || "PREVIEW-SANDBOX",
      content_version: versionNum,
      template_code: tCode,
      content_pack: levelData.content_pack || levelData.contentPack || {},
      difficulty_params:
        levelData.difficulty_params || levelData.difficultyParams || {},
      theme_id: themeId,
      age_band: ageBand,
      reduced_motion: Boolean(payload.reducedMotion),
      audio_enabled: !payload.muted,
    };
  }

  function handleMessage(event: MessageEvent) {
    const data = event.data;
    if (!data || typeof data !== "object") {
      return;
    }

    if (data.type === "MindKid_STUDIO_UPDATE") {
      const payload: StudioUpdatePayload = data.payload || {};
      const tCode = payload.templateCode || currentTemplateCode || "GT-001";
      currentTemplateCode = tCode;

      const config = buildEngineConfig(payload, tCode);
      currentConfig = config;
      startSession(config, tCode);
    } else if (data.type === "MindKid_STUDIO_REPLAY" && currentConfig) {
      startSession(currentConfig, currentTemplateCode);
    }
  }

  onMounted(() => {
    window.addEventListener("message", handleMessage);

    const tCode = (route.query.template as string) || "GT-001";
    currentTemplateCode = tCode;
    currentConfig = {
      level_code: "PREVIEW-INIT",
      content_version: 1,
      template_code: tCode,
      content_pack: {},
      difficulty_params: {},
      theme_id: "nature",
      age_band: "3-4",
      reduced_motion: false,
      audio_enabled: true,
    };
    startSession(currentConfig, tCode);
  });

  onUnmounted(() => {
    window.removeEventListener("message", handleMessage);
    if (engine) {
      engine.destroy();
      engine = null;
    }
  });
</script>

<template>
  <div class="preview-sandbox-container">
    <div class="error-state" v-if="errorMessage">
      <p>{{ errorMessage }}</p>
    </div>
    <canvas class="game-canvas" ref="canvasRef"></canvas>
  </div>
</template>

<style scoped>
  .preview-sandbox-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(
      --color-surface-100
    ); /* light mode only (BR-LPV-02) */
    overflow: hidden;
  }

  .game-canvas {
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .error-state {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    padding: 0.75rem 1rem;
    background-color: rgba(244, 63, 94, 0.9);
    color: white;
    font-family: system-ui, sans-serif;
    font-size: 0.875rem;
    border-radius: 0.75rem;
    z-index: 10;
  }
</style>
