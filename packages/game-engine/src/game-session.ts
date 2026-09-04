import type { AgeBand } from "./contracts/types";
import type { Slot } from "./layout/types";
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
  // biome-ignore lint/suspicious/noConfusingVoidType: void needed for compatibility with void-returning sessions
  update?(deltaMs: number): ActionResult | void | null;
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
  readonly themeId?: string;
  protected isWon = false;

  /** Backing store for slots — do NOT assign directly, use prepareRound. */
  private _slots: readonly Slot[] = [];

  /** Increases by 1 every prepareRound. Tests use this to assert slot recomputation count. */
  roundGeneration = 0;

  /** Read-only view of the current round's slots. */
  get slots(): readonly Slot[] {
    return this._slots;
  }

  constructor(
    content: TContent,
    difficulty: TDifficulty,
    layoutSeed = 0,
    themeId?: string
  ) {
    super();
    this.content = content;
    this.difficulty = difficulty;
    this.layoutSeed = Math.abs(Math.floor(layoutSeed)) || 0;
    this.themeId = themeId;
  }

  /**
   * Final — orchestrates a round: setup entities → compute slots → derived state.
   * Called by RoundRunner and GameEngine instead of raw setupEntities+resolveSlots.
   */
  prepareRound(band: AgeBand): void {
    this.setupEntities();
    this._slots = this.computeSlots(band);
    this.computeRoundDerived?.();
    this.roundGeneration++;
  }

  /**
   * Compute the layout slots for this round.
   *
   * SHIM: delegates to resolveSlots if the subclass still uses the old pattern.
   * Once all 37 templates migrate to computeSlots, this becomes abstract.
   */
  protected computeSlots(band: AgeBand): readonly Slot[] {
    // Shim: if subclass has resolveSlots, call it and read back slots.
    // Subclasses declare `slots: readonly Slot[] = []` as own property,
    // which shadows the prototype getter. resolveSlots writes to that
    // own property. We read it back after resolveSlots runs.
    const self = this as unknown as {
      resolveSlots?: (b: AgeBand) => void;
      slots?: readonly Slot[];
    };
    if (typeof self.resolveSlots === "function") {
      self.resolveSlots(band);
      // Read back the own-property slots that resolveSlots assigned
      const ownSlots = (self.slots ?? []) as readonly Slot[];
      return ownSlots;
    }
    // Subclass must override this method
    return [];
  }

  /**
   * Override to cache values derived from the round's entity/slot state.
   * Called after computeSlots inside prepareRound.
   */
  protected computeRoundDerived?(): void;

  /** Pure — safe to call every frame (BR-ENG-13). */
  checkWinCondition(): boolean {
    return this.isWon;
  }

  /** Close out a won round. Call AFTER recording the winning action's event. */
  protected winSession(): void {
    this.isWon = true;
    this.completeSession();
  }

  /**
   * Internal setter for slots — used by shim and resolveSlots migration path.
   * @internal
   */
  protected set _slotsInternal(value: readonly Slot[]) {
    this._slots = value;
  }
}
