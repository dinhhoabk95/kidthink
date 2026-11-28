import { describe, expect, it, vi } from "vitest";
import { drawGT028RunningTotalBadge } from "#src/render/gt-028-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas } from "../gates/fake-canvas.ts";
import { drawLegacyBadge } from "./fixtures/gt-028-badge-legacy-order";

interface TextDraw {
  readonly bg: string;
  readonly text: string;
}

function makeCtx(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Cannot get context from fake canvas");
  }
  return ctx as CanvasRenderingContext2D;
}

/** Ghi màu `fillStyle` lúc `fillText` và màu của lần `fill` gần nhất (nền). */
function trackTextVsBackground(ctx: CanvasRenderingContext2D): TextDraw[] {
  const draws: TextDraw[] = [];
  let lastFill = "";
  vi.spyOn(ctx, "fill").mockImplementation(() => {
    lastFill = String(ctx.fillStyle);
  });
  vi.spyOn(ctx, "fillText").mockImplementation(() => {
    draws.push({ text: String(ctx.fillStyle), bg: lastFill });
  });
  return draws;
}

describe("GT-028 ô số tích luỹ — chữ không trùng màu nền (BR-E028-14)", () => {
  const rs = new RenderSystem();
  const base = {
    clip: { x: 0, y: 0, w: 960, h: 540 },
    displayedTotal: 6,
    isCounting: true,
    scalePulse: 0,
    shadowsOff: true,
    wrongProgress: null,
  } as const;

  it.each([
    ["đang đếm", { ...base, isWon: false }],
    ["thắng", { ...base, isWon: true }],
    ["nộp sai", { ...base, isWon: false, wrongProgress: 0.3 }],
  ])("%s: fillStyle lúc fillText khác màu nền", (_n, params) => {
    const ctx = makeCtx();
    const draws = trackTextVsBackground(ctx);
    drawGT028RunningTotalBadge(ctx, rs, params);
    expect(draws).toHaveLength(1);
    expect(draws[0]?.text).not.toBe(draws[0]?.bg);
  });

  it("ca âm: thứ tự vẽ cũ (font → tô nền → fillText) bị báo trùng màu", () => {
    const ctx = makeCtx();
    const draws = trackTextVsBackground(ctx);
    drawLegacyBadge(ctx, "#111111", "#eeeeee");
    expect(draws[0]?.text).toBe(draws[0]?.bg);
  });
});
