import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOGIC_SPACE,
  deriveLogicSpace,
  getTouchFloor,
  LOGIC_LONG_SIDE_MAX,
  LOGIC_SHORT_SIDE,
} from "#src/layout/constants";

/**
 * Cổng không gian logic theo hướng màn — Task #203, quyết định A.
 *
 * Lý do tồn tại, đo ngày 2026-09-01 bằng trình duyệt thật: với không gian cố định
 * 960x540, màn dọc 390 px cho tỉ lệ 0,406 nên sàn chạm 96 px của band 3-4 chỉ còn
 * **39 px CSS**. Dưới cả ngưỡng 44 px của WCAG.
 */

/** Sàn chạm quy ra pixel CSS thật trên một khung nhìn. */
function touchFloorInCssPx(
  cssWidth: number,
  cssHeight: number,
  band: "3-4" | "4-5" | "5-6"
): number {
  const logic = deriveLogicSpace(cssWidth, cssHeight);
  const scale = Math.min(cssWidth / logic.w, cssHeight / logic.h);
  return getTouchFloor(band) * scale;
}

describe("không gian logic theo hướng màn", () => {
  it("màn ngang 16:9 vẫn ra đúng 960x540 — không có bước nhảy cho tablet/desktop", () => {
    expect(deriveLogicSpace(1280, 720)).toEqual({ h: 540, w: 960 });
    expect(deriveLogicSpace(1920, 1080)).toEqual({ h: 540, w: 960 });
  });

  it("cạnh ngắn luôn là 540, ở cả hai hướng", () => {
    expect(deriveLogicSpace(1440, 900).h).toBe(LOGIC_SHORT_SIDE);
    expect(deriveLogicSpace(390, 844).w).toBe(LOGIC_SHORT_SIDE);
  });

  it("cạnh dài bị chặn trên, màn siêu dài không kéo cảnh mỏng vô hạn", () => {
    const space = deriveLogicSpace(300, 3000);
    expect(space.h).toBe(LOGIC_LONG_SIDE_MAX);
    expect(space.w).toBe(LOGIC_SHORT_SIDE);
  });

  it("khung nhìn không hợp lệ trả về mặc định, cấm sinh NaN", () => {
    for (const [w, h] of [
      [0, 800],
      [390, 0],
      [-1, -1],
      [Number.NaN, 100],
    ]) {
      const space = deriveLogicSpace(w as number, h as number);
      expect(space).toEqual(DEFAULT_LOGIC_SPACE);
      expect(Number.isFinite(space.w)).toBe(true);
      expect(Number.isFinite(space.h)).toBe(true);
    }
  });

  // Đây là lý do cả quyết định A tồn tại. Con số phải nhích thật.
  it("sàn chạm trên màn dọc 390 px vượt ngưỡng 44 px của WCAG", () => {
    const after = touchFloorInCssPx(390, 844, "3-4");
    expect(after).toBeGreaterThan(44);
  });

  // Ca âm: không gian cố định 960x540 — bản trước quyết định A — phải trượt.
  it("ca âm — không gian cố định 960x540 cho ra 39 px, dưới ngưỡng", () => {
    const fixedScale = Math.min(390 / 960, 844 / 540);
    const before = getTouchFloor("3-4") * fixedScale;

    expect(before).toBeLessThan(44);
    expect(before).toBeCloseTo(39, 0);
    expect(touchFloorInCssPx(390, 844, "3-4")).toBeGreaterThan(before);
  });
});
