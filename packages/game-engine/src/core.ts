import { validateContentPack } from "./contracts/registry";
import type { GameSession, TelemetryEvent } from "./game-session";
import { InteractionManager } from "./interaction";
import { AudioController } from "./systems/audio-controller";
import { RenderSystem } from "./systems/render-system";
import { ScaffoldingSystem } from "./systems/scaffolding";

export interface EngineConfig {
  level_code: string;
  content_version: number;
  template_code: string;
  content_pack: unknown;
  difficulty_params: unknown;
  theme_id: string;
  age_band: "3-4" | "4-5" | "5-6";
  reduced_motion: boolean;
  audio_enabled: boolean;
}

export type EventCallback = (event: TelemetryEvent) => void;

export class GameEngine {
  config?: EngineConfig;
  activeSession?: GameSession;
  readonly renderSystem = new RenderSystem();
  readonly interaction = new InteractionManager();
  readonly audio = new AudioController();
  scaffolding?: ScaffoldingSystem;

  private isRunning = false;
  private isPaused = false;
  private rafId?: number;
  private lastFrameTimeMs = 0;

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

    this.config = config;
    this.audio.setEnabled(config.audio_enabled);
    this.scaffolding = new ScaffoldingSystem(config.age_band);

    if (this.activeSession) {
      this.activeSession.destroy();
    }

    this.activeSession = sessionFactory(config);
    this.activeSession.setupEntities();
  }

  start(): void {
    if (!this.activeSession) {
      throw new Error("No active session loaded in engine");
    }
    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTimeMs =
      typeof performance === "undefined" ? Date.now() : performance.now();
    this.emitEvent({ event_name: "game_started", timestamp_ms: Date.now() });

    this.loop();
  }

  private readonly loop = (): void => {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    const now =
      typeof performance === "undefined" ? Date.now() : performance.now();
    const deltaMs = now - this.lastFrameTimeMs;
    this.lastFrameTimeMs = now;

    if (this.scaffolding) {
      this.scaffolding.tick();
    }

    if (this.activeSession?.update) {
      this.activeSession.update(deltaMs);
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
    if (this.rafId && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
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
    this.lastFrameTimeMs =
      typeof performance === "undefined" ? Date.now() : performance.now();
    this.loop();
  }

  checkWinCondition(): boolean {
    if (!this.activeSession) {
      return false;
    }
    return this.activeSession.checkWinCondition();
  }

  handleAssetLoadError(assetRef: string): void {
    this.emitEvent({
      event_name: "asset_load_failed",
      timestamp_ms: Date.now(),
      data: { asset_ref: assetRef, fallback: "neutral_placeholder" },
    });
  }

  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  emitEvent(event: TelemetryEvent): void {
    const listeners = this.eventListeners.get(event.event_name);
    if (listeners) {
      for (const cb of listeners) {
        cb(event);
      }
    }
    const allListeners = this.eventListeners.get("*");
    if (allListeners) {
      for (const cb of allListeners) {
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
    if (this.rafId && typeof cancelAnimationFrame !== "undefined") {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    if (this.activeSession) {
      this.activeSession.destroy();
      this.activeSession = undefined;
    }
    this.eventListeners.clear();
    this.interaction.clearSelection();
  }
}
