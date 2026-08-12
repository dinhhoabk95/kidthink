import { describe, expect, it } from "vitest";
import {
  computeSessionResult,
  computeStars,
  formatKidSurfaceResponse,
  getCelebrationCode,
  masteryGuard,
  reconstructRounds,
  SCORING_WEIGHTS,
  type TelemetryEventInput,
} from "../src/scoring.js";

describe("Task P1.7 — Scoring and Result Engine", () => {
  describe("Task 1 — Round Reconstruction & Anomaly Resolution", () => {
    it("reconstructs 7 metrics correctly for a clean sequence of events", () => {
      const events: TelemetryEventInput[] = [
        {
          sessionUuid: "s1",
          seq: 1,
          eventName: "game_started",
          occurredAtMs: 0,
        },
        {
          sessionUuid: "s1",
          seq: 2,
          eventName: "round_started",
          occurredAtMs: 100,
        },
        {
          sessionUuid: "s1",
          seq: 3,
          eventName: "answer_selected",
          occurredAtMs: 200,
        },
        {
          sessionUuid: "s1",
          seq: 4,
          eventName: "answer_correct",
          occurredAtMs: 300,
        },
        {
          sessionUuid: "s1",
          seq: 5,
          eventName: "round_completed",
          occurredAtMs: 400,
        },
        {
          sessionUuid: "s1",
          seq: 6,
          eventName: "round_started",
          occurredAtMs: 500,
        },
        {
          sessionUuid: "s1",
          seq: 7,
          eventName: "hint_requested",
          occurredAtMs: 600,
        },
        {
          sessionUuid: "s1",
          seq: 8,
          eventName: "answer_selected",
          occurredAtMs: 700,
        },
        {
          sessionUuid: "s1",
          seq: 9,
          eventName: "answer_incorrect",
          occurredAtMs: 800,
        },
        {
          sessionUuid: "s1",
          seq: 10,
          eventName: "round_retried",
          occurredAtMs: 900,
        },
        {
          sessionUuid: "s1",
          seq: 11,
          eventName: "answer_selected",
          occurredAtMs: 1000,
        },
        {
          sessionUuid: "s1",
          seq: 12,
          eventName: "answer_correct",
          occurredAtMs: 1100,
        },
        {
          sessionUuid: "s1",
          seq: 13,
          eventName: "round_completed",
          occurredAtMs: 1200,
        },
        {
          sessionUuid: "s1",
          seq: 14,
          eventName: "game_completed",
          occurredAtMs: 1300,
        },
      ];

      const metrics = reconstructRounds(events);

      expect(metrics.rounds_total).toBe(2);
      expect(metrics.rounds_correct).toBe(1); // Round 1: first attempt correct. Round 2: first attempt incorrect.
      expect(metrics.attempt_count).toBe(3);
      expect(metrics.correct_count).toBe(2);
      expect(metrics.incorrect_count).toBe(1);
      expect(metrics.hint_count).toBe(1);
      expect(metrics.retry_count).toBe(1);
      expect(metrics.duration_ms).toBe(1300);
    });

    it("infers round completion when round_completed is missing", () => {
      const events: TelemetryEventInput[] = [
        {
          sessionUuid: "s1",
          seq: 1,
          eventName: "round_started",
          occurredAtMs: 100,
        },
        {
          sessionUuid: "s1",
          seq: 2,
          eventName: "answer_selected",
          occurredAtMs: 200,
        },
        {
          sessionUuid: "s1",
          seq: 3,
          eventName: "answer_correct",
          occurredAtMs: 300,
        },
        // Missing round_completed
      ];

      const metrics = reconstructRounds(events);

      expect(metrics.rounds_total).toBe(1);
      expect(metrics.rounds_correct).toBe(1);
    });

    it("calculates duration_ms correctly subtracting paused intervals (2 pauses)", () => {
      const events: TelemetryEventInput[] = [
        {
          sessionUuid: "s1",
          seq: 1,
          eventName: "game_started",
          occurredAtMs: 0,
        },
        {
          sessionUuid: "s1",
          seq: 2,
          eventName: "session_paused",
          occurredAtMs: 1000,
        },
        {
          sessionUuid: "s1",
          seq: 3,
          eventName: "session_resumed",
          occurredAtMs: 3000,
        }, // +2000ms pause
        {
          sessionUuid: "s1",
          seq: 4,
          eventName: "session_paused",
          occurredAtMs: 4000,
        },
        {
          sessionUuid: "s1",
          seq: 5,
          eventName: "session_resumed",
          occurredAtMs: 7000,
        }, // +3000ms pause
        {
          sessionUuid: "s1",
          seq: 6,
          eventName: "game_completed",
          occurredAtMs: 10_000,
        },
      ];

      const metrics = reconstructRounds(events);

      // Total time: 10,000ms. Paused: 2,000 + 3,000 = 5,000ms. Duration: 5,000ms.
      expect(metrics.duration_ms).toBe(5000);
    });

    it("returns 0 score when no round is completed", () => {
      const events: TelemetryEventInput[] = [
        {
          sessionUuid: "s1",
          seq: 1,
          eventName: "game_started",
          occurredAtMs: 0,
        },
      ];

      const res = computeSessionResult(events);

      expect(res.raw_score).toBe(0);
      expect(res.normalized_score).toBe(0);
      expect(res.metrics.rounds_total).toBe(0);
    });
  });

  describe("Task 2 — computeSessionResult Pure Formula", () => {
    it("BR-SCO-01: does not read any score value from client event payload", () => {
      const eventsWithFakeScore: TelemetryEventInput[] = [
        {
          sessionUuid: "s1",
          seq: 1,
          eventName: "round_started",
          payload: { score: 9999 },
        },
        {
          sessionUuid: "s1",
          seq: 2,
          eventName: "answer_selected",
          payload: { clientScore: 100 },
        },
        {
          sessionUuid: "s1",
          seq: 3,
          eventName: "answer_incorrect",
          payload: { score: 100 },
        },
        {
          sessionUuid: "s1",
          seq: 4,
          eventName: "round_completed",
          payload: { score: 100 },
        },
      ];

      const res = computeSessionResult(eventsWithFakeScore);

      expect(res.raw_score).toBe(0);
      expect(res.normalized_score).toBe(0);
    });

    it("BR-SCO-04 & BR-SCO-05: normalized_score in [0, 1], floor 0 for all wrong answers", () => {
      const allWrongEvents: TelemetryEventInput[] = [
        { sessionUuid: "s1", seq: 1, eventName: "round_started" },
        { sessionUuid: "s1", seq: 2, eventName: "answer_selected" },
        { sessionUuid: "s1", seq: 3, eventName: "answer_incorrect" },
        { sessionUuid: "s1", seq: 4, eventName: "round_completed" },
      ];

      const res = computeSessionResult(allWrongEvents);

      expect(res.normalized_score).toBe(0);
      expect(res.normalized_score).toBeGreaterThanOrEqual(0);
      expect(res.normalized_score).toBeLessThanOrEqual(1);
    });

    it("calculates 0.6 * first_try_ratio + 0.4 * accuracy using named constants", () => {
      // 2 rounds.
      // Round 1: first attempt correct.
      // Round 2: first attempt incorrect, second attempt correct.
      // first_try_ratio = 1 / 2 = 0.5
      // accuracy = 2 correct / 3 attempts = 0.6666666666666666
      // expected score = 0.6 * 0.5 + 0.4 * (2/3) = 0.3 + 0.2666666... = 0.5666666...
      const events: TelemetryEventInput[] = [
        { sessionUuid: "s1", seq: 1, eventName: "round_started" },
        { sessionUuid: "s1", seq: 2, eventName: "answer_selected" },
        { sessionUuid: "s1", seq: 3, eventName: "answer_correct" },
        { sessionUuid: "s1", seq: 4, eventName: "round_completed" },
        { sessionUuid: "s1", seq: 5, eventName: "round_started" },
        { sessionUuid: "s1", seq: 6, eventName: "answer_selected" },
        { sessionUuid: "s1", seq: 7, eventName: "answer_incorrect" },
        { sessionUuid: "s1", seq: 8, eventName: "answer_selected" },
        { sessionUuid: "s1", seq: 9, eventName: "answer_correct" },
        { sessionUuid: "s1", seq: 10, eventName: "round_completed" },
      ];

      const res = computeSessionResult(events);

      expect(res.first_try_ratio).toBe(0.5);
      expect(res.accuracy).toBeCloseTo(2 / 3);
      const expected =
        SCORING_WEIGHTS.FIRST_TRY * 0.5 + SCORING_WEIGHTS.ACCURACY * (2 / 3);
      expect(res.normalized_score).toBeCloseTo(expected);
    });

    it("is pure and deterministic when invoked twice on same events", () => {
      const events: TelemetryEventInput[] = [
        { sessionUuid: "s1", seq: 1, eventName: "round_started" },
        { sessionUuid: "s1", seq: 2, eventName: "answer_selected" },
        { sessionUuid: "s1", seq: 3, eventName: "answer_correct" },
      ];

      const res1 = computeSessionResult(events);
      const res2 = computeSessionResult(events);

      expect(res1).toEqual(res2);
    });
  });

  describe("Task 3 — Stars & Positive Feedback", () => {
    it("returns 3 stars for normalized_score >= 0.85 when completed", () => {
      expect(computeStars(0.85, "completed")).toBe(3);
      expect(computeStars(0.95, "completed")).toBe(3);
    });

    it("returns 2 stars for normalized_score >= 0.55 and < 0.85 when completed", () => {
      expect(computeStars(0.55, "completed")).toBe(2);
      expect(computeStars(0.84, "completed")).toBe(2);
    });

    it("Section 7.3: returns 1 star for low normalized_score (e.g. 0.2) when completed", () => {
      expect(computeStars(0.2, "completed")).toBe(1);
      expect(computeStars(0.0, "completed")).toBe(1);
    });

    it("BR-SCO-07 & D-GL: returns null stars for abandoned session", () => {
      expect(computeStars(0.9, "abandoned")).toBeNull();
      expect(computeStars(0.2, "abandoned")).toBeNull();
    });

    it("BR-SCO-06: two sessions with identical result but different duration produce same stars", () => {
      const starsFast = computeStars(0.9, "completed");
      const starsSlow = computeStars(0.9, "completed");

      expect(starsFast).toBe(starsSlow);
    });

    it("BR-SCO-08: celebration is always positive regardless of score", () => {
      expect(getCelebrationCode(0.95)).toBe("great");
      expect(getCelebrationCode(0.65)).toBe("good");
      expect(getCelebrationCode(0.1)).toBe("nice_try");
    });
  });

  describe("Task 4 — Kid Surface Response Payload Framing", () => {
    it("BR-SCO-02 & D-GJ: response contains NO normalized_score, raw_score, or score", () => {
      const result = computeSessionResult([
        { sessionUuid: "s1", seq: 1, eventName: "round_started" },
        { sessionUuid: "s1", seq: 2, eventName: "answer_selected" },
        { sessionUuid: "s1", seq: 3, eventName: "answer_correct" },
      ]);

      const kidResponse = formatKidSurfaceResponse({
        normalized_score: result.normalized_score,
        completionStatus: "completed",
        metrics: result.metrics,
      });

      // Verify exact keys present
      const keys = Object.keys(kidResponse);
      expect(keys).toContain("stars");
      expect(keys).toContain("rounds_correct");
      expect(keys).toContain("rounds_total");
      expect(keys).toContain("celebration");
      expect(keys).toContain("next_suggestion");

      // Verify forbidden keys are NOT present
      expect(keys).not.toContain("normalized_score");
      expect(keys).not.toContain("raw_score");
      expect(keys).not.toContain("score");

      // D-GK: next_suggestion is null in P1
      expect(kidResponse.next_suggestion).toBeNull();
    });
  });

  describe("Task 7 — Mastery Guard Function (D-GH)", () => {
    it("returns true only when all 4 conditions are met", () => {
      expect(
        masteryGuard({
          childProfileId: 10,
          isPreview: false,
          completionStatus: "completed",
          hasSkills: true,
        })
      ).toBe(true);
    });

    it("returns false if childProfileId is missing (guest)", () => {
      expect(
        masteryGuard({
          childProfileId: null,
          isPreview: false,
          completionStatus: "completed",
          hasSkills: true,
        })
      ).toBe(false);
    });

    it("returns false if isPreview is true", () => {
      expect(
        masteryGuard({
          childProfileId: 10,
          isPreview: true,
          completionStatus: "completed",
          hasSkills: true,
        })
      ).toBe(false);
    });

    it("returns false if completionStatus is not completed", () => {
      expect(
        masteryGuard({
          childProfileId: 10,
          isPreview: false,
          completionStatus: "in_progress",
          hasSkills: true,
        })
      ).toBe(false);
    });

    it("returns false if hasSkills is false", () => {
      expect(
        masteryGuard({
          childProfileId: 10,
          isPreview: false,
          completionStatus: "completed",
          hasSkills: false,
        })
      ).toBe(false);
    });
  });
});
