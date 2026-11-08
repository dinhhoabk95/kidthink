import { describe, expect, it } from "vitest";
import {
  drawMazeGoalFlag,
  mazeCellCenter,
  mazeMetrics,
} from "#src/render/board-shapes";
import { designTokens } from "#src/systems/designTokens";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures";
import { GT013Session } from "#src/templates/GT-013/session";
import { GT013ContentSchema } from "#src/templates/GT-013/template";
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

interface TextCall {
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

function recordWithText() {
  const base = record();
  const texts: TextCall[] = [];
  base.ctx.fillText = (text: string, x: number, y: number) => {
    texts.push({ text, x, y });
  };
  base.ctx.rect = (x: number, y: number, w: number, h: number) => {
    base.points.push({ x, y }, { x: x + w, y: y + h });
  };
  return { ...base, texts };
}

describe("GT-013: lá cờ mang số khi đề gọi 'lá cờ số N' (BR-E013-11)", () => {
  const grid = {
    rows: 4,
    cols: 4,
    walls: [],
    start: { row: 0, col: 0 },
    goal: { row: 3, col: 3 },
  };

  it("có goal_glyph: vẽ đúng con số đó, cờ và số nằm trọn trong ô đích", () => {
    const { ctx, points, texts, depth } = recordWithText();
    drawMazeGoalFlag(ctx as CanvasRenderingContext2D, grid, BOX, "7");
    const m = mazeMetrics(grid, BOX);
    const c = mazeCellCenter(grid.goal, m);
    expect(texts.map((t) => t.text)).toEqual(["7"]);
    for (const p of [...points, ...texts]) {
      expect(Math.abs(p.x - c.x)).toBeLessThanOrEqual(m.cellW / 2);
      expect(Math.abs(p.y - c.y)).toBeLessThanOrEqual(m.cellH / 2);
    }
    expect(depth()).toBe(0);
  });

  it("không có goal_glyph: cờ trung tính, không vẽ chữ hay số nào", () => {
    const { ctx, texts } = recordWithText();
    drawMazeGoalFlag(ctx as CanvasRenderingContext2D, grid, BOX);
    expect(texts).toEqual([]);
  });

  it("contract chỉ nhận con số làm goal_glyph", () => {
    const base = GT013_FIXTURES[0]?.content;
    if (!base) {
      throw new Error("Thiếu fixture GT-013");
    }
    expect(
      GT013ContentSchema.safeParse({ ...base, goal_glyph: "5" }).success
    ).toBe(true);
    for (const bad of ["", "🥕", "a", "item_1", "123"]) {
      expect(
        GT013ContentSchema.safeParse({ ...base, goal_glyph: bad }).success,
        bad
      ).toBe(false);
    }
  });

  it("ô đích đọc 'lá cờ số N' cho trình đọc màn hình; ô khác không nhắc số", () => {
    const fixture = GT013_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-013");
    }
    const session = new GT013Session(
      { ...fixture.content, goal_glyph: "4" },
      fixture.difficulty
    );
    session.setupEntities();
    session.prepareRound("4-5");
    const { goal } = fixture.content.grid;
    const entities = session.getView().entities;
    const goalCell = entities.find(
      (e) => e.id === `cell_${goal.row}_${goal.col}`
    );
    expect(entities.length).toBeGreaterThan(1);
    expect(goalCell?.spokenLabel).toContain("lá cờ số 4");
    for (const e of entities) {
      if (e !== goalCell) {
        expect(e.spokenLabel ?? "").not.toContain("lá cờ số");
      }
    }
  });
});
