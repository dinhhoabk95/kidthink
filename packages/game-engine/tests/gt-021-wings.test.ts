import { describe, expect, it } from "vitest";
import { drawButterflyWingsBoard } from "#src/render/shared-render-shapes";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Cánh bướm: mỗi cánh một nét riêng, tỉ lệ giữ, nằm trong vùng (`BR-E021-09`). */
interface EllipseCall {
  readonly cx: number;
  readonly cy: number;
  readonly rot: number;
  readonly rx: number;
  readonly ry: number;
}

function record(box: { x: number; y: number; w: number; h: number }) {
  const ctx = createFakeCanvas(1280, 800).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const ops: string[] = [];
  let depth = 0;
  const saveFn = ctx.save?.bind(ctx);
  const restoreFn = ctx.restore?.bind(ctx);
  ctx.save = () => {
    depth += 1;
    saveFn?.();
  };
  ctx.restore = () => {
    depth -= 1;
    restoreFn?.();
  };
  const ellipses: EllipseCall[] = [];
  ctx.moveTo = () => {
    ops.push("moveTo");
  };
  ctx.ellipse = (cx, cy, rx, ry, rot) => {
    ops.push("ellipse");
    ellipses.push({ cx, cy, rx, ry, rot });
  };
  drawButterflyWingsBoard(ctx as CanvasRenderingContext2D, box);
  return { ops, ellipses, depth };
}

const BOXES = [
  { x: 20, y: 230, w: 1240, h: 310 }, // stage dẹt trên desktop
  { x: 10, y: 120, w: 370, h: 580 }, // điện thoại dọc
  { x: 0, y: 0, w: 600, h: 600 },
];

describe("GT-021: cánh bướm (BR-E021-09)", () => {
  it("save/restore cân bằng, nét đứt của trục không rò sang phần vẽ sau", () => {
    for (const box of BOXES) {
      expect(record(box).depth).toBe(0);
    }
  });

  it("mỗi ellipse bắt đầu bằng moveTo, không nét nối thừa giữa các cánh", () => {
    for (const box of BOXES) {
      const { ops } = record(box);
      const firstEllipse = ops.indexOf("ellipse");
      expect(firstEllipse).toBeGreaterThan(-1);
      ops.forEach((op, i) => {
        if (op === "ellipse") {
          expect(ops[i - 1]).toBe("moveTo");
        }
      });
    }
  });

  it("bốn cánh nằm trọn trong vùng, tỉ lệ rộng/cao không vượt 1,1", () => {
    for (const box of BOXES) {
      const { ellipses } = record(box);
      expect(ellipses).toHaveLength(4);
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      for (const e of ellipses) {
        const hw = Math.hypot(e.rx * Math.cos(e.rot), e.ry * Math.sin(e.rot));
        const hh = Math.hypot(e.rx * Math.sin(e.rot), e.ry * Math.cos(e.rot));
        minX = Math.min(minX, e.cx - hw);
        maxX = Math.max(maxX, e.cx + hw);
        minY = Math.min(minY, e.cy - hh);
        maxY = Math.max(maxY, e.cy + hh);
      }
      expect(minX).toBeGreaterThanOrEqual(box.x);
      expect(maxX).toBeLessThanOrEqual(box.x + box.w);
      expect(minY).toBeGreaterThanOrEqual(box.y);
      expect(maxY).toBeLessThanOrEqual(box.y + box.h);
      expect((maxX - minX) / (maxY - minY)).toBeLessThanOrEqual(1.1);
    }
  });
});
