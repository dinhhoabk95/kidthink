import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { drawSlotLabel } from "#src/render/index.js";
import { MIN_LEGIBLE_CSS_PX } from "#src/render/type-scale";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

const FONT_PX_REGEX = /(\d+(?:\.\d+)?)px/;

/**
 * M4 của Task #268: sàn cỡ chữ đo bằng **px CSS trên khung nhìn thật**, không
 * phải px logic. Nhãn slot là chỗ nợ này sống lâu nhất — nó từng là hằng 11 rồi
 * hằng 16, cả hai đều ra dưới 16 px CSS trên máy dọc 390 px.
 */
describe("Sàn cỡ chữ nhãn slot quy về px CSS (BR-A11-08 / BR-ERC-12)", () => {
  const VIEWPORTS = [
    { w: 390, h: 844, name: "390x844" },
    { w: 820, h: 1180, name: "820x1180" },
    { w: 1440, h: 900, name: "1440x900" },
  ] as const;

  const fontPxOf = (font: string): number => {
    const match = font.match(FONT_PX_REGEX);
    return match?.[1] ? Number.parseFloat(match[1]) : Number.NaN;
  };

  it("nhãn slot nhỏ nhất vẫn ≥ 16 px CSS trên cả ba viewport", () => {
    for (const vp of VIEWPORTS) {
      const space = deriveLogicSpace(vp.w, vp.h);
      const scale = Math.min(vp.w / space.w, vp.h / space.h);

      const rs = new RenderSystem();
      rs.logicSpace = space;
      rs.viewport = {
        cssHeight: vp.h,
        cssWidth: vp.w,
        dpr: 1,
        offsetX: 0,
        offsetY: 0,
        scale,
        logicSpace: space,
      };

      const fake = createFakeCanvas(vp.w, vp.h);
      const raw = fake.getContext("2d");
      if (!raw) {
        throw new Error("Cannot get context from fake canvas");
      }
      const ctx = raw as unknown as CanvasRenderingContext2D;
      const fonts: string[] = [];
      ctx.fillText = () => {
        fonts.push(ctx.font);
      };

      // Slot nhỏ nhất còn hợp lệ: sàn chạm của band 5-6.
      const slot: Slot = {
        index: 0,
        x: 100,
        y: 100,
        w: 64,
        h: 64,
        hitW: 64,
        hitH: 64,
        page: 0,
        role: "source",
      };
      drawSlotLabel(ctx, "3 quả", slot, rs);

      const logicPx = fontPxOf(fonts[0] ?? "");
      expect(
        logicPx * scale,
        `Viewport ${vp.name}: nhãn ${logicPx} px logic ra ${(logicPx * scale).toFixed(1)} px CSS`
      ).toBeGreaterThanOrEqual(MIN_LEGIBLE_CSS_PX);
    }
  });
});
