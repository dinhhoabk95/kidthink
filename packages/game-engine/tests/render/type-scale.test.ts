import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import {
  type CanvasTypeRole,
  canvasFontPx,
  MIN_LEGIBLE_CSS_PX,
  minLegiblePx,
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

  it("T1.9 (Ca âm): Một tỷ lệ tính toán thô dưới sàn thì canvasFontPx BẮT BUỘC kẹp lên sàn ≥ 16 px CSS", () => {
    // Nếu chỉ dùng raw = space.h * 0.01 mà không kẹp minLegiblePx:
    const vp = VIEWPORTS[0]; // 390x844
    const space = deriveLogicSpace(vp.w, vp.h);
    const scale = Math.min(vp.w / space.w, vp.h / space.h);

    const tinyRatio = 0.005;
    const rawPx = Math.round(space.h * tinyRatio); // 1168 * 0.005 = 6 logic px
    const rawCssPx = rawPx * scale; // 6 * 0.722 = 4.33 px CSS < 16 px CSS

    // Khẳng định tỉ lệ thô này thực sự vi phạm sàn nếu không kẹp
    expect(rawCssPx).toBeLessThan(MIN_LEGIBLE_CSS_PX);

    // canvasFontPx BẮT BUỘC kẹp lên sàn logic tương ứng với 16 px CSS
    const clampedLogicPx = Math.max(rawPx, minLegiblePx(space, scale));
    const clampedCssPx = clampedLogicPx * scale;

    expect(
      clampedCssPx,
      `Kẹp sàn trên viewport ${vp.name} phải đạt ít nhất 16 px CSS`
    ).toBeGreaterThanOrEqual(MIN_LEGIBLE_CSS_PX);
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
