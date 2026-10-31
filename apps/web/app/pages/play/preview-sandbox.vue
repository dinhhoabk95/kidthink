<template>
  <div class="preview-sandbox-container">
    <div class="error-state" role="alert" v-if="errorMessage">
      <p>{{ errorMessage }}</p>
    </div>
    <canvas
      ref="canvasRef"
      :class="['game-canvas', { 'game-canvas--fill': isFill }]"
    ></canvas>
  </div>
</template>

<script lang="ts" setup>
  import {
    computeZonesForSession,
    drawCommitButton,
    drawPromptZone,
    type StageZones,
    TemplateGameSession,
  } from "@mindkid/game-engine";
  import {
    type EngineConfig,
    GameEngine,
    preloadGameSession,
  } from "@mindkid/game-engine/runtime";
  import type { AgeBand } from "@mindkid/shared/client";
  import { onMounted, onUnmounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { definePageMeta } from "#imports";
  import { resolveZonePromptText } from "~/composables/play/play-prompt-zone";
  import { createSessionFactory } from "~/utils/game-session-factory";

  type JsonPrimitive = string | number | boolean | null;
  type JsonValue = JsonPrimitive | JsonObject | JsonArray;
  interface JsonObject {
    [key: string]: JsonValue;
  }
  type JsonArray = JsonValue[];

  interface StudioUpdatePayload {
    templateCode?: string;
    levelData?: JsonObject;
    ageBand?: AgeBand;
    reducedMotion?: boolean;
    muted?: boolean;
  }

  interface StudioMessageData extends StudioUpdatePayload {
    type?: string;
    payload?: StudioUpdatePayload;
  }

  // Không khai gì thì trang rơi vào layout `default` — navbar và footer
  // marketing đè lên khung xem trước của Studio. Đây là bề mặt nhúng, không
  // phải trang cho người đọc.
  definePageMeta({ layout: false });

  const route = useRoute();
  const canvasRef = ref<HTMLCanvasElement | null>(null);
  const errorMessage = ref<string | null>(null);
  /** `?fit=fill`: canvas lấp đầy khung (xem portrait, điện thoại ngang) thay vì hộp 16:9 của Studio. */
  const isFill = route.query.fit === "fill";

  let engine: GameEngine | null = null;
  let currentConfig: EngineConfig | null = null;
  let stageZones: StageZones | null = null;
  let trustedParentOrigin = "";
  let startSeq = 0;
  let currentTemplateCode =
    typeof route.query.template === "string" && route.query.template.length > 0
      ? route.query.template
      : "GT-001";

  function isJsonObject(val: JsonValue | undefined): val is JsonObject {
    return typeof val === "object" && val !== null && !Array.isArray(val);
  }

  async function startSession(
    config: EngineConfig,
    templateCode: string
  ): Promise<void> {
    if (!canvasRef.value) {
      return;
    }
    const seq = ++startSeq;

    try {
      errorMessage.value = null;

      await preloadGameSession(templateCode);
      if (seq !== startSeq || !canvasRef.value) {
        return;
      }
      if (engine) {
        engine.destroy();
        engine = null;
      }

      engine = new GameEngine();
      engine.load(config, createSessionFactory(templateCode));
      engine.start(canvasRef.value);
      applyStageZones(config);
      engine.onAfterRender = drawShellZones;

      if (window.parent) {
        window.parent.postMessage(
          {
            type: "MindKid_STUDIO_SESSION_LOADED",
            levelCode: config.level_code,
            templateCode,
          },
          trustedParentOrigin || window.location.origin
        );
      }
    } catch (err) {
      if (seq !== startSeq) {
        return;
      }
      errorMessage.value =
        err instanceof Error ? err.message : "Lỗi khởi chạy engine";
      if (window.parent) {
        window.parent.postMessage(
          {
            type: "MindKid_STUDIO_ENGINE_ERROR",
            error: errorMessage.value,
          },
          trustedParentOrigin || window.location.origin
        );
      }
    }
  }

  /**
   * Preview dùng cùng khung năm vùng với trang chơi:
   * cùng `computeZonesForSession`, cùng `prepareRound`, nên Manager thấy đúng bố
   * cục trẻ thấy. Không HUD.
   */
  function applyStageZones(config: EngineConfig, isResize = false): void {
    const vp = engine?.renderSystem.viewport;
    const session = engine?.activeSession;
    if (!(vp?.logicSpace && session instanceof TemplateGameSession)) {
      stageZones = null;
      return;
    }
    stageZones = computeZonesForSession(
      {
        logicW: vp.logicSpace.w,
        logicH: vp.logicSpace.h,
        ageBand: config.age_band,
        cssPerLogic: vp.scale,
      },
      session
    );
    // Đổi cỡ giữa vòng chỉ tính lại slot, không dựng lại vòng (`BR-PSZ-12`).
    const place = isResize
      ? session.resolveSlots.bind(session)
      : session.prepareRound.bind(session);
    place(
      config.age_band,
      vp.logicSpace,
      stageZones.stage,
      stageZones.tray ?? undefined,
      vp.scale
    );
  }

  function drawShellZones(
    ctx: CanvasRenderingContext2D,
    rs: Parameters<typeof drawPromptZone>[1],
    now: number
  ): void {
    const session = engine?.activeSession;
    if (!stageZones) {
      return;
    }
    const prompt = resolveZonePromptText(session);
    if (prompt) {
      drawPromptZone(ctx, rs, stageZones, { promptText: prompt });
    }
    if (session instanceof TemplateGameSession && session.needsCommit) {
      drawCommitButton(ctx, rs, stageZones.action, {
        enabled: session.canCommit?.() ?? true,
        origin: "top-left",
        icon: session.commitIcon,
        hint: engine?.actionHinted
          ? { timeMs: now, reducedMotion: rs.reducedMotion }
          : undefined,
      });
    }
  }

  function parseConfigFromPayload(
    payload: StudioUpdatePayload,
    templateCode: string
  ): EngineConfig {
    const levelData: JsonObject = payload.levelData ?? {};
    const contentPack = isJsonObject(levelData.content_pack)
      ? levelData.content_pack
      : {};
    const difficultyParams = isJsonObject(levelData.difficulty_params)
      ? levelData.difficulty_params
      : {};
    return {
      level_code:
        typeof levelData.code === "string" && levelData.code.length > 0
          ? levelData.code
          : `PREVIEW-${templateCode}`,
      content_version: 1,
      template_code: templateCode,
      content_pack: contentPack,
      difficulty_params: difficultyParams,
      theme_id:
        typeof levelData.theme_id === "string" && levelData.theme_id.length > 0
          ? levelData.theme_id
          : "default",
      age_band: payload.ageBand || "3-4",
      reduced_motion: payload.reducedMotion ?? false,
      audio_enabled: !(payload.muted ?? false),
    };
  }

  const RESIZE_DEBOUNCE_MS = 150;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;

  /** Xoay máy hoặc đổi cỡ khung preview: đo lại canvas, tính lại vùng và slot (`BR-PSZ-12`). */
  function handleResize(): void {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!(engine && canvasRef.value && currentConfig)) {
        return;
      }
      engine.renderSystem.setupCanvas(canvasRef.value);
      applyStageZones(currentConfig, true);
    }, RESIZE_DEBOUNCE_MS);
  }

  const DEV_LOOPBACK_REGEX = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  const ADMIN_PREFIX_REGEX = /^admin\./;

  function isAllowedOrigin(origin: string): boolean {
    if (origin === window.location.origin) {
      return true;
    }
    // Cho phép localhost / loopback khi dev
    if (import.meta.dev && DEV_LOOPBACK_REGEX.test(origin)) {
      return true;
    }
    try {
      const config = useRuntimeConfig();
      const originUrl = new URL(origin);
      const siteUrl = config.public?.siteUrl;
      if (
        typeof siteUrl === "string" &&
        siteUrl.length > 0 &&
        new URL(siteUrl).origin === origin
      ) {
        return true;
      }
      const apiBaseUrl = config.public?.apiBaseUrl;
      if (
        typeof apiBaseUrl === "string" &&
        apiBaseUrl.length > 0 &&
        new URL(apiBaseUrl).origin === origin
      ) {
        return true;
      }
      const currentHost = window.location.hostname;
      if (currentHost.includes(".")) {
        const baseDomain = currentHost.replace(ADMIN_PREFIX_REGEX, "");
        if (
          originUrl.protocol === window.location.protocol &&
          originUrl.port === window.location.port &&
          (originUrl.hostname === baseDomain ||
            originUrl.hostname === `admin.${baseDomain}`)
        ) {
          return true;
        }
      }
    } catch {
      return false;
    }
    return false;
  }

  function buildDefaultPreviewPayload(
    templateCode: string
  ): StudioUpdatePayload {
    switch (templateCode) {
      case "GT-002":
        return {
          templateCode: "GT-002",
          ageBand: "4-5",
          levelData: {
            code: "PREVIEW-GT-002",
            content_pack: {
              prompt: "Bé hãy chạm chọn tất cả các quả ngọt nhé",
              items: [
                {
                  item_id: "i1",
                  asset: { kind: "emoji", ref: "🍎" },
                  is_target: true,
                },
                {
                  item_id: "i2",
                  asset: { kind: "emoji", ref: "🍌" },
                  is_target: true,
                },
                {
                  item_id: "i3",
                  asset: { kind: "emoji", ref: "🥦" },
                  is_target: false,
                },
              ],
            },
            difficulty_params: {
              distractor_count: 1,
              target_count: 2,
              hint_after_ms: 10_000,
              allow_retry: true,
            },
            theme_id: "default",
          },
        };
      case "GT-003":
        return {
          templateCode: "GT-003",
          ageBand: "3-4",
          levelData: {
            code: "PREVIEW-GT-003",
            content_pack: {
              prompt: "Bỏ bông hoa vào giỏ",
              baskets: [
                {
                  basket_id: "b1",
                  label: "Giỏ hoa",
                  asset: { kind: "emoji", ref: "🧺" },
                },
              ],
              items: [
                {
                  item_id: "i1",
                  basket_id: "b1",
                  asset: { kind: "emoji", ref: "🌸" },
                },
                {
                  item_id: "i2",
                  basket_id: "b1",
                  asset: { kind: "emoji", ref: "🌼" },
                },
              ],
            },
            difficulty_params: {
              distractor_count: 1,
              target_count: 1,
              hint_after_ms: 10_000,
              allow_retry: true,
            },
            theme_id: "default",
          },
        };
      case "GT-004":
        return {
          templateCode: "GT-004",
          ageBand: "4-5",
          levelData: {
            code: "PREVIEW-GT-004",
            content_pack: {
              prompt: "Phân loại động vật và thực vật",
              groups: [
                {
                  group_id: "g1",
                  name: "Động vật",
                  asset: { kind: "emoji", ref: "🐾" },
                },
                {
                  group_id: "g2",
                  name: "Trái cây",
                  asset: { kind: "emoji", ref: "🍎" },
                },
              ],
              items: [
                {
                  item_id: "i1",
                  correct_group_id: "g1",
                  asset: { kind: "emoji", ref: "🐱" },
                },
                {
                  item_id: "i2",
                  correct_group_id: "g1",
                  asset: { kind: "emoji", ref: "🐶" },
                },
                {
                  item_id: "i3",
                  correct_group_id: "g2",
                  asset: { kind: "emoji", ref: "🍎" },
                },
                {
                  item_id: "i4",
                  correct_group_id: "g2",
                  asset: { kind: "emoji", ref: "🍌" },
                },
              ],
            },
            difficulty_params: {
              item_count: 4,
              distractor_count: 0,
              hint_after_ms: 10_000,
              allow_retry: true,
              shuffle_items: true,
            },
            theme_id: "default",
          },
        };
      case "GT-005":
        return {
          templateCode: "GT-005",
          ageBand: "3-4",
          levelData: {
            code: "PREVIEW-GT-005",
            content_pack: {
              prompt: "Ghép cặp hai con vật giống nhau",
              pairs: [
                {
                  pair_id: "p1",
                  left: { item_id: "l1", asset: { kind: "emoji", ref: "🐱" } },
                  right: { item_id: "r1", asset: { kind: "emoji", ref: "🐱" } },
                },
                {
                  pair_id: "p2",
                  left: { item_id: "l2", asset: { kind: "emoji", ref: "🐶" } },
                  right: { item_id: "r2", asset: { kind: "emoji", ref: "🐶" } },
                },
              ],
            },
            difficulty_params: {
              hint_after_ms: 10_000,
              allow_retry: true,
              shuffle_sides: true,
            },
            theme_id: "default",
          },
        };
      case "GT-006":
        return {
          templateCode: "GT-006",
          ageBand: "5-6",
          levelData: {
            code: "PREVIEW-GT-006",
            content_pack: {
              prompt: "Xếp các loài chim theo thứ tự đúng",
              sequence: [
                {
                  step_id: "s1",
                  order_index: 0,
                  asset: { kind: "emoji", ref: "🐦" },
                  label: "Chim nhỏ",
                },
                {
                  step_id: "s2",
                  order_index: 1,
                  asset: { kind: "emoji", ref: "🕊️" },
                  label: "Bồ câu",
                },
                {
                  step_id: "s3",
                  order_index: 2,
                  asset: { kind: "emoji", ref: "🐧" },
                  label: "Cánh cụt",
                },
              ],
            },
            difficulty_params: {
              hint_after_ms: 15_000,
              allow_retry: true,
              shuffle_initial: true,
            },
            theme_id: "default",
          },
        };
      case "GT-014":
        return {
          templateCode: "GT-014",
          ageBand: "5-6",
          levelData: {
            code: "PREVIEW-GT-014",
            content_pack: {
              prompt: "Bé hãy chạm vào đĩa cân của loại quả nặng hơn nhé!",
              goal: "pick_heavier",
              left_pan: [
                {
                  item_id: "watermelon",
                  asset: { kind: "emoji", ref: "🍉" },
                  weight: 5,
                },
              ],
              right_pan: [
                {
                  item_id: "apple",
                  asset: { kind: "emoji", ref: "🍎" },
                  weight: 1,
                },
              ],
              tray: [
                {
                  item_id: "w1",
                  asset: { kind: "emoji", ref: "1️⃣" },
                  weight: 1,
                },
                {
                  item_id: "w2",
                  asset: { kind: "emoji", ref: "2️⃣" },
                  weight: 2,
                },
              ],
            },
            difficulty_params: {
              hint_after_ms: 10_000,
              allow_retry: true,
              weight_limit: 10,
            },
            theme_id: "default",
          },
        };
      default:
        return {
          templateCode,
          ageBand: "3-4",
          levelData: {
            code: `PREVIEW-${templateCode}`,
            content_pack: {
              prompt: "Tìm quả táo màu đỏ",
              target_item: {
                item_id: "apple_target",
                asset: { kind: "emoji", ref: "🍎" },
              },
              options: [
                {
                  item_id: "apple_opt",
                  asset: { kind: "emoji", ref: "🍎" },
                  is_correct: true,
                },
                {
                  item_id: "banana_opt",
                  asset: { kind: "emoji", ref: "🍌" },
                  is_correct: false,
                },
                {
                  item_id: "orange_opt",
                  asset: { kind: "emoji", ref: "🍊" },
                  is_correct: false,
                },
              ],
            },
            difficulty_params: {
              distractor_count: 2,
              hint_after_ms: 8000,
              allow_retry: true,
              shuffle_items: true,
            },
            theme_id: "default",
          },
        };
    }
  }

  function handleMessage(event: MessageEvent<StudioMessageData>): void {
    if (!isAllowedOrigin(event.origin)) {
      return;
    }
    trustedParentOrigin = event.origin;
    const data = event.data;
    if (!data || typeof data !== "object") {
      return;
    }

    const type = data.type;
    if (
      type === "MindKid_STUDIO_UPDATE" ||
      type === "MindKid_STUDIO_CONFIG_UPDATE"
    ) {
      const payload: StudioUpdatePayload = data.payload ?? data;
      const tCode = payload.templateCode || currentTemplateCode;
      currentTemplateCode = tCode;
      const config = parseConfigFromPayload(payload, tCode);
      currentConfig = config;
      startSession(config, tCode);
      return;
    }

    if (
      (type === "MindKid_STUDIO_REPLAY" || type === "MindKid_STUDIO_RELOAD") &&
      currentConfig
    ) {
      startSession(currentConfig, currentTemplateCode);
    }
  }

  let autoInitTimer: ReturnType<typeof setTimeout> | undefined;

  onMounted(() => {
    window.addEventListener("message", handleMessage);
    (
      window as Window & { __mindkidSandboxReady?: boolean }
    ).__mindkidSandboxReady = true;
    window.addEventListener("resize", handleResize);

    // Thông báo cho Studio biết sandbox đã sẵn sàng
    if (window.parent) {
      window.parent.postMessage(
        { type: "MindKid_STUDIO_SANDBOX_READY" },
        trustedParentOrigin || window.location.origin
      );
    }

    const tCode =
      typeof route.query.template === "string" &&
      route.query.template.length > 0
        ? route.query.template
        : "GT-001";
    currentTemplateCode = tCode;

    autoInitTimer = setTimeout(() => {
      if (!currentConfig) {
        const payload = buildDefaultPreviewPayload(currentTemplateCode);
        const config = parseConfigFromPayload(payload, currentTemplateCode);
        currentConfig = config;
        startSession(config, currentTemplateCode);
      }
    }, 150);
  });

  onUnmounted(() => {
    ++startSeq;
    clearTimeout(autoInitTimer);
    window.removeEventListener("message", handleMessage);
    window.removeEventListener("resize", handleResize);
    clearTimeout(resizeTimer);
    if (engine) {
      engine.destroy();
      engine = null;
    }
  });
</script>

<style scoped>
  .preview-sandbox-container {
    position: relative;
    width: 100%;
    max-width: 100vw;
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

  .game-canvas--fill {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    aspect-ratio: auto;
  }

  .error-state {
    position: absolute;
    top: 1rem;
    left: 1rem;
    right: 1rem;
    padding: 0.75rem 1rem;
    background-color: var(--color-retry-100);
    border: 3px solid var(--color-retry-500);
    color: var(--color-retry-900);
    font-family: var(--font-sans);
    font-size: 1rem;
    line-height: 1.5;
    border-radius: var(--radius-button);
    z-index: 10;
  }
</style>
