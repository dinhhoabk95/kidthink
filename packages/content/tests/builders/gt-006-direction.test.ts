import { describe, expect, it } from "vitest";
import {
  asArray,
  asObject,
  asString,
  assetShown,
  type PackObject,
  realPacks,
  toPack,
} from "./helpers/real-packs.js";

const DIGITS_ONLY = /^\d+$/;

/**
 * Vi phạm `BR-E006-08`: dãy chữ số tăng/giảm mà đề không nói chiều xếp — đáp
 * án 10, 9, 8 với đề "theo đúng trình tự" chấm sai trẻ xếp 8, 9, 10.
 */
function directionViolations(pack: PackObject): string[] {
  const steps = asArray(pack.sequence)
    .map((s) => asObject(s))
    .sort((a, b) => Number(a.order_index) - Number(b.order_index))
    .map((s) => assetShown(asObject(s.asset)).trim());
  if (!steps.every((t) => DIGITS_ONLY.test(t)) || steps.length < 2) {
    return [];
  }
  const nums = steps.map(Number);
  const diffs = nums.slice(1).map((v, i) => v - (nums[i] ?? v));
  const prompt = asString(pack.prompt);
  if (diffs.every((d) => d > 0) && !prompt.includes("từ bé đến lớn")) {
    return [`dãy ${steps.join(",")} tăng nhưng đề "${prompt}" không nói`];
  }
  if (diffs.every((d) => d < 0) && !prompt.includes("từ lớn đến bé")) {
    return [`dãy ${steps.join(",")} giảm nhưng đề "${prompt}" không nói`];
  }
  return [];
}

describe("GT-006 — đề nói chiều xếp của dãy số (BR-E006-08)", () => {
  it("corpus thật: dãy chữ số tăng/giảm thì đề nói đúng chiều", () => {
    const packs = realPacks("GT-006");
    expect(packs.length).toBeGreaterThan(0);
    const bad = packs.flatMap(({ levelCode, roundIndex, pack }) =>
      directionViolations(pack).map((v) => `${levelCode}#${roundIndex}: ${v}`)
    );
    expect(bad).toEqual([]);
  });

  it("ca âm: dãy 10, 9, 8 với đề 'theo đúng trình tự' bị bắt", () => {
    const legacy = toPack({
      prompt: "Đố bé sắp xếp dãy theo đúng trình tự!",
      sequence: ["10", "9", "8"].map((text, i) => ({
        order_index: i,
        asset: { kind: "text", text },
      })),
    });
    expect(directionViolations(legacy)).toHaveLength(1);
  });
});
