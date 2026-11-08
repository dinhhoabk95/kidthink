import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawMazeFootprints,
  drawMazeGoalFlag,
  MAZE_FOOTPRINTS_PER_STEP,
  mazeFootprints,
} from "#src/render/board-shapes";
import { boxFromSlots } from "#src/render/shared-render-shapes";
import { findPath, type MazeCell } from "#src/systems/maze-system";
import { RenderSystem } from "#src/systems/render-system";
import { GT013_FIXTURES } from "#src/templates/GT-013/fixtures.js";
import { GT013Session } from "#src/templates/GT-013/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/board-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/board-shapes")>();
  return {
    ...actual,
    drawMazeGoalFlag: vi.fn(actual.drawMazeGoalFlag),
    drawMazeFootprints: vi.fn(actual.drawMazeFootprints),
  };
});

/** Lá cờ ở đích (`BR-E013-10`, thay phô mai) và dấu chân trên đường đã đi (`BR-E013-09`). */
const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "4-5",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: false,
});

function openSession(fixture: (typeof GT013_FIXTURES)[number]): GT013Session {
  const session = new GT013Session(fixture.content, fixture.difficulty, 0);
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, ZONES.stage);
  return session;
}

function frame(session: GT013Session, timeMs: number, reduced = false): void {
  vi.mocked(drawMazeGoalFlag).mockClear();
  vi.mocked(drawMazeFootprints).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

describe("GT-013: cờ ở đích và dấu chân (BR-E013-09, BR-E013-10)", () => {
  it("mọi fixture: lá cờ vẽ đúng một lần ở ô đích, ngay từ đầu", () => {
    for (const fixture of GT013_FIXTURES) {
      const session = openSession(fixture);
      frame(session, 0);
      expect(vi.mocked(drawMazeGoalFlag)).toHaveBeenCalledTimes(1);
      expect(vi.mocked(drawMazeGoalFlag).mock.calls[0]?.[1]).toBe(
        fixture.content.grid
      );
    }
  });

  it("chưa đi bước nào: không dấu chân", () => {
    for (const fixture of GT013_FIXTURES) {
      const box = boxFromSlots(openSession(fixture).slots);
      if (!box) {
        throw new Error("Thiếu bàn cờ");
      }
      expect(
        mazeFootprints(fixture.content.grid, box, [fixture.content.grid.start])
      ).toHaveLength(0);
    }
  });

  it("dấu chân chỉ nằm trên đoạn đã đi: số dấu = số bước × MAZE_FOOTPRINTS_PER_STEP, lùi thì bớt", () => {
    for (const fixture of GT013_FIXTURES) {
      const grid = fixture.content.grid;
      const route = findPath(grid, grid.start, grid.goal);
      if (!route) {
        throw new Error("Fixture không có đường");
      }
      const session = openSession(fixture);
      const box = boxFromSlots(session.slots);
      if (!box) {
        throw new Error("Thiếu bàn cờ");
      }
      const walked: MazeCell[] = [grid.start];
      for (const cell of route.slice(1, 3)) {
        expect(session.onPathStep(cell).status).toBe("moved");
        walked.push(cell);
        frame(session, 0);
        expect(vi.mocked(drawMazeFootprints)).toHaveBeenCalledTimes(1);
        expect(mazeFootprints(grid, box, session.getPath())).toHaveLength(
          (walked.length - 1) * MAZE_FOOTPRINTS_PER_STEP
        );
      }
      // Lùi một ô: dấu chân của đoạn vừa gỡ biến mất.
      const back = walked.at(-2);
      if (back) {
        session.onPathStep(back);
        expect(mazeFootprints(grid, box, session.getPath())).toHaveLength(
          (walked.length - 2) * MAZE_FOOTPRINTS_PER_STEP
        );
      }
    }
  });

  it("đụng tường không để lại dấu chân và không đổi nét vẽ", () => {
    const fixture = GT013_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-013");
    }
    const session = openSession(fixture);
    const box = boxFromSlots(session.slots);
    if (!box) {
      throw new Error("Thiếu bàn cờ");
    }
    expect(session.onPathStep({ row: 0, col: 1 }).status).toBe("blocked");
    expect(
      mazeFootprints(fixture.content.grid, box, session.getPath())
    ).toHaveLength(0);
  });

  it("dấu chân là hình tĩnh: giống hệt ở mọi thời điểm và khi reduced_motion", () => {
    const fixture = GT013_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-013");
    }
    const session = openSession(fixture);
    session.onPathStep({ row: 1, col: 0 });
    frame(session, 0);
    const a = vi.mocked(drawMazeFootprints).mock.calls[0]?.slice(1);
    frame(session, 900, true);
    expect(vi.mocked(drawMazeFootprints).mock.calls[0]?.slice(1)).toEqual(a);
  });

  it("vùng chạm không đổi khi vẽ", () => {
    for (const fixture of GT013_FIXTURES) {
      const session = openSession(fixture);
      const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
      frame(session, 100);
      expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
        before
      );
    }
  });
});
