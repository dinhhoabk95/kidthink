import { describe, expect, it } from "vitest";
import { SLOT_GAP_PX } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { computePairColumnsInStage } from "#src/templates/GT-005/pair-columns.js";

/** `BR-ENG-19`: cột nguồn và cột đích không chồng nhau, cách nhau >= `SLOT_GAP_PX`. */
function span(slots: readonly Slot[]): { min: number; max: number } {
  return {
    min: Math.min(...slots.map((s) => s.x - s.w / 2)),
    max: Math.max(...slots.map((s) => s.x + s.w / 2)),
  };
}

describe("GT-005 pair-columns — hai cột không chồng nhau", () => {
  it.each([
    ["3-4", 4],
    ["3-4", 5],
    ["3-4", 6],
    ["4-5", 6],
  ] as const)("band %s, %i cặp ở sân khấu hẹp", (band, n) => {
    const slots = computePairColumnsInStage({
      stage: { x: 0, y: 0, w: 540, h: 494 },
      ageBand: band,
      cssPerLogic: 0.625_925_925_925_925_9,
      leftCount: n,
      rightCount: n,
    });
    const src = slots.filter((s) => s.role === "source");
    const tgt = slots.filter((s) => s.role === "target");
    const sideBySide = src.some((s) => tgt.some((t) => t.y === s.y));
    if (sideBySide) {
      expect(span(tgt).min - span(src).max).toBeGreaterThanOrEqual(SLOT_GAP_PX);
    }
  });
});
