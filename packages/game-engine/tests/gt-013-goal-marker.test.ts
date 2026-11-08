import { describe, expect, it } from "vitest";
import {
  drawMazeGoalFlag,
  mazeCellCenter,
  mazeMetrics,
} from "#src/render/board-shapes";
import { designTokens } from "#src/systems/designTokens";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/**
 * Đích của mê cung phải khớp đề (`BR-E013-10`). Content không có trường nhân vật
 * hay vật ở đích, nên đích là lá cờ trung tính; phô mai cứng làm đề "cà rốt",
 * "ngôi nhà" nói một đằng bàn vẽ một nẻo.
 */
const HARD_CODED_GOAL = /thỏ|cà rốt|phô mai/i;
const BOX = { x: 40, y: 150, w: 400, h: 400 };

function record() {
  const ctx = createFakeCanvas(540, 960).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const fills: string[] = [];
  const points: Array<{ x: number; y: number }> = [];
  let depth = 0;
  const save = ctx.save?.bind(ctx);
  const restore = ctx.restore?.bind(ctx);
  ctx.save = () => {
    depth += 1;
    save?.();
  };
  ctx.restore = () => {
    depth -= 1;
    restore?.();
  };
  const grab = (x: number, y: number) => points.push({ x, y });
  ctx.moveTo = grab;
  ctx.lineTo = grab;
  ctx.fill = () => {
    fills.push(String(ctx.fillStyle));
  };
  return { ctx, fills, points, depth: () => depth };
}

describe("GT-013: đích trung tính (BR-E013-10)", () => {
  const grid = {
    rows: 4,
    cols: 4,
    walls: [],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
  };

  it("lá cờ nằm trọn trong ô đích, màu từ designTokens, không dùng vàng của phô mai", () => {
    const { ctx, fills, points, depth } = record();
    drawMazeGoalFlag(ctx as CanvasRenderingContext2D, grid, BOX);
    const m = mazeMetrics(grid, BOX);
    const c = mazeCellCenter(grid.goal, m);
    expect(points.length).toBeGreaterThan(2);
    for (const p of points) {
      expect(Math.abs(p.x - c.x)).toBeLessThanOrEqual(m.cellW / 2);
      expect(Math.abs(p.y - c.y)).toBeLessThanOrEqual(m.cellH / 2);
    }
    const tokens = new Set<string>(
      Object.values(designTokens.colors.montessori)
    );
    expect(fills.length).toBeGreaterThan(0);
    for (const f of fills) {
      expect(tokens.has(f)).toBe(true);
      expect(f).not.toBe(designTokens.colors.montessori.amber);
    }
    expect(depth()).toBe(0);
  });

  it("không còn hàm vẽ phô mai cứng", async () => {
    expect(Object.keys(await import("#src/render/board-shapes"))).not.toContain(
      "drawMazeCheese"
    );
  });

  it("đề mẫu không nhắc nhân vật hay vật mà bàn không vẽ", () => {
    for (const f of GT013_FIXTURES) {
      expect(f.content.prompt).not.toMatch(HARD_CODED_GOAL);
    }
  });
});
