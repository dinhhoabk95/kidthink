import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  computeSessionResult,
  computeStars,
  type TelemetryEventInput,
} from "#src/scoring";

describe("Task 6 — Scoring Property Tests (fast-check, >=500 runs)", () => {
  it("BR-SCO-03: adding hint_requested events NEVER decreases normalized_score", () => {
    // Arbitrary event sequence without hints
    const baseEventsArb = fc.array(
      fc.record({
        sessionUuid: fc.constant("s1"),
        seq: fc.integer({ min: 1, max: 100 }),
        eventName: fc.constantFrom(
          "round_started",
          "answer_selected",
          "answer_correct",
          "answer_incorrect",
          "round_completed"
        ),
        occurredAtMs: fc.integer({ min: 0, max: 100_000 }),
      }),
      { minLength: 1, maxLength: 30 }
    );

    fc.assert(
      fc.property(baseEventsArb, (baseEvents) => {
        const baseResult = computeSessionResult(baseEvents);

        // Add 1 to 5 hint_requested events
        const hints: TelemetryEventInput[] = Array.from(
          { length: 5 },
          (_, i) => ({
            sessionUuid: "s1",
            seq: 1000 + i,
            eventName: "hint_requested",
            occurredAtMs: 500,
          })
        );

        const eventsWithHints = [...baseEvents, ...hints];
        const withHintsResult = computeSessionResult(eventsWithHints);

        // Hint count increases
        expect(withHintsResult.metrics.hint_count).toBeGreaterThanOrEqual(
          baseResult.metrics.hint_count
        );
        // Normalized score DOES NOT DECREASE
        expect(withHintsResult.normalized_score).toBeGreaterThanOrEqual(
          baseResult.normalized_score - 1e-9
        );
      }),
      { numRuns: 500 }
    );
  });

  it("BR-SCO-06: changing occurredAtMs/timestamps NEVER changes stars", () => {
    const baseEventsArb = fc.array(
      fc.record({
        sessionUuid: fc.constant("s1"),
        seq: fc.integer({ min: 1, max: 50 }),
        eventName: fc.constantFrom(
          "round_started",
          "answer_selected",
          "answer_correct",
          "answer_incorrect",
          "round_completed"
        ),
        occurredAtMs: fc.integer({ min: 0, max: 1000 }),
      }),
      { minLength: 1, maxLength: 20 }
    );

    const speedMultiplierArb = fc.integer({ min: 2, max: 100 });

    fc.assert(
      fc.property(baseEventsArb, speedMultiplierArb, (events, multiplier) => {
        const resultOriginal = computeSessionResult(events);
        const starsOriginal = computeStars(
          resultOriginal.normalized_score,
          "completed"
        );

        // Scale timestamps by multiplier (simulate faster/slower completion)
        const modifiedEvents = events.map((ev) => ({
          ...ev,
          occurredAtMs: (ev.occurredAtMs ?? 0) * multiplier,
        }));

        const resultScaled = computeSessionResult(modifiedEvents);
        const starsScaled = computeStars(
          resultScaled.normalized_score,
          "completed"
        );

        expect(starsScaled).toBe(starsOriginal);
      }),
      { numRuns: 500 }
    );
  });

  it("BR-SCO-05: for all generated inputs, normalized_score is strictly in [0, 1]", () => {
    const arbitraryEvents = fc.array(
      fc.record({
        sessionUuid: fc.constant("s1"),
        seq: fc.integer({ min: 1, max: 200 }),
        eventName: fc.constantFrom(
          "game_started",
          "round_started",
          "answer_selected",
          "answer_correct",
          "answer_incorrect",
          "hint_requested",
          "scaffold_escalated",
          "round_retried",
          "round_completed",
          "game_completed",
          "session_paused",
          "session_resumed"
        ),
        occurredAtMs: fc.integer({ min: 0, max: 1_000_000 }),
      }),
      { minLength: 0, maxLength: 50 }
    );

    fc.assert(
      fc.property(arbitraryEvents, (events) => {
        const res = computeSessionResult(events);
        expect(res.normalized_score).toBeGreaterThanOrEqual(0);
        expect(res.normalized_score).toBeLessThanOrEqual(1);
        expect(Number.isNaN(res.normalized_score)).toBe(false);
      }),
      { numRuns: 500 }
    );
  });

  it("BR-SCO-04: two templates with identical accuracy & first_try_ratio have equal normalized_score", () => {
    const roundsTotalArb = fc.integer({ min: 1, max: 10 });
    const roundsCorrectArb = fc.integer({ min: 0, max: 10 });

    fc.assert(
      fc.property(roundsTotalArb, roundsCorrectArb, (total, correctRaw) => {
        const correct = Math.min(total, correctRaw);

        // Template A sequence
        const eventsA: TelemetryEventInput[] = [];
        for (let r = 1; r <= total; r++) {
          eventsA.push({
            sessionUuid: "sA",
            seq: r * 3 - 2,
            eventName: "round_started",
          });
          eventsA.push({
            sessionUuid: "sA",
            seq: r * 3 - 1,
            eventName: "answer_selected",
          });
          eventsA.push({
            sessionUuid: "sA",
            seq: r * 3,
            eventName: r <= correct ? "answer_correct" : "answer_incorrect",
          });
        }

        // Template B sequence (different template id/payload, same event count & correctness)
        const eventsB: TelemetryEventInput[] = eventsA.map((e) => ({
          ...e,
          sessionUuid: "sB",
          payload: { template_id: 99 },
        }));

        const resA = computeSessionResult(eventsA);
        const resB = computeSessionResult(eventsB);

        expect(resA.normalized_score).toBeCloseTo(resB.normalized_score);
      }),
      { numRuns: 500 }
    );
  });
});
