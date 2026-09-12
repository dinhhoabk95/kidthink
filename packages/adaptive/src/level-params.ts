import type { MasteryState } from "./bkt.js";

/** BR-CFO-04 & skill-thinking-structure §ZPD: Named constants for adaptive scaling */
export const LOW_MASTERY_FACTOR = 0.8;
export const HIGH_MASTERY_FACTOR = 1.2;
export const NEUTRAL_ADAPTIVE_FACTOR = 1.0;
export const DEFAULT_INITIAL_P_LEARN = 0.1;
export const MIN_ATTEMPTS_BEFORE_ADAPTIVE = 3;
export const LOW_MASTERY_THRESHOLD = 0.4;
export const HIGH_MASTERY_THRESHOLD = 0.8;
export const TIME_LIMIT_EASE_MULTIPLIER = 1.25;

export interface AdaptiveParamsResult {
  param_overrides: Record<string, unknown>;
  adaptive_factor: number;
}

function resolveLowMastery(base: Record<string, unknown>): {
  factor: number;
  overrides: Record<string, unknown>;
} {
  const overrides: Record<string, unknown> = {};
  if (typeof base.distractor_count === "number") {
    overrides.distractor_count = Math.max(1, base.distractor_count - 1);
  }
  if (typeof base.time_limit === "number") {
    overrides.time_limit = Math.round(
      base.time_limit * TIME_LIMIT_EASE_MULTIPLIER
    );
  }
  return { factor: LOW_MASTERY_FACTOR, overrides };
}

function resolveHighMastery(base: Record<string, unknown>): {
  factor: number;
  overrides: Record<string, unknown>;
} {
  const overrides: Record<string, unknown> = {};
  if (typeof base.distractor_count === "number") {
    overrides.distractor_count = base.distractor_count + 1;
  }
  return { factor: HIGH_MASTERY_FACTOR, overrides };
}

/**
 * Pure function to compute difficulty parameter overrides and adaptive scale factor.
 * NEVER mutates base configuration.
 */
export function computeAdaptiveParams(params: {
  base: Record<string, unknown>;
  mastery?: MasteryState | null;
  ageBand?: string;
}): AdaptiveParamsResult {
  const pLearn = params.mastery?.p_learn ?? DEFAULT_INITIAL_P_LEARN;
  const attempts = params.mastery?.attempts_total ?? 0;

  if (attempts < MIN_ATTEMPTS_BEFORE_ADAPTIVE) {
    return {
      param_overrides: {},
      adaptive_factor: NEUTRAL_ADAPTIVE_FACTOR,
    };
  }

  if (pLearn < LOW_MASTERY_THRESHOLD) {
    const low = resolveLowMastery(params.base);
    return {
      param_overrides: low.overrides,
      adaptive_factor: low.factor,
    };
  }

  if (pLearn >= HIGH_MASTERY_THRESHOLD) {
    const high = resolveHighMastery(params.base);
    return {
      param_overrides: high.overrides,
      adaptive_factor: high.factor,
    };
  }

  return {
    param_overrides: {},
    adaptive_factor: NEUTRAL_ADAPTIVE_FACTOR,
  };
}
