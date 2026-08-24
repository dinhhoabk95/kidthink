import { describe, expect, it } from "vitest";
import { validateRoundEvents } from "#src/round-event-gate";

function makeEvent(
  name: string,
  data?: Record<string, unknown>
): { event_name: string; data?: Record<string, unknown> } {
  return { event_name: name, data };
}

describe("Round Event Gate (WP100.7)", () => {
  describe("scoring.mode = 'rounds'", () => {
    it("BR-RSP-02: rejects when round_started is missing", () => {
      const result = validateRoundEvents({
        scoring_mode: "rounds",
        rounds_total: 3,
        events: [makeEvent("game_started"), makeEvent("game_completed")],
      });
      expect(result.ok).toBe(false);
      expect(result.violations).toContain("MISSING_ROUND_STARTED");
    });

    it("rejects incomplete round sequence", () => {
      const result = validateRoundEvents({
        scoring_mode: "rounds",
        rounds_total: 3,
        events: [
          makeEvent("round_started", { round_index: 0 }),
          makeEvent("round_completed", { round_index: 0 }),
          makeEvent("round_started", { round_index: 1 }),
          // round 1 never completed or skipped
        ],
      });
      expect(result.ok).toBe(false);
      expect(result.violations).toContain("INCOMPLETE_ROUND_SEQUENCE");
    });

    it("passes with complete round sequence", () => {
      const result = validateRoundEvents({
        scoring_mode: "rounds",
        rounds_total: 2,
        events: [
          makeEvent("round_started", { round_index: 0 }),
          makeEvent("round_completed", { round_index: 0 }),
          makeEvent("round_started", { round_index: 1 }),
          makeEvent("round_completed", { round_index: 1 }),
        ],
      });
      expect(result.ok).toBe(true);
      expect(result.violations).toEqual([]);
      expect(result.computed_rounds_correct).toBe(2);
    });

    it("counts skipped rounds correctly", () => {
      const result = validateRoundEvents({
        scoring_mode: "rounds",
        rounds_total: 3,
        events: [
          makeEvent("round_started", { round_index: 0 }),
          makeEvent("round_completed", { round_index: 0 }),
          makeEvent("round_started", { round_index: 1 }),
          makeEvent("round_skipped", { round_index: 1 }),
          makeEvent("round_started", { round_index: 2 }),
          makeEvent("round_completed", { round_index: 2 }),
        ],
      });
      expect(result.ok).toBe(true);
      expect(result.computed_rounds_correct).toBe(2);
    });

    it("BR-RSP-12: ignores client-sent rounds_correct", () => {
      const result = validateRoundEvents({
        scoring_mode: "rounds",
        rounds_total: 2,
        events: [
          makeEvent("round_started", { round_index: 0 }),
          makeEvent("round_completed", { round_index: 0 }),
          makeEvent("round_started", { round_index: 1 }),
          makeEvent("round_completed", { round_index: 1 }),
        ],
        client_rounds_correct: 999,
      });
      expect(result.computed_rounds_correct).toBe(2);
    });
  });

  describe("scoring.mode = 'attempts'", () => {
    it("passes without round events", () => {
      const result = validateRoundEvents({
        scoring_mode: "attempts",
        rounds_total: 0,
        events: [
          makeEvent("answer_correct"),
          makeEvent("answer_incorrect"),
          makeEvent("answer_correct"),
        ],
      });
      expect(result.ok).toBe(true);
      expect(result.computed_rounds_correct).toBe(2);
    });
  });

  describe("negative tests (BR-TYP-07)", () => {
    it("gate must catch missing events — NOT silently pass", () => {
      const result = validateRoundEvents({
        scoring_mode: "rounds",
        rounds_total: 4,
        events: [],
      });
      expect(result.ok).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });
  });
});
