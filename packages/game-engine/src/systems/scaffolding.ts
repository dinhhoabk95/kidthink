/**
 * ScaffoldingSystem — Escalate hints automatically based on age-band timer or miss streak.
 * Implements BR-SCF-01..08, BR-ENG-10, BR-A11-11 & spec SCAFFOLDING-AND-HINTS.
 *
 * Never on request — a 3 year old will not ask for help (spec §7.3).
 */

import type { AgeBand } from "#src/contracts/types";

export type { AgeBand } from "#src/contracts/types";

export type ScaffoldingLevel = 0 | 1 | 2 | 3;

/** Assumed frame budget when a caller ticks without supplying a delta (~60fps). */
const DEFAULT_FRAME_MS = 16.6;
/** Time stuck at L3 before offering to skip the round. */
const SKIP_SUGGEST_AFTER_MS = 60_000;

/** Ghost hand playback rate per level — slower at L3 so it reads as a demo. */
const GHOST_HAND_SPEED: Partial<Record<ScaffoldingLevel, number>> = {
  2: 1.0,
  3: 0.5,
};

export interface ScaffoldState {
  level: ScaffoldingLevel;
  sinceMs: number;
  missStreak: number;
  focusIndex: number | null;
  roundIndex: number;
  l3DurationMs: number;
  skipSuggested: boolean;
  voiceAvailable?: boolean;
}

export interface ScaffoldingBandThresholds {
  l1_misses: number;
  l1_time_s: number;
  l2_misses: number;
  l2_time_s: number;
  l3_misses: number;
  l3_time_s: number;
}

export interface ScaffoldAction {
  level: ScaffoldingLevel;
  trigger: "timer" | "miss_streak" | "voice_fallback" | "manual";
  focusIndex: number;
  ghostHandSpeed?: number;
  reducedMotion?: boolean;
  roundSkippedSuggested?: boolean;
}

export const SCAFFOLDING_BY_BAND: Record<AgeBand, ScaffoldingBandThresholds> = {
  "3-4": {
    l1_misses: 1,
    l1_time_s: 10,
    l2_misses: 2,
    l2_time_s: 18,
    l3_misses: 3,
    l3_time_s: 25,
  },
  "4-5": {
    l1_misses: 2,
    l1_time_s: 15,
    l2_misses: 3,
    l2_time_s: 25,
    l3_misses: 4,
    l3_time_s: 35,
  },
  "5-6": {
    l1_misses: 2,
    l1_time_s: 20,
    l2_misses: 3,
    l2_time_s: 30,
    l3_misses: 5,
    l3_time_s: 40,
  },
};

function computeTargetLevel(
  state: ScaffoldState,
  config: ScaffoldingBandThresholds
): { targetLevel: ScaffoldingLevel; triggerType: "timer" | "miss_streak" } {
  const elapsedSeconds = state.sinceMs / 1000;

  if (state.missStreak >= config.l3_misses) {
    return { targetLevel: 3, triggerType: "miss_streak" };
  }
  if (elapsedSeconds >= config.l3_time_s) {
    return { targetLevel: 3, triggerType: "timer" };
  }
  if (state.missStreak >= config.l2_misses) {
    return { targetLevel: 2, triggerType: "miss_streak" };
  }
  if (elapsedSeconds >= config.l2_time_s) {
    return { targetLevel: 2, triggerType: "timer" };
  }
  if (state.missStreak >= config.l1_misses) {
    return { targetLevel: 1, triggerType: "miss_streak" };
  }
  if (elapsedSeconds >= config.l1_time_s) {
    return { targetLevel: 1, triggerType: "timer" };
  }

  return { targetLevel: 0, triggerType: "timer" };
}

/** Advance timers and settle `state` on the level it has escalated to. */
function advanceState(
  state: ScaffoldState,
  config: ScaffoldingBandThresholds,
  deltaMs: number
) {
  state.sinceMs += deltaMs;
  const { targetLevel, triggerType } = computeTargetLevel(state, config);

  if (targetLevel === 3) {
    state.l3DurationMs += deltaMs;
  }

  let skipJustSuggested = false;
  if (state.l3DurationMs >= SKIP_SUGGEST_AFTER_MS && !state.skipSuggested) {
    state.skipSuggested = true;
    skipJustSuggested = true;
  }

  const levelChanged = targetLevel !== state.level;
  state.level = targetLevel;

  return { triggerType, levelChanged, skipJustSuggested };
}

export class ScaffoldingSystem {
  private readonly internalAgeBand: AgeBand;
  private readonly internalState: ScaffoldState;

  constructor(ageBand: AgeBand = "3-4") {
    this.internalAgeBand = ageBand;
    this.internalState = this.createInitialState();
  }

  createInitialState(): ScaffoldState {
    return {
      level: 0,
      sinceMs: 0,
      missStreak: 0,
      focusIndex: null,
      roundIndex: 0,
      l3DurationMs: 0,
      skipSuggested: false,
      voiceAvailable: true,
    };
  }

  /**
   * Immediate visual fallback when speech is unavailable (BR-ENG-10, BR-A11-11).
   * Promotes scaffolding to Level 2 (ghost hand demonstration) directly.
   */
  triggerVisualFallback(
    targetFocusIndex = 0,
    state?: ScaffoldState,
    prefersReducedMotion = false
  ): ScaffoldAction {
    const targetState = state || this.internalState;
    targetState.level = 2;
    targetState.focusIndex = targetFocusIndex;

    return {
      level: 2,
      trigger: "voice_fallback",
      focusIndex: targetFocusIndex,
      ghostHandSpeed: GHOST_HAND_SPEED[2],
      reducedMotion: prefersReducedMotion,
    };
  }

  /** Internal stateful tick — advances internal state, returns current level. */
  tick(deltaMs?: number): ScaffoldingLevel;
  /** Stateless tick — advances provided state, returns action on change. */
  tick(
    deltaMs: number,
    state: ScaffoldState,
    ageBand: AgeBand,
    targetFocusIndex: number,
    prefersReducedMotion?: boolean
  ): ScaffoldAction | null;
  tick(
    deltaMs?: number,
    state?: ScaffoldState,
    ageBand?: AgeBand,
    targetFocusIndex?: number,
    prefersReducedMotion?: boolean
  ): ScaffoldAction | ScaffoldingLevel | null {
    if (state !== undefined) {
      return this.tickStateless(
        deltaMs ?? DEFAULT_FRAME_MS,
        state,
        ageBand ?? this.internalAgeBand,
        targetFocusIndex ?? 0,
        prefersReducedMotion ?? false
      );
    }
    return this.tickInternal(deltaMs ?? DEFAULT_FRAME_MS);
  }

  private tickInternal(deltaMs: number): ScaffoldingLevel {
    advanceState(
      this.internalState,
      SCAFFOLDING_BY_BAND[this.internalAgeBand],
      deltaMs
    );
    return this.internalState.level;
  }

  private tickStateless(
    deltaMs: number,
    state: ScaffoldState,
    ageBand: AgeBand,
    targetFocusIndex: number,
    prefersReducedMotion: boolean
  ): ScaffoldAction | null {
    const { triggerType, levelChanged, skipJustSuggested } = advanceState(
      state,
      SCAFFOLDING_BY_BAND[ageBand],
      deltaMs
    );
    state.focusIndex = targetFocusIndex;

    if (!(levelChanged || skipJustSuggested)) {
      return null;
    }

    return {
      level: state.level,
      trigger: triggerType,
      focusIndex: targetFocusIndex,
      ghostHandSpeed: GHOST_HAND_SPEED[state.level],
      reducedMotion: prefersReducedMotion,
      roundSkippedSuggested: skipJustSuggested,
    };
  }

  recordMiss(): ScaffoldingLevel {
    this.internalState.missStreak += 1;
    this.tick(DEFAULT_FRAME_MS);
    return this.internalState.level;
  }

  onMiss(state?: ScaffoldState): void {
    const target = state || this.internalState;
    target.missStreak += 1;
  }

  resetOnSuccess(): void {
    this.onSuccess(this.internalState);
  }

  onSuccess(state?: ScaffoldState): void {
    const target = state || this.internalState;
    target.level = 0;
    target.sinceMs = 0;
    target.missStreak = 0;
    target.focusIndex = null;
    target.l3DurationMs = 0;
    target.skipSuggested = false;
  }

  getCurrentLevel(): ScaffoldingLevel {
    return this.internalState.level;
  }
}
