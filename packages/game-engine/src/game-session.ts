import type { RenderSystem } from "./systems/render-system";

export type FeedbackKind =
  | "none"
  | "amber_soft"
  | "pop_celebrate"
  | "level_celebrate";

/** A player interaction handed to `validateAction`. */
export interface GameAction {
  type: string;
  data: unknown;
}

/** Verdict of `validateAction` — pure, no side effects (BR-ENG-13). */
export interface ActionResult {
  valid: boolean;
  feedback: FeedbackKind;
}

/** Action the session does not handle — no feedback owed. */
export const ACTION_IGNORED: ActionResult = Object.freeze({
  valid: false,
  feedback: "none",
});

/** Correct answer — small pop at the touch point (BR-ENG-08). */
export const ACTION_CORRECT: ActionResult = Object.freeze({
  valid: true,
  feedback: "pop_celebrate",
});

/** Wrong answer — amber nudge, never punitive, never silent (BR-ENG-07). */
export const ACTION_RETRY: ActionResult = Object.freeze({
  valid: false,
  feedback: "amber_soft",
});

export interface TelemetryEvent {
  event_name: string;
  timestamp_ms: number;
  data?: Record<string, unknown>;
}

export interface SessionTelemetry {
  events: TelemetryEvent[];
  start_time_ms: number;
  end_time_ms?: number;
}

export interface GameSession {
  setupEntities(): void;
  validateAction(a: GameAction): ActionResult;
  checkWinCondition(): boolean;
  /** Called every frame by `GameEngine.loop()` only when a canvas is attached. */
  render?(
    ctx: CanvasRenderingContext2D,
    rs: RenderSystem,
    timeMs: number
  ): void;
  update?(deltaMs: number): void;
  getTelemetry(): SessionTelemetry;
  completeSession(): void;
  destroy(): void;
}

export abstract class BaseGameSession implements GameSession {
  protected events: TelemetryEvent[] = [];
  protected startTimeMs: number = Date.now();
  protected endTimeMs?: number;
  protected isCompleted = false;

  abstract setupEntities(): void;
  abstract validateAction(a: GameAction): ActionResult;
  abstract checkWinCondition(): boolean;

  recordEvent(eventName: string, data?: Record<string, unknown>): void {
    this.events.push({
      event_name: eventName,
      timestamp_ms: Date.now(),
      data,
    });
  }

  getTelemetry(): SessionTelemetry {
    return {
      events: [...this.events],
      start_time_ms: this.startTimeMs,
      end_time_ms: this.endTimeMs,
    };
  }

  completeSession(): void {
    if (this.isCompleted) {
      return;
    }
    this.isCompleted = true;
    this.endTimeMs = Date.now();
    this.recordEvent("game_completed");
  }

  destroy(): void {
    this.events = [];
  }
}

/**
 * Base for the GT-001..GT-006 template sessions: each one is built from a
 * validated `content_pack` plus its `difficulty_params`, and wins exactly once.
 */
export abstract class TemplateGameSession<
  TContent,
  TDifficulty,
> extends BaseGameSession {
  readonly content: TContent;
  readonly difficulty: TDifficulty;
  readonly layoutSeed: number;
  protected isWon = false;

  constructor(content: TContent, difficulty: TDifficulty, layoutSeed = 0) {
    super();
    this.content = content;
    this.difficulty = difficulty;
    this.layoutSeed = Math.abs(Math.floor(layoutSeed)) || 0;
  }

  /** Pure — safe to call every frame (BR-ENG-13). */
  checkWinCondition(): boolean {
    return this.isWon;
  }

  /** Close out a won round. Call AFTER recording the winning action's event. */
  protected winSession(): void {
    this.isWon = true;
    this.completeSession();
  }
}
