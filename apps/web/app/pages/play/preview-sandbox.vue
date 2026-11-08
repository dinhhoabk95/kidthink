<template>
  <div class="preview-sandbox-container">
    <div class="error-state" role="alert" v-if="errorMessage">
      <p>{{ errorMessage }}</p>
    </div>
    <canvas
      ref="canvasRef"
      :class="['game-canvas', { 'game-canvas--fill': isFill }]"
      @pointercancel="handlePointerCancel"
      @pointerdown="handlePointerDown"
      @pointermove="handlePointerMove"
      @pointerup="handlePointerUp"
    ></canvas>
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
    resolveBaseMascotPose,
    type StageZones,
    TemplateGameSession,
  } from "@mindkid/game-engine";
  import {
    type EngineConfig,
    GameEngine,
    preloadGameSession,
  } from "@mindkid/game-engine/runtime";
  import { onMounted, onUnmounted, ref } from "vue";
  import { useRoute } from "vue-router";
  import { definePageMeta } from "#imports";
  import { resolveZonePromptText } from "~/composables/play/play-prompt-zone";
  import { playRoundOpenNarration } from "~/composables/play/round-open-narration";
  import { useMascotSprites } from "~/composables/play/use-mascot-sprites";
  import { usePlayGesture } from "~/composables/play/use-play-gesture";
  import { createSessionFactory } from "~/utils/game-session-factory";
  import {
    buildDefaultPreviewPayload,
    type JsonObject,
    type JsonValue,
    type StudioUpdatePayload,
  } from "~/utils/preview-sandbox-payloads";

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
  const mascotSprites = useMascotSprites();
  const feedbackOverlay = new FeedbackOverlay();

  let engine: GameEngine | null = null;
  let currentConfig: EngineConfig | null = null;
  let stageZones: StageZones | null = null;
  let trustedParentOrigin = "";
  let startSeq = 0;
  let replayTimer: ReturnType<typeof setTimeout> | undefined;
  let currentTemplateCode =
    typeof route.query.template === "string" && route.query.template.length > 0
      ? route.query.template
      : "GT-001";

  function isJsonObject(val: JsonValue | undefined): val is JsonObject {
    return typeof val === "object" && val !== null && !Array.isArray(val);
  }

  function handleRoundWon(): void {
    feedbackOverlay.celebrate();
    clearTimeout(replayTimer);
    replayTimer = setTimeout(() => {
      if (currentConfig) {
        startSession(currentConfig, currentTemplateCode, { autoReplay: true });
      }
    }, 1400);
  }

  function handleRetryDisallowed(): void {
    clearTimeout(replayTimer);
    replayTimer = setTimeout(() => {
      if (currentConfig) {
        startSession(currentConfig, currentTemplateCode, { autoReplay: true });
      }
    }, 600);
  }

  const gesture = usePlayGesture({
    getEngine: () => engine,
    canvasRef,
    onRoundWon: handleRoundWon,
    onRetryDisallowed: handleRetryDisallowed,
    getStageZones: () => stageZones,
    onPromptSpeakerTap: () => {
      const prompt = resolveZonePromptText(engine?.activeSession);
      if (prompt) {
        engine?.audio.speakPrompt(prompt);
      }
    },
    onFeedback: (kind, point) =>
      feedbackOverlay.trigger(kind, point, performance.now()),
  });

  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = gesture;

  /**
   * Đọc mở vòng như trang chơi thật: khung chuyện (`BR-FBK-16`) + câu dẫn,
   * rồi âm đề tự phát (`BR-E018-05`). Cue âm của session do engine tự phát
   * trong `advanceFrame` (`BR-FBK-14`), nên preview không cần nối thêm.
   *
   * Preview tự chơi lại sau thắng/sai-không-cho-thử-lại là cùng lượt xem, nên
   * khung chuyện chỉ kể ở lần mở đầu (`autoReplay` bỏ chuyện, giữ câu dẫn).
   * `engine.destroy()` cắt lời đang đọc và bắn `onEnd` đồng bộ: mỗi bước nối
   * tiếp kiểm engine còn là engine đã mở lượt đọc, để lời của phiên cũ không
   * vang sau khi phiên mới mở hoặc trang đã rời.
   */
  function speakRoundOpen(autoReplay: boolean): void {
    const eng = engine;
    const session = eng?.activeSession;
    if (!(eng && session)) {
      return;
    }
    const source = session instanceof TemplateGameSession ? session : null;
    playRoundOpenNarration(
      source,
      resolveZonePromptText(session),
      (text, onEnd, onError) => {
        if (engine !== eng) {
          onEnd();
          return;
        }
        eng.audio.speakPrompt(text, onEnd, onError);
      },
      { tellStory: !autoReplay }
    );
  }

  async function startSession(
    config: EngineConfig,
    templateCode: string,
    { autoReplay = false }: { autoReplay?: boolean } = {}
  ): Promise<void> {
    if (!canvasRef.value) {
      return;
    }
    const seq = ++startSeq;

    try {
      errorMessage.value = null;
      feedbackOverlay.reset();

      await preloadGameSession(templateCode);
      if (seq !== startSeq || !canvasRef.value) {
        return;
      }
      // Bỏ tham chiếu TRƯỚC khi huỷ: `destroy()` bắn `onEnd` của lời đang đọc
      // đồng bộ, và lượt đọc mở vòng nhận ra engine đã đổi để dừng nối tiếp.
      const previous = engine;
      engine = null;
      previous?.destroy();

      engine = new GameEngine();
      engine.load(config, createSessionFactory(templateCode));
      engine.start(canvasRef.value);
      applyStageZones(config);
      engine.onAfterRender = drawShellZones;
      gesture.syncView();
      speakRoundOpen(autoReplay);

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
    // Cùng dáng nền như trang chơi thật (`BR-FBK-15`) để bản xem trước khớp lúc chơi.
    const basePose = resolveBaseMascotPose({
      acceptingInput: engine?.acceptingInput ?? false,
      hintLevel: engine?.scaffolding?.getCurrentLevel() ?? 0,
      session,
    });
    const feedback = feedbackOverlay.frame(now, basePose, rs.reducedMotion);
    const prompt = resolveZonePromptText(session);
    if (prompt) {
      drawPromptZone(ctx, rs, stageZones, {
        promptText: prompt,
        mascotPose: feedback.mascotPose,
        mascotElapsedMs: feedback.mascotElapsedMs,
        mascotSprites: mascotSprites.value,
      });
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
    const gestureVisual = gesture.getGestureVisualState?.(now);
    if (gestureVisual) {
      drawActiveGestureOverlay(ctx, rs, gestureVisual, now);
    }
    drawFeedbackPulses(ctx, feedback.pulses);
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
      gesture.syncView();
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
    clearTimeout(replayTimer);
    window.removeEventListener("message", handleMessage);
    window.removeEventListener("resize", handleResize);
    clearTimeout(resizeTimer);
    const previous = engine;
    engine = null;
    previous?.destroy();
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
