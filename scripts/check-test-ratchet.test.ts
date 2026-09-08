import { describe, expect, it } from "vitest";
import {
  isLoosening,
  type TestBaseline,
  verifyAgainstBaseline,
} from "./check-test-ratchet.ts";

const baseline: TestBaseline = {
  totalFailed: 2,
  failedFiles: ["a.test.ts", "b.test.ts"],
  minTotalSuites: 100,
};

describe("Cổng check:test-ratchet (Task #260 I5 & I6)", () => {
  it("giữ nguyên tập đỏ và đủ suite thì xanh", () => {
    const verdict = verifyAgainstBaseline(
      baseline,
      ["a.test.ts", "b.test.ts"],
      100
    );
    expect(verdict.ok).toBe(true);
    expect(verdict.reasons).toEqual([]);
  });

  it("nợ giảm thì vẫn xanh", () => {
    expect(verifyAgainstBaseline(baseline, ["a.test.ts"], 100).ok).toBe(true);
  });

  it("Ca âm: file đỏ mới ngoài baseline làm cổng đỏ và nêu đúng tên", () => {
    const verdict = verifyAgainstBaseline(
      baseline,
      ["a.test.ts", "b.test.ts", "c.test.ts"],
      100
    );
    expect(verdict.ok).toBe(false);
    expect(verdict.newFailedFiles).toEqual(["c.test.ts"]);
  });

  it("Ca âm: xoá/skip test làm tụt số suite thì cổng đỏ dù tập đỏ nhỏ hơn", () => {
    const verdict = verifyAgainstBaseline(baseline, ["a.test.ts"], 88);
    expect(verdict.ok).toBe(false);
    expect(verdict.missingSuites).toBe(12);
    expect(verdict.reasons.join(" ")).toContain("suite");
  });

  it("baseline chưa có sàn suite thì không chặn (tương thích ngược)", () => {
    const legacy: TestBaseline = {
      totalFailed: 1,
      failedFiles: ["a.test.ts"],
    };
    expect(verifyAgainstBaseline(legacy, ["a.test.ts"], 3).ok).toBe(true);
  });

  it("Ca âm: --update từ chối khi trạng thái xấu hơn baseline", () => {
    expect(isLoosening(baseline, ["a.test.ts", "c.test.ts"], 100)).toBe(true);
    expect(isLoosening(baseline, ["a.test.ts", "b.test.ts"], 60)).toBe(true);
    expect(
      isLoosening(
        { totalFailed: 1, failedFiles: ["a.test.ts"], minTotalSuites: 10 },
        ["a.test.ts", "b.test.ts"],
        10
      )
    ).toBe(true);
  });

  it("--update chấp nhận khi nợ giảm", () => {
    expect(isLoosening(baseline, ["a.test.ts"], 100)).toBe(false);
    expect(isLoosening(baseline, [], 120)).toBe(false);
  });
});
