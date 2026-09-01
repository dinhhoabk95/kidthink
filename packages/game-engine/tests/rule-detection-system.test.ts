import { describe, expect, it } from "vitest";
import {
  detectRule,
  type RuleDetectionOptions,
} from "../src/systems/rule-detection-system.js";

describe("RuleDetectionSystem (BR-E036-01..02)", () => {
  it("Scenario 1: BR-E036-01 — Pure function is deterministic across 100 executions", () => {
    const sequence = ["A", "B", "A", "B", "A", "B"];
    const options: RuleDetectionOptions = {
      minRepetitions: 3,
      strictness: "relaxed",
      paletteSize: 2,
    };

    const firstResult = detectRule(sequence, options);
    expect(firstResult.detected).toBe(true);
    expect(firstResult.isWin).toBe(true);

    for (let i = 0; i < 100; i++) {
      const runResult = detectRule(sequence, options);
      expect(runResult).toEqual(firstResult);
    }
  });

  it("Scenario 2: BR-E036-02 — Two completely different valid patterns both pass", () => {
    // Pattern 1: AB AB AB
    const seqA = ["apple", "banana", "apple", "banana", "apple", "banana"];
    const resA = detectRule(seqA, { minRepetitions: 3, paletteSize: 2 });
    expect(resA.detected).toBe(true);
    expect(resA.motif).toEqual(["apple", "banana"]);
    expect(resA.repetitions).toBe(3);
    expect(resA.isWin).toBe(true);
    expect(resA.score).toBeGreaterThanOrEqual(60);

    // Pattern 2: ABC ABC ABC
    const seqB = [
      "cat",
      "dog",
      "fox",
      "cat",
      "dog",
      "fox",
      "cat",
      "dog",
      "fox",
    ];
    const resB = detectRule(seqB, { minRepetitions: 3, paletteSize: 3 });
    expect(resB.detected).toBe(true);
    expect(resB.motif).toEqual(["cat", "dog", "fox"]);
    expect(resB.repetitions).toBe(3);
    expect(resB.isWin).toBe(true);
    expect(resB.score).toBeGreaterThanOrEqual(60);
  });

  it("Scenario 3: BR-E036-02 — Random sequence with no repeating motif scores 0", () => {
    const randomSeq = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const res = detectRule(randomSeq, { minRepetitions: 2, paletteSize: 8 });
    expect(res.detected).toBe(false);
    expect(res.isWin).toBe(false);
    expect(res.score).toBe(0);
    expect(res.repetitions).toBe(0);
    expect(res.motif).toEqual([]);
  });

  it("Scenario 4: Relaxed mode accepts trailing partial motif", () => {
    // AB AB A (2 full repetitions + 1 trailing partial)
    const seq = ["star", "moon", "star", "moon", "star"];
    const resRelaxed = detectRule(seq, {
      minRepetitions: 2,
      strictness: "relaxed",
      paletteSize: 2,
    });
    expect(resRelaxed.detected).toBe(true);
    expect(resRelaxed.motif).toEqual(["star", "moon"]);
    expect(resRelaxed.repetitions).toBe(2);
    expect(resRelaxed.isWin).toBe(true);
  });

  it("Scenario 5: Strict mode rejects trailing partial motif", () => {
    // AB AB A with strict mode
    const seq = ["star", "moon", "star", "moon", "star"];
    const resStrict = detectRule(seq, {
      minRepetitions: 2,
      strictness: "strict",
      paletteSize: 2,
    });
    expect(resStrict.detected).toBe(false);
    expect(resStrict.isWin).toBe(false);
    expect(resStrict.score).toBe(0);

    // AB AB in strict mode succeeds
    const seqExact = ["star", "moon", "star", "moon"];
    const resExact = detectRule(seqExact, {
      minRepetitions: 2,
      strictness: "strict",
      paletteSize: 2,
    });
    expect(resExact.detected).toBe(true);
    expect(resExact.isWin).toBe(true);
    expect(resExact.repetitions).toBe(2);
  });

  it("Scenario 6: Monotone repeating element works (A A A A)", () => {
    const seq = ["red", "red", "red", "red"];
    const res = detectRule(seq, { minRepetitions: 3, paletteSize: 3 });
    expect(res.detected).toBe(true);
    expect(res.motif).toEqual(["red"]);
    expect(res.repetitions).toBe(4);
    expect(res.isWin).toBe(true);
    expect(res.distinctElements).toBe(1);
  });

  it("Scenario 7: Extra repetitions yield bonus points capped at standard score thresholds", () => {
    // 3 repetitions vs 5 repetitions
    const seq3 = ["A", "B", "A", "B", "A", "B"];
    const res3 = detectRule(seq3, { minRepetitions: 3, paletteSize: 2 });

    const seq5 = ["A", "B", "A", "B", "A", "B", "A", "B", "A", "B"];
    const res5 = detectRule(seq5, { minRepetitions: 3, paletteSize: 2 });

    expect(res5.score).toBeGreaterThan(res3.score);
    expect(res5.score).toBeLessThanOrEqual(100);
  });

  it("Scenario 8: Sequence with nulls or empty elements evaluates continuous filled prefix", () => {
    const seq = ["A", "B", "A", "B", null, "C", "D"];
    const res = detectRule(seq, { minRepetitions: 2, paletteSize: 4 });
    expect(res.detected).toBe(true);
    expect(res.motif).toEqual(["A", "B"]);
    expect(res.repetitions).toBe(2);
  });

  it("Scenario 9: Empty sequence returns 0 score", () => {
    const res = detectRule([], { minRepetitions: 2 });
    expect(res.detected).toBe(false);
    expect(res.isWin).toBe(false);
    expect(res.score).toBe(0);
  });

  it("Scenario 10: Finds the shortest repeating motif (A B A B vs A B A B A B)", () => {
    // In "A B A B A B", motif is ["A", "B"], not ["A", "B", "A", "B"]
    const seq = ["A", "B", "A", "B", "A", "B"];
    const res = detectRule(seq, { minRepetitions: 2, paletteSize: 2 });
    expect(res.motif).toEqual(["A", "B"]);
    expect(res.repetitions).toBe(3);
  });
});
