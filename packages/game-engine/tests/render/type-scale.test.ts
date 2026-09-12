import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import {
  CANVAS_TYPE_RATIOS,
  type CanvasTypeRole,
  canvasFontPx,
  MIN_LEGIBLE_CSS_PX,
  minLegiblePx,
  typeReferencePx,
} from "#src/render/type-scale";

describe("Task #268: Thang cỡ chữ theo LogicSpace (BR-ERC-12 / BR-A11-08)", () => {
  const VIEWPORTS = [
    { w: 390, h: 844, name: "mobile portrait (390x844)" },
    { w: 820, h: 1180, name: "tablet portrait (820x1180)" },
    { w: 1440, h: 900, name: "desktop landscape (1440x900)" },
  ] as const;

  const ROLES: readonly CanvasTypeRole[] = [
    "number",
    "display",
    "label",
    "hud",
    "caption",
    "prompt",
  ];

  it("T1.8: Mọi cỡ chữ quy về px CSS trên cả ba viewport đều ≥ 16 px CSS", () => {
    for (const vp of VIEWPORTS) {
      const space = deriveLogicSpace(vp.w, vp.h);
      const scale = Math.min(vp.w / space.w, vp.h / space.h);

      for (const role of ROLES) {
        const logicPx = canvasFontPx(space, role, scale);
        const cssPx = logicPx * scale;

        expect(
          cssPx,
          `Viewport ${vp.name}, vai trò ${role}: ${cssPx.toFixed(2)}px CSS phải ≥ ${MIN_LEGIBLE_CSS_PX}px CSS`
        ).toBeGreaterThanOrEqual(MIN_LEGIBLE_CSS_PX);
      }
    }
  });

  it("T1.9 (Ca âm): canvasFontPx TỰ kẹp sàn — bỏ kẹp thì test này đỏ", () => {
    // Khung nhìn thu nhỏ mạnh: tỉ lệ 0,3 px CSS trên một đơn vị logic.
    const space = deriveLogicSpace(390, 844);
    const tinyScale = 0.3;

    const rawCaptionPx = Math.round(
      Math.min(space.w, space.h) * CANVAS_TYPE_RATIOS.caption
    );
    expect(rawCaptionPx * tinyScale).toBeLessThan(MIN_LEGIBLE_CSS_PX);

    // Giá trị TRẢ VỀ của hàm, không phải phép tính lặp lại trong test.
    const clamped = canvasFontPx(space, "caption", tinyScale);
    expect(clamped).toBeGreaterThan(rawCaptionPx);
    expect(clamped * tinyScale).toBeGreaterThanOrEqual(MIN_LEGIBLE_CSS_PX);
  });

  it("Thang tỷ lệ khớp bảng mục 3 của 05-motion-and-surface.md", () => {
    expect(CANVAS_TYPE_RATIOS.number).toBe(0.089);
    expect(CANVAS_TYPE_RATIOS.display).toBe(0.081);
    expect(CANVAS_TYPE_RATIOS.label).toBe(0.052);
    expect(CANVAS_TYPE_RATIOS.hud).toBe(0.044);
    expect(CANVAS_TYPE_RATIOS.caption).toBe(0.036);
  });

  it("Chiều cao tham chiếu là CẠNH NGẮN, nên máy dọc và desktop cùng cỡ chữ logic", () => {
    const portrait = deriveLogicSpace(390, 844);
    const landscape = deriveLogicSpace(1440, 900);
    expect(portrait.h).toBeGreaterThan(portrait.w);
    expect(typeReferencePx(portrait)).toBe(typeReferencePx(landscape));
    expect(canvasFontPx(portrait, "number", 2)).toBe(
      canvasFontPx(landscape, "number", 2)
    );
  });

  it("T1.10: Kiểm tra sàn BẮT BUỘC quy đổi ra px CSS thật, không dùng px logic", () => {
    const space = deriveLogicSpace(390, 844);
    const scale = Math.min(390 / space.w, 844 / space.h);

    // Trên viewport 390x844 (scale ~0.72), 16 logic px chỉ tương đương ~11.5 px CSS (< 16 px CSS)
    const sixteenLogicPxInCss = 16 * scale;
    expect(sixteenLogicPxInCss).toBeLessThan(16);

    // minLegiblePx phải trả về số logic px đủ để scale * logicPx >= 16
    const requiredLogicPx = minLegiblePx(space, scale);
    expect(requiredLogicPx).toBeGreaterThanOrEqual(22);
    expect(requiredLogicPx * scale).toBeGreaterThanOrEqual(16);
  });
});
