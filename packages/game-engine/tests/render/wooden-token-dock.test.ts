import { describe, expect, it, vi } from "vitest";
import { TRAY_ZONE_H_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import {
  drawWoodenTokenDock,
  getWoodenTokenDockRect,
} from "#src/render/shared-render";
import { RenderSystem } from "#src/systems/render-system";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

interface RoundRectCall {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

/** Hộp bao mặt dock cộng tấm gỗ đáy (dời xuống bằng `translate`). */
function drawDockBounds(rect?: ZoneRect): ZoneRect {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Cannot get context from fake canvas");
  }
  const calls: RoundRectCall[] = [];
  let offsetY = 0;
  const stack: number[] = [];
  vi.spyOn(ctx, "save").mockImplementation(() => {
    stack.push(offsetY);
  });
  vi.spyOn(ctx, "restore").mockImplementation(() => {
    offsetY = stack.pop() ?? 0;
  });
  vi.spyOn(ctx, "translate").mockImplementation((_dx, dy) => {
    offsetY += dy;
  });
  vi.spyOn(ctx, "roundRect").mockImplementation((x, y, w, h) => {
    calls.push({ x, y: y + offsetY, w, h });
  });

  drawWoodenTokenDock(
    ctx as CanvasRenderingContext2D,
    new RenderSystem(),
    rect
  );

  const left = Math.min(...calls.map((c) => c.x));
  const top = Math.min(...calls.map((c) => c.y));
  const right = Math.max(...calls.map((c) => c.x + c.w));
  const bottom = Math.max(...calls.map((c) => c.y + c.h));
  return { x: left, y: top, w: right - left, h: bottom - top };
}

describe("drawWoodenTokenDock — khay chung nhận rect (Task #277 S5)", () => {
  it("vẽ trọn đúng rect được cấp, kể cả tấm gỗ đáy", () => {
    const tray: ZoneRect = { x: 16, y: 300, w: 700, h: 150 };
    expect(drawDockBounds(tray)).toEqual(tray);
  });

  it("chiều cao theo rect, không còn cứng 136", () => {
    const tray: ZoneRect = { x: 16, y: 400, w: 500, h: 180 };
    expect(drawDockBounds(tray).h).toBe(180);
  });

  it("không truyền rect thì rơi về toạ độ cũ, cao bằng TRAY_ZONE_H_PX", () => {
    const legacy = getWoodenTokenDockRect({ w: 960, h: 540 });
    expect(legacy.h).toBe(TRAY_ZONE_H_PX);
    expect(drawDockBounds()).toEqual(legacy);
  });
});
