import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { completeDistinctLines, drawMatchGlow } from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT015_FIXTURES } from "#src/templates/GT-015/fixtures.js";
import { SudokuMiniSession } from "#src/templates/GT-015/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawMatchGlow: vi.fn(actual.drawMatchGlow) };
});

/** Hàng/cột sáng khi đủ và không trùng (`BR-E015-09`). */
const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: true,
  trayItems: 3,
  needsCommit: false,
});

function openSession(
  fixture: (typeof GT015_FIXTURES)[number]
): SudokuMiniSession {
  const session = new SudokuMiniSession(fixture.content, fixture.difficulty, 0);
  session.prepareRound(
    "5-6",
    DEFAULT_LOGIC_SPACE,
    ZONES.stage,
    ZONES.tray ?? undefined
  );
  return session;
}

function frame(
  session: SudokuMiniSession,
  rs: RenderSystem,
  timeMs: number
): void {
  vi.mocked(drawMatchGlow).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

function blanks(
  fixture: (typeof GT015_FIXTURES)[number]
): readonly { row: number; col: number }[] {
  return fixture.content.cells
    .filter((c) => c.symbol_id === null)
    .map((c) => ({ row: c.row, col: c.col }));
}

describe("completeDistinctLines (hàm thuần)", () => {
  const grid = [
    ["a", "b", "c"],
    ["b", "c", null],
    ["c", "c", "a"],
  ] as const;
  const at = (r: number, c: number): string | null => grid[r]?.[c] ?? null;

  it("hàng/cột đủ và không trùng mới tính; thiếu ô hoặc trùng thì không", () => {
    const lines = completeDistinctLines(3, at);
    expect(lines.rows).toEqual([0]);
    expect(lines.cols).toEqual([0]);
  });
});

describe("GT-015: hàng/cột sáng (BR-E015-09)", () => {
  it("mọi fixture: lúc mở bài chưa ô nào do trẻ điền thì không lớp sáng", () => {
    for (const fixture of GT015_FIXTURES) {
      const session = openSession(fixture);
      frame(session, new RenderSystem(), 0);
      expect(vi.mocked(drawMatchGlow)).not.toHaveBeenCalled();
    }
  });

  it("điền xong cả bài đúng thì mọi hàng và cột đều sáng; điền trùng thì hàng/cột bị trùng không sáng", () => {
    for (const fixture of GT015_FIXTURES) {
      const size = fixture.content.grid_size;
      const session = openSession(fixture);
      const cells = blanks(fixture);
      const symbols = fixture.content.symbols.map((s) => s.symbol_id);
      // Điền thử mọi cách; tìm nghiệm bằng cách thử từng ký hiệu cho từng ô trống.
      const solved = new Map<string, string>();
      const given = new Map(
        fixture.content.cells.flatMap((c) =>
          c.symbol_id ? [[`${c.row},${c.col}`, c.symbol_id] as const] : []
        )
      );
      const search = (i: number): boolean => {
        if (i === cells.length) {
          return true;
        }
        const cell = cells[i];
        if (!cell) {
          return false;
        }
        for (const sym of symbols) {
          const probe = (r: number, c: number): string | null =>
            solved.get(`${r},${c}`) ?? given.get(`${r},${c}`) ?? null;
          let ok = true;
          for (let k = 0; k < size; k++) {
            if (probe(cell.row, k) === sym || probe(k, cell.col) === sym) {
              ok = false;
            }
          }
          if (ok) {
            solved.set(`${cell.row},${cell.col}`, sym);
            if (search(i + 1)) {
              return true;
            }
            solved.delete(`${cell.row},${cell.col}`);
          }
        }
        return false;
      };
      expect(search(0), fixture.content.prompt).toBe(true);
      for (const cell of cells) {
        session.fillCell(
          cell.row,
          cell.col,
          solved.get(`${cell.row},${cell.col}`) ?? null
        );
      }
      frame(session, new RenderSystem(), 100);
      const lines = session.getCompleteLines();
      // Một hàng/cột đã đủ sẵn từ đầu bài (không có ô trẻ điền) không sáng.
      const rowsTouched = new Set(cells.map((c) => c.row));
      const colsTouched = new Set(cells.map((c) => c.col));
      expect(new Set(lines.rows)).toEqual(rowsTouched);
      expect(new Set(lines.cols)).toEqual(colsTouched);
      expect(vi.mocked(drawMatchGlow)).toHaveBeenCalledTimes(
        lines.rows.length + lines.cols.length
      );
    }
  });

  it("ô trẻ điền trùng ký hiệu: hàng chứa ô đó không sáng", () => {
    const fixture = GT015_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-015");
    }
    const session = openSession(fixture);
    const cell = blanks(fixture)[0];
    const sameRowGiven = fixture.content.cells.find(
      (c) => cell && c.row === cell.row && c.symbol_id !== null
    );
    if (!(cell && sameRowGiven?.symbol_id)) {
      throw new Error("Fixture thiếu ô cùng hàng");
    }
    session.fillCell(cell.row, cell.col, sameRowGiven.symbol_id);
    expect(session.getCompleteLines().rows).not.toContain(cell.row);
  });

  it("độ sáng đổi theo đồng hồ khung; reduced_motion đứng yên", () => {
    const fixture = GT015_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-015");
    }
    const session = openSession(fixture);
    // Điền bằng bộ nghiệm đơn giản: thử mọi ký hiệu cho tới khi có hàng sáng.
    for (const cell of blanks(fixture)) {
      for (const s of fixture.content.symbols) {
        session.fillCell(cell.row, cell.col, s.symbol_id);
        if (!session.isConflicted(cell.row, cell.col)) {
          break;
        }
      }
    }
    const seen = new Set<number>();
    for (const t of [0, 350, 700, 1050]) {
      frame(session, new RenderSystem(), t);
      const a = vi.mocked(drawMatchGlow).mock.calls[0]?.[2];
      if (a !== undefined) {
        seen.add(Math.round(a * 1000));
      }
    }
    expect(seen.size).toBeGreaterThan(1);
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(session, rs, 0);
    const a0 = vi.mocked(drawMatchGlow).mock.calls[0]?.[2];
    frame(session, rs, 500);
    expect(vi.mocked(drawMatchGlow).mock.calls[0]?.[2]).toBe(a0);
  });

  it("vùng chạm không đổi khi sáng", () => {
    for (const fixture of GT015_FIXTURES) {
      const session = openSession(fixture);
      const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
      frame(session, new RenderSystem(), 100);
      expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
        before
      );
    }
  });
});
