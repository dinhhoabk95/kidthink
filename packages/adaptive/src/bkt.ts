export const BKT_CONFIG = {
  ALPHA: 0.2,
  BETA: 0.3,
  PARAMS_VERSION: "v1",
} as const;

export interface MasteryState {
  child_id: number;
  skill_id: number;
  p_learn: number;
  attempts_total: number;
  ema_correct: number;
  hint_rate: number;
  best_p_learn: number;
  last_seen_at: Date;
  params_version: string;
}

export interface MasteryUpdate {
  p_learn: number;
  ema_correct: number;
  hint_rate: number;
  attempts_total: number;
  best_p_learn: number;
  last_seen_at: Date;
  params_version: string;
}

export interface SessionResultInput {
  correct_ratio: number;
  hint_rate?: number;
  hints_used?: number;
  rounds_total?: number;
  rounds_correct?: number;
}

export function clamp01(val: number): number {
  if (Number.isNaN(val) || val < 0) {
    return 0;
  }
  if (val > 1) {
    return 1;
  }
  return val;
}

function resolveSessionHintRate(result: SessionResultInput): number {
  if (result.hint_rate !== undefined) {
    return clamp01(result.hint_rate);
  }
  const rounds = result.rounds_total ?? 0;
  if (rounds > 0) {
    return clamp01((result.hints_used ?? 0) / rounds);
  }
  return 0.0;
}

/**
 * BR-ADP-01, BR-ADP-02, BR-ADP-03, BR-ADP-04, BR-ADP-10
 * Pure function to calculate BKT mastery update.
 */
export function computeUpdate(params: {
  prev: MasteryState | null;
  result: SessionResultInput;
  weight?: number;
  now: Date;
}): MasteryUpdate {
  const weight = params.weight === undefined ? 1.0 : clamp01(params.weight);
  const prevPLearn = params.prev?.p_learn ?? 0.1;
  const prevEma = params.prev?.ema_correct ?? 0.5;
  const prevHintRate = params.prev?.hint_rate ?? 0.0;
  const prevAttempts = params.prev?.attempts_total ?? 0;
  const prevBestPLearn = params.prev?.best_p_learn ?? prevPLearn;

  const correctRatio = clamp01(params.result.correct_ratio);
  const sessionHintRate = resolveSessionHintRate(params.result);

  // BKT simplified update formula: clamp01(p_learn + alpha * weight * (correct_ratio - p_learn))
  const pLearnPrime = clamp01(
    prevPLearn + BKT_CONFIG.ALPHA * weight * (correctRatio - prevPLearn)
  );

  const emaPrime = clamp01(
    BKT_CONFIG.BETA * correctRatio + (1 - BKT_CONFIG.BETA) * prevEma
  );

  const hintRatePrime = clamp01(
    BKT_CONFIG.BETA * sessionHintRate + (1 - BKT_CONFIG.BETA) * prevHintRate
  );

  const attemptsPrime = prevAttempts + 1;
  const bestPLearnPrime = clamp01(Math.max(prevBestPLearn, pLearnPrime));

  return {
    p_learn: Number(pLearnPrime.toFixed(4)),
    ema_correct: Number(emaPrime.toFixed(4)),
    hint_rate: Number(hintRatePrime.toFixed(4)),
    attempts_total: attemptsPrime,
    best_p_learn: Number(bestPLearnPrime.toFixed(4)),
    last_seen_at: params.now,
    params_version: BKT_CONFIG.PARAMS_VERSION,
  };
}
