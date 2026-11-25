import { describe, expect, it } from "vitest";
import type { Slot } from "#src/layout/types";
import { drawGlyphInSlot, isEmojiRun } from "#src/render/shared-slot-render";

const SLOT: Slot = {
  index: 0,
  page: 0,
  role: "source",
  x: 100,
  y: 100,
  w: 96,
  h: 96,
  hitW: 96,
  hitH: 96,
};

interface Point {
  readonly x: number;
  readonly y: number;
}

function recordGlyphs(text: string): Point[] {
  const points: Point[] = [];
  const noop = (): void => undefined;
  const target = {
    fillText: (_t: string, x: number, y: number): void => {
      points.push({ x, y });
    },
    drawImage: (_i: unknown, x: number, y: number, w: number): void => {
      points.push({ x: x + w / 2, y });
    },
  };
  const ctx = new Proxy(target, {
    get: (t, key: string) => (key in t ? t[key as keyof typeof t] : noop),
    set: () => true,
  });
  drawGlyphInSlot(ctx as unknown as CanvasRenderingContext2D, text, SLOT);
  return points;
}

describe("GT-008: chuỗi nhiều emoji là số lượng vật, xếp lưới đếm được", () => {
  it("isEmojiRun nhận chuỗi từ hai emoji, từ chối chữ và số", () => {
    expect(isEmojiRun("⚙️⚙️⚙️⚙️⚙️")).toBe(true);
    expect(isEmojiRun("🍎🍎")).toBe(true);
    expect(isEmojiRun("⚙️")).toBe(false);
    expect(isEmojiRun("12")).toBe(false);
    expect(isEmojiRun("hai bánh răng")).toBe(false);
    expect(isEmojiRun("⚙️ 3")).toBe(false);
  });

  it("năm bánh răng xếp thành hai hàng, mỗi vật một vị trí riêng", () => {
    const points = recordGlyphs("⚙️⚙️⚙️⚙️⚙️");
    expect(points).toHaveLength(5);
    expect(new Set(points.map((p) => p.y)).size).toBeGreaterThanOrEqual(2);
    expect(new Set(points.map((p) => `${p.x}:${p.y}`)).size).toBe(5);
  });
});
