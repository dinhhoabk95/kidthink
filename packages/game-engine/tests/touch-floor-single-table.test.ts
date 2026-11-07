import { describe, expect, it } from "vitest";
import { getMinTouchTargetSize } from "#src/interaction";
import { getTouchFloor } from "#src/layout/constants";

/** Task #313 B12 — một bảng sàn chạm duy nhất (trước đây 64 vs 76 ở band 4-5). */
describe("sàn chạm: interaction và layout dùng chung một bảng", () => {
  for (const band of ["3-4", "4-5", "5-6"] as const) {
    it(`band ${band}`, () => {
      expect(getMinTouchTargetSize(band)).toBe(getTouchFloor(band));
    });
  }
});
