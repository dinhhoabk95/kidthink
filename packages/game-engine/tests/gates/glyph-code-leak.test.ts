import { describe, expect, it } from "vitest";
import type { Slot } from "#src/layout/types";
import { drawGlyphInSlot, setEmojiResolver } from "#src/render/index.js";

/**
 * Cổng: mã `EMJ-*` cấm — NEVER hiện thành chữ trên màn của trẻ.
 *
 * Chụp thật ngày 2026-09-01 bắt được `GT-004` in `⚽` và `👦` to
 * bằng nửa màn, vì `session.ts` truyền `group.label_emoji` (một **mã**) thẳng
 * vào `drawGlyphInSlot`. Trẻ 3-6 chưa đọc được chữ, nên đây là lỗi hiển thị
 * nặng chứ không phải lỗi thẩm mỹ.
 */

interface DrawCall {
  kind: "fillText" | "fillRect";
  text?: string;
}

function fakeCtx(calls: DrawCall[]) {
  return {
    fillRect: () => calls.push({ kind: "fillRect" }),
    fillText: (text: string) => calls.push({ kind: "fillText", text }),
    restore: () => undefined,
    save: () => undefined,
    strokeRect: () => undefined,
    fillStyle: "",
    font: "",
    lineWidth: 0,
    strokeStyle: "",
    textAlign: "",
    textBaseline: "",
  } as unknown as CanvasRenderingContext2D;
}

const slot: Slot = {
  h: 100,
  hitH: 100,
  hitW: 100,
  index: 0,
  page: 0,
  role: "neutral",
  w: 100,
  x: 100,
  y: 100,
};

describe("cổng rò mã emoji ra màn", () => {
  it("mã phân giải được thì vẽ ký tự, không vẽ mã", () => {
    const calls: DrawCall[] = [];
    setEmojiResolver((code) => (code === "🍎" ? "🍎" : null));

    drawGlyphInSlot(fakeCtx(calls), "🍎", slot);
    setEmojiResolver(null);

    const texts = calls.filter((c) => c.kind === "fillText").map((c) => c.text);
    expect(texts).toEqual(["🍎"]);
    expect(texts.some((t) => t?.startsWith("EMJ-"))).toBe(false);
  });

  // Ca âm: mã KHÔNG phân giải được. Bản lỗi in thẳng mã ra; bản đúng vẽ ô thay thế.
  it("ca âm — mã không phân giải được thì vẽ ô thay thế, cấm in mã", () => {
    const calls: DrawCall[] = [];
    setEmojiResolver(() => null);

    drawGlyphInSlot(fakeCtx(calls), "EMJ-khong-ton-tai-abc", slot);
    setEmojiResolver(null);

    const texts = calls.filter((c) => c.kind === "fillText").map((c) => c.text);
    expect(texts).toHaveLength(0);
    expect(calls.some((c) => c.kind === "fillRect")).toBe(true);
  });

  it("ký tự emoji thật đi thẳng, không bị coi là mã", () => {
    const calls: DrawCall[] = [];
    drawGlyphInSlot(fakeCtx(calls), "🐦", slot);

    expect(
      calls.filter((c) => c.kind === "fillText").map((c) => c.text)
    ).toEqual(["🐦"]);
  });
});
