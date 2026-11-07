import { describe, expect, it } from "vitest";
import { deriveDerangement } from "#src/rng/derangement";
import { createRng as mulberry32 } from "#src/rng/mulberry32";

/** Task #313 Phase 2 — hoán vị không có phần tử nào đứng nguyên chỗ. */
describe("deriveDerangement", () => {
  it("không phần tử nào giữ vị trí ban đầu, qua nhiều seed", () => {
    const input = ["a", "b", "c", "d", "e"];
    for (let seed = 1; seed <= 200; seed++) {
      const out = deriveDerangement(input, mulberry32(seed));
      expect(out).toHaveLength(input.length);
      expect([...out].sort()).toEqual([...input].sort());
      expect(out.every((v, i) => v !== input[i])).toBe(true);
    }
  });

  it("deterministic theo seed và không đổi mảng gốc", () => {
    const input = [1, 2, 3, 4];
    const a = deriveDerangement(input, mulberry32(7));
    const b = deriveDerangement(input, mulberry32(7));
    expect(a).toEqual(b);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it("hai phần tử thì đảo chỗ", () => {
    expect(deriveDerangement(["x", "y"], mulberry32(1))).toEqual(["y", "x"]);
  });

  it("không thể có derangement với <2 phần tử thì trả bản sao", () => {
    expect(deriveDerangement([], mulberry32(1))).toEqual([]);
    expect(deriveDerangement(["x"], mulberry32(1))).toEqual(["x"]);
  });
});
