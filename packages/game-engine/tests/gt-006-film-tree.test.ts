import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawFilmFrameGlow,
  drawGrowingTree,
  FILM_STEP_MS,
  filmPlayback,
  treeGrowth,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT006_FIXTURES } from "#src/templates/GT-006/fixtures.js";
import { GT006Session } from "#src/templates/GT-006/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawFilmFrameGlow: vi.fn(actual.drawFilmFrameGlow),
    drawGrowingTree: vi.fn(actual.drawGrowingTree),
  };
});

/** Cuộn phim tự chạy và cây lớn dần khi xếp đúng (`BR-E006-06`). */
const FIXTURE = GT006_FIXTURES[0] ?? failMissingFixture();
const COUNT = FIXTURE.content.sequence.length;
const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: true,
});

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-006");
}

function openSession(): GT006Session {
  const session = new GT006Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage);
  return session;
}

function solve(session: GT006Session): void {
  const target = FIXTURE.content.sequence
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((s) => s.step_id);
  for (let i = 0; i < target.length; i++) {
    const current = session.getCurrentSequence();
    const j = current.indexOf(target[i] ?? "");
    if (j !== i) {
      session.commit({
        type: "reorder_step",
        data: { from_index: j, to_index: i },
      });
    }
  }
}

function frame(session: GT006Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawFilmFrameGlow).mockClear();
  vi.mocked(drawGrowingTree).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

describe("filmPlayback / treeGrowth (hàm thuần)", () => {
  it("thẻ đầu sáng ngay, mỗi nhịp sáng thêm một thẻ theo thứ tự", () => {
    expect(filmPlayback(4, 0, false)).toEqual({ lit: 1, playhead: 0 });
    expect(filmPlayback(4, FILM_STEP_MS, false)).toEqual({
      lit: 2,
      playhead: 1,
    });
    expect(filmPlayback(4, FILM_STEP_MS * 3.5, false)).toEqual({
      lit: 4,
      playhead: 3,
    });
  });

  it("chiếu xong thì mọi thẻ sáng và hết đầu chiếu; không bao giờ vượt số thẻ", () => {
    expect(filmPlayback(3, FILM_STEP_MS * 10, false)).toEqual({
      lit: 3,
      playhead: null,
    });
  });

  it("reduced-motion: trạng thái tĩnh cuối ngay; không có thẻ thì rỗng", () => {
    expect(filmPlayback(3, 0, true)).toEqual({ lit: 3, playhead: null });
    expect(filmPlayback(0, 100, false)).toEqual({ lit: 0, playhead: null });
    expect(filmPlayback(3, -5, false)).toEqual({ lit: 0, playhead: null });
  });

  it("cây lớn đơn điệu từ 0 tới 1", () => {
    expect(treeGrowth(0, 4)).toBe(0);
    expect(treeGrowth(2, 4)).toBe(0.5);
    expect(treeGrowth(4, 4)).toBe(1);
    expect(treeGrowth(9, 4)).toBe(1);
    expect(treeGrowth(1, 0)).toBe(0);
  });
});

describe("GT-006: cuộn phim và cây sau khi xếp đúng (BR-E006-06)", () => {
  it("trước khi thắng không vẽ khung sáng hay cây (không lộ thứ tự đúng)", () => {
    const session = openSession();
    frame(session, new RenderSystem(), 1000);
    expect(vi.mocked(drawFilmFrameGlow)).not.toHaveBeenCalled();
    expect(vi.mocked(drawGrowingTree)).not.toHaveBeenCalled();
  });

  it("nộp sai: vẫn không có khung sáng, cây", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    session.onSubmitSequence();
    frame(session, rs, 1100);
    expect(session.checkWinCondition()).toBe(false);
    expect(vi.mocked(drawFilmFrameGlow)).not.toHaveBeenCalled();
  });

  it("thắng: khung sáng dần từng thẻ theo đồng hồ khung, cây lớn dần", () => {
    const session = openSession();
    const rs = new RenderSystem();
    solve(session);
    frame(session, rs, 1000);
    session.onSubmitSequence();
    expect(session.checkWinCondition()).toBe(true);
    const lits: number[] = [];
    const growth: number[] = [];
    for (let i = 0; i <= COUNT; i++) {
      frame(session, rs, 1000 + i * FILM_STEP_MS);
      lits.push(vi.mocked(drawFilmFrameGlow).mock.calls.length);
      growth.push(vi.mocked(drawGrowingTree).mock.calls[0]?.[4] ?? -1);
    }
    expect(lits[0]).toBe(1);
    expect(lits[COUNT]).toBe(COUNT);
    for (let i = 1; i < lits.length; i++) {
      expect(lits[i]).toBeGreaterThanOrEqual(lits[i - 1] ?? 0);
    }
    expect(growth[0]).not.toBe(-1);
    expect(growth[COUNT]).toBe(1);
    expect(growth[0]).toBeLessThan(growth[COUNT] ?? 0);
  });

  it("reduced-motion: ngay khung đầu đã sáng đủ và cây trọn", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    solve(session);
    frame(session, rs, 1000);
    session.onSubmitSequence();
    frame(session, rs, 1010);
    expect(vi.mocked(drawFilmFrameGlow).mock.calls).toHaveLength(COUNT);
    expect(vi.mocked(drawGrowingTree).mock.calls[0]?.[4]).toBe(1);
  });

  it("vùng chạm không đổi khi cuộn phim chạy", () => {
    const session = openSession();
    solve(session);
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    frame(session, new RenderSystem(), 1000);
    session.onSubmitSequence();
    frame(session, new RenderSystem(), 1500);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });
});
