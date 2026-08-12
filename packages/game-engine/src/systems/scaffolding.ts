/**
 * ScaffoldingSystem — Escalate hints automatically based on age-band timer or miss streak.
 * Implements BR-SCF-01..08 & spec SCAFFOLDING-AND-HINTS.
 * Supports both internal stateful instance methods and stateless functional ScaffoldState.
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
  ghostHandSpeed?: number; // 1.0 for L2, 0.5 for L3
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

interface TickContext {
  deltaMs: number;
  state: ScaffoldState;
  ageBand: AgeBand;
  targetFocusIndex: number;
  prefersReducedMotion: boolean;
  isInternalCall: boolean;
}

function resolveTickContext(
  defaultState: ScaffoldState,
  defaultAgeBand: AgeBand,
  arg1?: number | ScaffoldState,
  arg2?: ScaffoldState | AgeBand,
  arg3?: AgeBand | number,
  arg4?: number,
  arg5?: boolean
): TickContext {
  if (typeof arg1 === "number" && typeof arg2 === "object" && arg2 !== null) {
    return {
      deltaMs: arg1,
      state: arg2,
      ageBand: typeof arg3 === "string" ? arg3 : defaultAgeBand,
      targetFocusIndex: typeof arg4 === "number" ? arg4 : 0,
      prefersReducedMotion: Boolean(arg5),
      isInternalCall: false,
    };
  }

  if (typeof arg1 === "object" && arg1 !== null) {
    return {
      deltaMs: 16.6,
      state: arg1,
      ageBand: typeof arg2 === "string" ? arg2 : defaultAgeBand,
      targetFocusIndex: typeof arg3 === "number" ? arg3 : 0,
      prefersReducedMotion: Boolean(arg4),
      isInternalCall: false,
    };
  }

  return {
    deltaMs: typeof arg1 === "number" ? arg1 : 16.6,
    state: defaultState,
    ageBand: defaultAgeBand,
    targetFocusIndex: 0,
    prefersReducedMotion: false,
    isInternalCall: true,
  };
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

  tick(
    arg1?: number | ScaffoldState,
    arg2?: ScaffoldState | AgeBand,
    arg3?: AgeBand | number,
    arg4?: number,
    arg5?: boolean
  ): ScaffoldAction | ScaffoldingLevel | null {
    const ctx = resolveTickContext(
      this.internalState,
      this.internalAgeBand,
      arg1,
      arg2,
      arg3,
      arg4,
      arg5
    );

    ctx.state.sinceMs += ctx.deltaMs;
    const config = SCAFFOLDING_BY_BAND[ctx.ageBand];
    const { targetLevel, triggerType } = computeTargetLevel(ctx.state, config);

    if (targetLevel === 3) {
      ctx.state.l3DurationMs += ctx.deltaMs;
    }

    let roundSkippedSuggested = false;
    if (ctx.state.l3DurationMs >= 60_000 && !ctx.state.skipSuggested) {
      ctx.state.skipSuggested = true;
      roundSkippedSuggested = true;
    }

    ctx.state.focusIndex = ctx.targetFocusIndex;
    const levelChanged = targetLevel !== ctx.state.level;
    ctx.state.level = targetLevel;

    if (ctx.isInternalCall) {
      return ctx.state.level;
    }

    if (levelChanged || roundSkippedSuggested) {
      let ghostHandSpeed: number | undefined;
      if (ctx.state.level === 3) {
        ghostHandSpeed = 0.5;
      } else if (ctx.state.level === 2) {
        ghostHandSpeed = 1.0;
      }

      return {
        level: ctx.state.level,
        trigger: triggerType,
        focusIndex: ctx.targetFocusIndex,
        ghostHandSpeed,
        reducedMotion: ctx.prefersReducedMotion,
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
