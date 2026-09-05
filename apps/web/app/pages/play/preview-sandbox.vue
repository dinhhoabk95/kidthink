<template>
  <div class="preview-sandbox-container">
    <div class="error-state" v-if="errorMessage">
      <p>{{ errorMessage }}</p>
    </div>
    <canvas class="game-canvas" ref="canvasRef"></canvas>
  </div>
</template>

<script lang="ts" setup>
  import { type EngineConfig, GameEngine } from "@mindkid/game-engine";
  import { preloadGameSession } from "@mindkid/game-engine/runtime";
  import { onMounted, onUnmounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { definePageMeta } from "#imports";
  import { createSessionFactory } from "~/utils/game-session-factory";

  interface StudioUpdatePayload {
    templateCode?: string;
    levelData?: Record<string, unknown>;
    ageBand?: "3-4" | "4-5" | "5-6";
    reducedMotion?: boolean;
    muted?: boolean;
  }

  // Không khai gì thì trang rơi vào layout `default` — navbar và footer
  // marketing đè lên khung xem trước của Studio. Đây là bề mặt nhúng, không
  // phải trang cho người đọc.
  definePageMeta({ layout: false });

  const route = useRoute();
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const errorMessage = ref<string | null>(null);

  let engine: GameEngine | null = null;
  let currentConfig: EngineConfig | null = null;
  let currentTemplateCode = (route.query.template as string) || "GT-001";

  async function startSession(config: EngineConfig, templateCode: string) {
    if (!canvasRef.value) {
      return;
    }

    try {
      errorMessage.value = null;
      if (engine) {
        engine.destroy();
        engine = null;
      }

      await preloadGameSession(templateCode);

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

  function handleMessage(event: MessageEvent) {
    // Nhận cấu hình từ iframe cha (Studio Preview Frame)
    if (!event.data || typeof event.data !== "object") {
      return;
    }

    const { type, payload } = event.data;
    if (type === "MindKid_STUDIO_UPDATE_CONFIG" && payload) {
      const data = payload as StudioUpdatePayload;
      const tCode = data.templateCode || currentTemplateCode;
      currentTemplateCode = tCode;

      const levelData = data.levelData || {};
      const config: EngineConfig = {
        level_code: `PREVIEW-${tCode}`,
        content_version: 1,
        template_code: tCode,
        content_pack: (levelData.content_pack as Record<string, unknown>) || {},
        difficulty_params:
          (levelData.difficulty_params as Record<string, unknown>) || {},
        theme_id: (levelData.theme_id as string) || "default",
        age_band: data.ageBand || "3-4",
        reduced_motion: data.reducedMotion ?? false,
        audio_enabled: !(data.muted ?? false),
      };

      currentConfig = config;
      startSession(config, tCode);
    } else if (type === "MindKid_STUDIO_RELOAD" && currentConfig) {
      startSession(currentConfig, currentTemplateCode);
    }
  }

  onMounted(() => {
    window.addEventListener("message", handleMessage);

    // Thông báo cho Studio biết sandbox đã sẵn sàng
    if (window.parent) {
      window.parent.postMessage({ type: "MindKid_STUDIO_SANDBOX_READY" }, "*");
    }

    // Khởi tạo một phiên mặc định nếu được gọi với ?template=GT-xxx
    const tCode = (route.query.template as string) || "GT-001";
    currentTemplateCode = tCode;
    currentConfig = {
      level_code: `PREVIEW-${tCode}`,
      content_version: 1,
      template_code: tCode,
      content_pack: {},
      difficulty_params: {},
      theme_id: "default",
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
    /* Engine vẽ trong không gian logic 16:9. Cho hộp đúng tỉ lệ đó thì lề
       letterbox bằng 0 và ảnh chụp phản ánh đúng cảnh, không lẫn nền trống. */
    width: 100%;
    height: auto;
    max-width: calc(100vh * 16 / 9);
    max-height: 100vh;
    aspect-ratio: 16 / 9;
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
