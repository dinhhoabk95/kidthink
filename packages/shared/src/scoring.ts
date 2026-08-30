export const SCORING_WEIGHTS = {
  FIRST_TRY: 0.6,
  ACCURACY: 0.4,
} as const;

export const STAR_THRESHOLDS = {
  STAR_3: 0.85,
  STAR_2: 0.55,
} as const;

export interface TelemetryEventInput {
  sessionUuid: string;
  seq: number;
  eventName: string;
  occurredAtMs?: number | null;
  payload?: Record<string, unknown> | null;
  clientTimestamp?: Date | string | null;
}

export interface ReconstructedSessionMetrics {
  rounds_total: number;
  rounds_correct: number;
  attempt_count: number;
  correct_count: number;
  incorrect_count: number;
  hint_count: number;
  retry_count: number;
  duration_ms: number;
}

export interface SessionResult {
  raw_score: number;
  normalized_score: number;
  first_try_ratio: number;
  accuracy: number;
  metrics: ReconstructedSessionMetrics;
}

export interface KidSurfaceResponse {
  stars: number | null;
  rounds_correct: number;
  rounds_total: number;
  celebration: string;
  next_suggestion: null;
}

interface RoundState {
  roundIndex: number;
  hasEnded: boolean;
  attempts: Array<{ type: "correct" | "incorrect"; seq: number }>;
}

export function clamp01(value: number): number {
  if (Number.isNaN(value) || value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function getEventTimeMs(ev: TelemetryEventInput): number | null {
  if (ev.occurredAtMs !== undefined && ev.occurredAtMs !== null) {
    return ev.occurredAtMs;
  }
  if (ev.clientTimestamp) {
    return new Date(ev.clientTimestamp).getTime();
  }
  return null;
}

function trackPauseIntervals(
  ev: TelemetryEventInput,
  timeMs: number,
  pauseState: { pauseStartTime: number | null; totalPausedMs: number }
) {
  if (ev.eventName === "session_paused" && pauseState.pauseStartTime === null) {
    pauseState.pauseStartTime = timeMs;
  } else if (
    ev.eventName === "session_resumed" &&
    pauseState.pauseStartTime !== null
  ) {
    pauseState.totalPausedMs += Math.max(0, timeMs - pauseState.pauseStartTime);
    pauseState.pauseStartTime = null;
  }
}

function updateSessionBounds(
  timeMs: number,
  bounds: { start: number | null; end: number | null }
) {
  if (bounds.start === null || timeMs < bounds.start) {
    bounds.start = timeMs;
  }
  if (bounds.end === null || timeMs > bounds.end) {
    bounds.end = timeMs;
  }
}

function calculateSessionDuration(sortedEvents: TelemetryEventInput[]): number {
  const bounds = { start: null as number | null, end: null as number | null };
  const pauseState = {
    pauseStartTime: null as number | null,
    totalPausedMs: 0,
  };

  for (const ev of sortedEvents) {
    const timeMs = getEventTimeMs(ev);
    if (timeMs === null) {
      continue;
    }
    updateSessionBounds(timeMs, bounds);
    trackPauseIntervals(ev, timeMs, pauseState);
  }

  if (
    pauseState.pauseStartTime !== null &&
    bounds.end !== null &&
    bounds.end > pauseState.pauseStartTime
  ) {
    pauseState.totalPausedMs += bounds.end - pauseState.pauseStartTime;
  }

  if (
    bounds.start !== null &&
    bounds.end !== null &&
    bounds.end >= bounds.start
  ) {
    return Math.max(0, bounds.end - bounds.start - pauseState.totalPausedMs);
  }

  return 0;
}

function processRoundEvent(
  ev: TelemetryEventInput,
  state: {
    rounds: RoundState[];
    currentRound: RoundState | null;
    rounds_total: number;
    attempt_count: number;
    correct_count: number;
    incorrect_count: number;
    hint_count: number;
    retry_count: number;
  }
) {
  const name = ev.eventName;

  if (name === "hint_requested" || name === "scaffold_escalated") {
    state.hint_count++;
  } else if (name === "round_retried") {
    state.retry_count++;
  }

  if (name === "round_started") {
    state.rounds_total++;
    state.currentRound = {
      roundIndex: state.rounds_total,
      hasEnded: false,
      attempts: [],
    };
    state.rounds.push(state.currentRound);
  } else if (name === "answer_selected") {
    state.attempt_count++;
  } else if (name === "answer_correct") {
    state.correct_count++;
    if (state.currentRound) {
      state.currentRound.attempts.push({ type: "correct", seq: ev.seq });
    }
  } else if (name === "answer_incorrect") {
    state.incorrect_count++;
    if (state.currentRound) {
      state.currentRound.attempts.push({ type: "incorrect", seq: ev.seq });
    }
  } else if (name === "round_completed" && state.currentRound) {
    state.currentRound.hasEnded = true;
  }
}

function evaluateRoundsCorrect(rounds: RoundState[]): number {
  let correctCount = 0;
  for (const round of rounds) {
    if (!round.hasEnded && round.attempts.length > 0) {
      console.warn(
        `[reconstructRounds] Round ${round.roundIndex} missing round_completed, inferring from last attempt`
      );
      round.hasEnded = true;
    }

    if (round.attempts.length > 0) {
      round.attempts.sort((a, b) => a.seq - b.seq);
      if (round.attempts[0]?.type === "correct") {
        correctCount++;
      }
    }
  }
  return correctCount;
}

export function reconstructRounds(
  events: TelemetryEventInput[]
): ReconstructedSessionMetrics {
  if (!events || events.length === 0) {
    return {
      rounds_total: 0,
      rounds_correct: 0,
      attempt_count: 0,
      correct_count: 0,
      incorrect_count: 0,
      hint_count: 0,
      retry_count: 0,
      duration_ms: 0,
    };
  }

  const sorted = [...events].sort((a, b) => a.seq - b.seq);
  const duration_ms = calculateSessionDuration(sorted);

  const state = {
    rounds: [] as RoundState[],
    currentRound: null as RoundState | null,
    rounds_total: 0,
    attempt_count: 0,
    correct_count: 0,
    incorrect_count: 0,
    hint_count: 0,
    retry_count: 0,
  };

  for (const ev of sorted) {
    processRoundEvent(ev, state);
  }

  const rounds_correct = evaluateRoundsCorrect(state.rounds);

  return {
    rounds_total: state.rounds_total,
    rounds_correct,
    attempt_count: state.attempt_count,
    correct_count: state.correct_count,
    incorrect_count: state.incorrect_count,
    hint_count: state.hint_count,
    retry_count: state.retry_count,
    duration_ms,
  };
}

export function computeSessionResult(
  events: TelemetryEventInput[]
): SessionResult {
  const metrics = reconstructRounds(events);

  let first_try_ratio: number;
  if (metrics.rounds_total > 0) {
    first_try_ratio = metrics.rounds_correct / metrics.rounds_total;
  } else if (metrics.attempt_count > 0) {
    first_try_ratio = metrics.correct_count / metrics.attempt_count;
  } else {
    first_try_ratio = 0;
  }

  const accuracy =
    metrics.attempt_count > 0
      ? metrics.correct_count / metrics.attempt_count
      : 0;

  const raw_score = metrics.rounds_correct;

  const calculatedScore =
    SCORING_WEIGHTS.FIRST_TRY * first_try_ratio +
    SCORING_WEIGHTS.ACCURACY * accuracy;

  const normalized_score = clamp01(calculatedScore);

  return {
    raw_score,
    normalized_score,
    first_try_ratio,
    accuracy,
    metrics,
  };
}

export function computeStars(
  normalized_score: number,
  completionStatus: string
): number | null {
  if (completionStatus !== "completed") {
    return null;
  }

  if (normalized_score >= STAR_THRESHOLDS.STAR_3) {
    return 3;
  }
  if (normalized_score >= STAR_THRESHOLDS.STAR_2) {
    return 2;
  }
  return 1;
}

export function getCelebrationCode(normalized_score: number): string {
  if (normalized_score >= STAR_THRESHOLDS.STAR_3) {
    return "great";
  }
  if (normalized_score >= STAR_THRESHOLDS.STAR_2) {
    return "good";
  }
  return "nice_try";
}

export function formatKidSurfaceResponse(result: {
  normalized_score: number;
  completionStatus: string;
  metrics: ReconstructedSessionMetrics;
}): KidSurfaceResponse {
  return {
    stars: computeStars(result.normalized_score, result.completionStatus),
    rounds_correct: result.metrics.rounds_correct,
    rounds_total: result.metrics.rounds_total,
    celebration: getCelebrationCode(result.normalized_score),
    next_suggestion: null,
  };
}

export function masteryGuard(params: {
  childProfileId?: number | null;
  isPreview?: boolean;
  completionStatus?: string;
  hasSkills?: boolean;
}): boolean {
  if (!params.childProfileId) {
    return false;
  }
  if (params.isPreview === true) {
    return false;
  }
  if (params.completionStatus !== "completed") {
    return false;
  }
  if (params.hasSkills !== true) {
    return false;
  }
  return true;
}
