/**
 * ScaffoldingSystem — Escalate hints automatically based on age-band timer or miss streak.
 * Implements BR-SCF-01..08 & spec SCAFFOLDING-AND-HINTS.
 */

export type ScaffoldingLevel = 0 | 1 | 2 | 3;
export type AgeBand = "3-4" | "4-5" | "5-6";

export interface ScaffoldState {
  level: ScaffoldingLevel;
  sinceMs: number;
  missStreak: number;
  focusIndex: number | null;
  roundIndex: number;
  l3DurationMs: number;
  skipSuggested: boolean;
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
  trigger: "timer" | "miss_streak";
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
        deltaMs ?? 16.6,
        state,
        ageBand ?? this.internalAgeBand,
        targetFocusIndex ?? 0,
        prefersReducedMotion ?? false
      );
    }
    return this.tickInternal(deltaMs ?? 16.6);
  }

  private tickInternal(deltaMs: number): ScaffoldingLevel {
    this.internalState.sinceMs += deltaMs;
    const config = SCAFFOLDING_BY_BAND[this.internalAgeBand];
    const { targetLevel } = computeTargetLevel(this.internalState, config);

    if (targetLevel === 3) {
      this.internalState.l3DurationMs += deltaMs;
    }
    if (
      this.internalState.l3DurationMs >= 60_000 &&
      !this.internalState.skipSuggested
    ) {
      this.internalState.skipSuggested = true;
    }

    this.internalState.level = targetLevel;
    return this.internalState.level;
  }

  private tickStateless(
    deltaMs: number,
    state: ScaffoldState,
    ageBand: AgeBand,
    targetFocusIndex: number,
    prefersReducedMotion: boolean
  ): ScaffoldAction | null {
    state.sinceMs += deltaMs;
    const config = SCAFFOLDING_BY_BAND[ageBand];
    const { targetLevel, triggerType } = computeTargetLevel(state, config);

    if (targetLevel === 3) {
      state.l3DurationMs += deltaMs;
    }

    let roundSkippedSuggested = false;
    if (state.l3DurationMs >= 60_000 && !state.skipSuggested) {
      state.skipSuggested = true;
      roundSkippedSuggested = true;
    }

    state.focusIndex = targetFocusIndex;
    const levelChanged = targetLevel !== state.level;
    state.level = targetLevel;

    if (levelChanged || roundSkippedSuggested) {
      let ghostHandSpeed: number | undefined;
      if (state.level === 3) {
        ghostHandSpeed = 0.5;
      } else if (state.level === 2) {
        ghostHandSpeed = 1.0;
      }

      return {
        level: state.level,
        trigger: triggerType,
        focusIndex: targetFocusIndex,
        ghostHandSpeed,
        reducedMotion: prefersReducedMotion,
        roundSkippedSuggested,
      };
    }

    return null;
  }

  recordMiss(): ScaffoldingLevel {
    this.internalState.missStreak += 1;
    this.tick(16.6);
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
