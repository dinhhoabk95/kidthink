import { describe, expect, it } from "vitest";
import {
  measureSeedBandCoverage,
  runEngineBehaviorCorpusGate,
} from "../../src/gates/engine-behavior-corpus.js";

describe("Cổng check:engine-behavior-corpus (BR-EBD-04 nửa corpus)", () => {
  it("baseline: mỗi band đạt sàn miền bằng engine CÓ nội dung thật", () => {
    const result = runEngineBehaviorCorpusGate();

    expect(result.violations).toEqual([]);

    const b34 = result.bandSummaries.find((s) => s.band === "3-4");
    const b45 = result.bandSummaries.find((s) => s.band === "4-5");
    const b56 = result.bandSummaries.find((s) => s.band === "5-6");

    expect(b34?.domains).toHaveLength(2);
    expect(b45?.domains).toHaveLength(5);
    expect(b56?.domains).toHaveLength(6);
    expect(b34?.passed).toBe(true);
    expect(b45?.passed).toBe(true);
    expect(b56?.passed).toBe(true);
  });

  it("số engine có nội dung khớp số đo registry: 8 · 22 · 37", () => {
    const result = runEngineBehaviorCorpusGate();
    expect(result.bandSummaries.map((s) => s.enginesWithContent)).toEqual([
      8, 22, 37,
    ]);
  });

  it("ca âm: engine mất hết level ở band làm band đó tụt dưới sàn", () => {
    const coverage = measureSeedBandCoverage();
    // GT-013 là engine duy nhất mang miền lan-net xuống band 4-5.
    expect(coverage.get("GT-013")?.has("4-5")).toBe(true);
    coverage.get("GT-013")?.delete("4-5");

    const result = runEngineBehaviorCorpusGate({ coverage });
    const b45 = result.bandSummaries.find((s) => s.band === "4-5");

    expect(b45?.domains).not.toContain("lan-net");
    expect(b45?.passed).toBe(false);
    expect(
      result.violations.some(
        (v) => v.includes("Band 4-5") && v.includes("dưới sàn")
      )
    ).toBe(true);
  });
});
