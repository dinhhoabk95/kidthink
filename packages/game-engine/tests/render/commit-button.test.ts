import { describe, expect, it, vi } from "vitest";
import { drawCommitButton } from "#src/render/commit-button";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

function fakeContext(): CanvasRenderingContext2D {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Cannot get context from fake canvas");
  }
  return ctx as CanvasRenderingContext2D;
}

describe("drawCommitButton — nút nộp bài chỉ có icon (#279, BR-FBK-12, BR-PSZ-07)", () => {
  const rect = { x: 380, y: 440, w: 200, h: 96 };

  it("vẽ dấu ✓ bằng nét, không vẽ chữ trẻ phải đọc", () => {
    const ctx = fakeContext();
    const fillText = vi.spyOn(ctx, "fillText");
    const lineTo = vi.spyOn(ctx, "lineTo");

    drawCommitButton(ctx, new RenderSystem(), rect, {
      enabled: true,
      origin: "top-left",
    });

    expect(fillText).not.toHaveBeenCalled();
    expect(lineTo).toHaveBeenCalled();
  });

  it("dấu ✓ nằm trọn trong nút", () => {
    const ctx = fakeContext();
    const points: Array<{ x: number; y: number }> = [];
    vi.spyOn(ctx, "moveTo").mockImplementation((x, y) => {
      points.push({ x, y });
    });
    vi.spyOn(ctx, "lineTo").mockImplementation((x, y) => {
      points.push({ x, y });
    });

    drawCommitButton(ctx, new RenderSystem(), rect, {
      enabled: false,
      origin: "top-left",
    });

    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(rect.x);
      expect(p.x).toBeLessThanOrEqual(rect.x + rect.w);
      expect(p.y).toBeGreaterThanOrEqual(rect.y);
      expect(p.y).toBeLessThanOrEqual(rect.y + rect.h);
    }
  });
});
