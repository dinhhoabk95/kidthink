import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { drawTextInSlot } from "#src/render/shared-slot-render";
import { minLegiblePx } from "#src/render/type-scale";
import { LONG_LABEL } from "./fixtures/long-label.ts";

interface TextCall {
  readonly font: string;
  readonly maxWidth: number | undefined;
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

interface RecordingCtx {
  readonly calls: TextCall[];
  readonly ctx: CanvasRenderingContext2D;
}

const FONT_PX_REGEX = /(\d+(?:\.\d+)?)px/;
const CHAR_WIDTH_RATIO = 0.6;

function fontPx(font: string): number {
  const match = font.match(FONT_PX_REGEX);
  return match?.[1] ? Number.parseFloat(match[1]) : Number.NaN;
}

function createRecordingCtx(): RecordingCtx {
  const calls: TextCall[] = [];
  const state: { font: string } = { font: "10px sans-serif" };
  const fake: Partial<CanvasRenderingContext2D> = {
    save() {
      /* no-op */
    },
    restore() {
      /* no-op */
    },
    fillStyle: "",
    textAlign: "center",
    textBaseline: "middle",
    get font(): string {
      return state.font;
    },
    set font(value: string) {
      state.font = value;
    },
    measureText(text: string): TextMetrics {
      const size = fontPx(state.font);
      return {
        width: Array.from(text).length * size * CHAR_WIDTH_RATIO,
      } as TextMetrics;
    },
    fillText(text: string, x: number, y: number, maxWidth?: number): void {
      calls.push({ font: state.font, maxWidth, text, x, y });
    },
  };
  return { calls, ctx: fake as CanvasRenderingContext2D };
}

const SLOT: Slot = { h: 120, w: 120, x: 200, y: 200 } as Slot;

describe("Chuỗi emoji trong slot vẽ từng glyph, không bóp ngang", () => {
  it("5 emoji giống nhau thành 5 lệnh fillText, không maxWidth, cùng cỡ, lưới <= 3 cột", () => {
    const { calls, ctx } = createRecordingCtx();
    drawTextInSlot(ctx, "🍓🍓🍓🍓🍓", SLOT);
    expect(calls).toHaveLength(5);
    for (const call of calls) {
      expect(call.maxWidth).toBeUndefined();
      expect(call.text).toBe("🍓");
      expect(call.font).toBe(calls[0]?.font);
      expect(Math.abs(call.x - SLOT.x)).toBeLessThanOrEqual(SLOT.w / 2);
      expect(Math.abs(call.y - SLOT.y)).toBeLessThanOrEqual(SLOT.h / 2);
    }
    const perRow = new Map<number, number>();
    for (const call of calls) {
      const row = Math.round(call.y);
      perRow.set(row, (perRow.get(row) ?? 0) + 1);
    }
    expect(Math.max(...perRow.values())).toBeLessThanOrEqual(3);
  });

  it("<= 3 emoji: cỡ glyph >= 0.25 cạnh ô", () => {
    const { calls, ctx } = createRecordingCtx();
    drawTextInSlot(ctx, "🍑🍑🍑", SLOT);
    expect(calls).toHaveLength(3);
    for (const call of calls) {
      expect(call.maxWidth).toBeUndefined();
      expect(fontPx(call.font)).toBeGreaterThanOrEqual(0.25 * SLOT.w);
    }
  });

  it("chữ số '10' vẫn một lệnh, không maxWidth, >= mức đọc tối thiểu", () => {
    const { calls, ctx } = createRecordingCtx();
    drawTextInSlot(ctx, "10", SLOT);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.maxWidth).toBeUndefined();
    expect(fontPx(calls[0]?.font ?? "")).toBeGreaterThanOrEqual(
      minLegiblePx(DEFAULT_LOGIC_SPACE)
    );
  });

  it("nhãn chữ dài thu cỡ đồng đều, không maxWidth và vừa bề ngang ô", () => {
    const { calls, ctx } = createRecordingCtx();
    drawTextInSlot(ctx, LONG_LABEL, SLOT);
    expect(calls).toHaveLength(1);
    expect(calls[0]?.maxWidth).toBeUndefined();
    const size = fontPx(calls[0]?.font ?? "");
    expect(
      Array.from(LONG_LABEL).length * size * CHAR_WIDTH_RATIO
    ).toBeLessThanOrEqual(SLOT.w);
  });
});
