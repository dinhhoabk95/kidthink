import type { AgeBand } from "./contracts/types.js";
import type { GameSession, TelemetryEvent } from "./game-session.js";
import {
  getGameTemplate,
  validateContentPack,
} from "./generated/template-registry.js";
import { InteractionManager } from "./interaction.js";
import { isLayoutId, resolveLayout } from "./layout/registry.js";
import type { LayoutId, Slot } from "./layout/types.js";
import { AudioController } from "./systems/audio-controller.js";
import { RenderSystem } from "./systems/render-system.js";
import { ScaffoldingSystem } from "./systems/scaffolding.js";

/** Monotonic clock, falling back to Date.now in non-browser test envs. */
function nowMs(): number {
  return typeof performance === "undefined" ? Date.now() : performance.now();
}

function resolveLevelLayoutId(
  templateCode: string,
  difficultyParams: unknown
): LayoutId {
  const template = getGameTemplate(templateCode);
  const rawLayoutId =
    typeof difficultyParams === "object" &&
    difficultyParams !== null &&
    "layout_id" in difficultyParams
      ? difficultyParams.layout_id
      : undefined;

  let layoutId: LayoutId = "grid";
  if (isLayoutId(rawLayoutId)) {
    layoutId = rawLayoutId;
  } else if (template?.layouts[0]) {
    layoutId = template.layouts[0];
  }

  if (template && !template.layouts.some((l) => l === layoutId)) {
    throw new Error(
      `LAYOUT_NOT_SUPPORTED: Layout '${layoutId}' không được hỗ trợ bởi template '${templateCode}' (BR-LAY-02).`
    );
  }

  return layoutId;
}

function extractContentDimensions(contentPack: unknown): {
  slotCount: number;
  targetCount: number | undefined;
} {
  let optionsArray: unknown[] = [];
  let targetCount: number | undefined;

  if (typeof contentPack === "object" && contentPack !== null) {
    if ("options" in contentPack && Array.isArray(contentPack.options)) {
      optionsArray = contentPack.options;
    } else if ("items" in contentPack && Array.isArray(contentPack.items)) {
      optionsArray = contentPack.items;
    }
    if ("buckets" in contentPack && Array.isArray(contentPack.buckets)) {
      targetCount = contentPack.buckets.length;
    }
  }

  return {
    slotCount: optionsArray.length || 4,
    targetCount,
  };
}

function computeEngineSlots(config: EngineConfig): Slot[] {
  const layoutId = resolveLevelLayoutId(
    config.template_code,
    config.difficulty_params
  );
  const { slotCount, targetCount } = extractContentDimensions(
    config.content_pack
  );
  const layoutFn = resolveLayout(layoutId);

  return layoutFn({
    slotCount,
    ageBand: config.age_band,
    targetCount,
  });
}

export interface EngineConfig {
  level_code: string;
  content_version: number;
  template_code: string;
  content_pack: unknown;
  difficulty_params: unknown;
  theme_id: string;
  age_band: AgeBand;
  reduced_motion: boolean;
  audio_enabled: boolean;
  layout_seed?: number;
}

export type EventCallback = (event: TelemetryEvent) => void;

export class GameEngine {
  config?: EngineConfig;
  activeSession?: GameSession;
  slots: Slot[] = [];
  readonly renderSystem = new RenderSystem();
  readonly interaction = new InteractionManager();
  readonly audio = new AudioController();
  scaffolding?: ScaffoldingSystem;

  private isRunning = false;
  private isPaused = false;
  private rafId?: number;
  private lastFrameTimeMs = 0;
  /** Set by `start(canvas)`. Absent in headless runs — the loop then skips drawing. */
  private ctx?: CanvasRenderingContext2D;

  private readonly eventListeners: Map<string, Set<EventCallback>> = new Map();
  private readonly networkRequestCountDuringPlay = 0; // Must remain 0 during play (BR-ENG-03)

  load(
    config: EngineConfig,
    sessionFactory: (config: EngineConfig) => GameSession
  ): void {
    const validation = validateContentPack(
      config.template_code,
      config.content_pack
    );
    if (!validation.success) {
      throw new Error(
        `CONTENT_PACK_INVALID: ${validation.error?.message || "Invalid content pack"}`
      );
    }

    this.slots = computeEngineSlots(config);

    this.config = config;
    this.audio.setEnabled(config.audio_enabled);
    this.scaffolding = new ScaffoldingSystem(config.age_band);

    if (this.activeSession) {
      this.activeSession.destroy();
    }

    this.activeSession = sessionFactory(config);
    if (
      "resolveSlots" in this.activeSession &&
      typeof (this.activeSession as { resolveSlots?: (band: AgeBand) => void })
        .resolveSlots === "function"
    ) {
      (
        this.activeSession as { resolveSlots: (band: AgeBand) => void }
      ).resolveSlots(config.age_band);
    }
    this.activeSession.setupEntities();
  }

  /**
   * Begin the game loop. Pass the canvas the session should draw on; without it
   * the engine still ticks and emits telemetry but never draws (headless tests).
   */
  start(canvas?: HTMLCanvasElement): void {
    if (!this.activeSession) {
      throw new Error("No active session loaded in engine");
    }
    if (canvas) {
      this.renderSystem.setupCanvas(canvas);
      this.ctx = canvas.getContext("2d") ?? undefined;
    }
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTimeMs = nowMs();
    this.emitEvent({ event_name: "game_started", timestamp_ms: Date.now() });

    this.loop();
  }

  private readonly loop = (): void => {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    const now = nowMs();
    const deltaMs = now - this.lastFrameTimeMs;
    this.lastFrameTimeMs = now;

    this.scaffolding?.tick();
    this.activeSession?.update?.(deltaMs);

    if (this.ctx) {
      this.renderSystem.clear(this.ctx);
      this.activeSession?.render?.(this.ctx, this.renderSystem, now);
    }

    if (typeof requestAnimationFrame !== "undefined") {
      this.rafId = requestAnimationFrame(this.loop);
    }
  };

  pause(reason = "user_paused"): void {
    if (this.isPaused) {
      return;
    }
    this.isPaused = true;
    this.cancelFrame();
    this.emitEvent({
      event_name: "game_paused",
      timestamp_ms: Date.now(),
      data: { reason },
    });
  }

  resume(): void {
    if (!this.isPaused) {
      return;
    }
    this.isPaused = false;
    this.lastFrameTimeMs = nowMs();
    this.loop();
  }

  checkWinCondition(): boolean {
    return this.activeSession?.checkWinCondition() ?? false;
  }

  handleAssetLoadError(assetRef: string): void {
    this.emitEvent({
      event_name: "asset_load_failed",
      timestamp_ms: Date.now(),
      data: { asset_ref: assetRef, fallback: "neutral_placeholder" },
    });
  }

  on(event: string, callback: EventCallback): void {
    let listeners = this.eventListeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this.eventListeners.set(event, listeners);
    }
    listeners.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  emitEvent(event: TelemetryEvent): void {
    for (const key of [event.event_name, "*"]) {
      const listeners = this.eventListeners.get(key);
      if (!listeners) {
        continue;
      }
      for (const cb of listeners) {
        cb(event);
      }
    }
  }

  getNetworkRequestCount(): number {
    return this.networkRequestCountDuringPlay;
  }

  destroy(): void {
    this.isRunning = false;
    this.isPaused = false;
    this.ctx = undefined;
    this.cancelFrame();
    if (this.activeSession) {
      this.activeSession.destroy();
      this.activeSession = undefined;
    }
    this.eventListeners.clear();
    this.interaction.clearSelection();
  }

  private cancelFrame(): void {
    if (this.rafId && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
  }
}
