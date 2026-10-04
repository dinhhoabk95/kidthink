import { describe, expect, it, vi } from "vitest";
import { RenderSystem } from "#src/systems/render-system";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures.js";
import { GT021Session } from "#src/templates/GT-021/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Nét đứt của trục đối xứng (`drawMirrorAxis`) — `setLineDash([12, 8])`. */
const AXIS_DASH = [12, 8];

function countAxisStrokes(showAxisGuide: boolean): number {
  const fixture = GT021_FIXTURES[1];
  if (!fixture) {
    throw new Error("Thiếu fixture GT-021");
  }
  const session = new GT021Session(fixture.content, {
    ...fixture.difficulty,
    show_axis_guide: showAxisGuide,
  });
  session.setupEntities();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const dashes: number[][] = [];
  vi.spyOn(ctx, "setLineDash").mockImplementation((segments) => {
    dashes.push([...segments]);
  });
  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
  return dashes.filter((d) => d[0] === AXIS_DASH[0] && d[1] === AXIS_DASH[1])
    .length;
}

describe("GT-021: đường trục dẫn theo show_axis_guide (BR-E021-04)", () => {
  it("bật thì vẽ đường trục", () => {
    expect(countAxisStrokes(true)).toBeGreaterThan(0);
  });

  it("tắt thì không vẽ đường trục", () => {
    expect(countAxisStrokes(false)).toBe(0);
  });
});
