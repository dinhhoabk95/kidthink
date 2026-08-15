import type { MasteryState } from "./bkt.js";

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
    overrides.time_limit = Math.round(base.time_limit * 1.25);
  }
  return { factor: 0.8, overrides };
}

function resolveHighMastery(base: Record<string, unknown>): {
  factor: number;
  overrides: Record<string, unknown>;
} {
  const overrides: Record<string, unknown> = {};
  if (typeof base.distractor_count === "number") {
    overrides.distractor_count = base.distractor_count + 1;
  }
  return { factor: 1.2, overrides };
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
  const pLearn = params.mastery?.p_learn ?? 0.1;
  const attempts = params.mastery?.attempts_total ?? 0;

  if (attempts < 3) {
    return {
      param_overrides: {},
      adaptive_factor: 1.0,
    };
  }

  if (pLearn < 0.4) {
    const low = resolveLowMastery(params.base);
    return {
      param_overrides: low.overrides,
      adaptive_factor: low.factor,
    };
  }

  if (pLearn >= 0.8) {
    const high = resolveHighMastery(params.base);
    return {
      param_overrides: high.overrides,
      adaptive_factor: high.factor,
    };
  }

  return {
    param_overrides: {},
    adaptive_factor: 1.0,
  };
}
