/**
 * Round event validation gate — anti-regression (WP100.7).
 *
 * Ensures that when scoring.mode is 'rounds', the telemetry stream
 * contains proper round_started events. Rejects incomplete streams.
 *
 * Spec sở hữu: round-sequence-play.md §8
 * Rules: BR-RSP-02 (round events always fire), BR-RSP-12 (server ignores client rounds_correct)
 */

export interface RoundEventGateInput {
  scoring_mode: "rounds" | "attempts";
  rounds_total: number;
  events: Array<{ event_name: string; data?: Record<string, unknown> }>;
  client_rounds_correct?: number;
}

export interface RoundEventGateResult {
  ok: boolean;
  violations: string[];
  computed_rounds_correct: number;
}

export function validateRoundEvents(
  input: RoundEventGateInput
): RoundEventGateResult {
  const violations: string[] = [];
  let computedRoundsCorrect = 0;

  if (input.scoring_mode === "rounds") {
    const roundStarted = input.events.filter(
      (e) => e.event_name === "round_started"
    );
    const roundCompleted = input.events.filter(
      (e) => e.event_name === "round_completed"
    );
    const roundSkipped = input.events.filter(
      (e) => e.event_name === "round_skipped"
    );

    if (roundStarted.length === 0) {
      violations.push("MISSING_ROUND_STARTED");
    }

    const finishedCount = roundCompleted.length + roundSkipped.length;
    if (roundStarted.length > 0 && finishedCount < roundStarted.length) {
      violations.push("INCOMPLETE_ROUND_SEQUENCE");
    }

    computedRoundsCorrect = roundCompleted.length;
  } else {
    const correctEvents = input.events.filter(
      (e) => e.event_name === "answer_correct"
    );
    computedRoundsCorrect = correctEvents.length;
  }

  return {
    ok: violations.length === 0,
    violations,
    computed_rounds_correct: computedRoundsCorrect,
  };
}
