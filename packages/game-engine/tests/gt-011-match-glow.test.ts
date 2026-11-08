import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawMatchGlow,
  MATCH_GLOW_MS,
  matchGlowAlpha,
} from "#src/render/craft-shapes";
import { drawRoundedBoxOutline } from "#src/render/slot-decor";
import { RenderSystem } from "#src/systems/render-system";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures.js";
import { GT011Session } from "#src/templates/GT-011/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawMatchGlow: vi.fn(actual.drawMatchGlow) };
});
vi.mock("#src/render/slot-decor", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/slot-decor")>();
  return {
    ...actual,
    drawRoundedBoxOutline: vi.fn(actual.drawRoundedBoxOutline),
  };
});

/** Hàng/cột sáng khi phương án thử khớp (`BR-E011-06`). */
const FIXTURE = GT011_FIXTURES[0] ?? failMissingFixture();
const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: false,
});

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-011");
}

function openSession(fixture = FIXTURE): GT011Session {
  const session = new GT011Session(fixture.content, fixture.difficulty, 0);
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage);
  return session;
}

function frame(session: GT011Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawMatchGlow).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

describe("matchGlowAlpha (hàm thuần)", () => {
  it("dao động trong (0.1, 0.35), tuần hoàn theo MATCH_GLOW_MS", () => {
    for (let t = 0; t <= MATCH_GLOW_MS; t += 100) {
      const a = matchGlowAlpha(t, false);
      expect(a).toBeGreaterThan(0.1);
      expect(a).toBeLessThan(0.35);
    }
    expect(matchGlowAlpha(210, false)).toBeCloseTo(
      matchGlowAlpha(210 + MATCH_GLOW_MS, false),
      9
    );
  });

  it("reduced-motion: một mức không đổi", () => {
    expect(matchGlowAlpha(0, true)).toBe(matchGlowAlpha(777, true));
  });
});

describe("GT-011: hàng/cột sáng khi khớp (BR-E011-06)", () => {
  it("chưa thử phương án nào: không sáng", () => {
    const session = openSession();
    frame(session, new RenderSystem(), 0);
    expect(vi.mocked(drawMatchGlow)).not.toHaveBeenCalled();
  });

  it("mọi fixture, mọi phương án: số lớp sáng bằng số chiều khớp (hàng, cột) — cùng một luật, không đọc cờ đúng/sai", () => {
    for (const fixture of GT011_FIXTURES) {
      for (const opt of fixture.content.options) {
        const session = openSession(fixture);
        const preview = session.onOptionPreviewed(opt.option_id);
        frame(session, new RenderSystem(), 100);
        const expected =
          Number(preview?.row_matches === true) +
          Number(preview?.col_matches === true);
        expect(vi.mocked(drawMatchGlow)).toHaveBeenCalledTimes(expected);
      }
    }
  });

  it("mọi fixture: lớp sáng không thêm tín hiệu ngoài viền xem thử đã có (BR-MTB-14)", () => {
    for (const fixture of GT011_FIXTURES) {
      for (const opt of fixture.content.options) {
        const session = openSession(fixture);
        session.onOptionPreviewed(opt.option_id);
        vi.mocked(drawRoundedBoxOutline).mockClear();
        frame(session, new RenderSystem(), 100);
        // Mỗi lớp sáng đi kèm đúng một viền hàng/cột đã có trước Đợt A.
        expect(vi.mocked(drawMatchGlow).mock.calls.length).toBe(
          vi.mocked(drawRoundedBoxOutline).mock.calls.length
        );
      }
    }
  });

  it("độ sáng đổi theo đồng hồ khung, khớp mọi phương án như nhau", () => {
    const opt = FIXTURE.content.options.find((o) => {
      const s = openSession();
      const p = s.onOptionPreviewed(o.option_id);
      return p?.row_matches || p?.col_matches;
    });
    if (!opt) {
      throw new Error("Fixture không có phương án khớp hàng/cột");
    }
    const session = openSession();
    session.onOptionPreviewed(opt.option_id);
    const seen = new Set<number>();
    for (const t of [0, 350, 700, 1050]) {
      frame(session, new RenderSystem(), t);
      const alpha = vi.mocked(drawMatchGlow).mock.calls[0]?.[2];
      if (alpha !== undefined) {
        seen.add(Math.round(alpha * 1000));
      }
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it("reduced-motion: độ sáng đứng yên", () => {
    const opt = FIXTURE.content.options.find((o) => {
      const s = openSession();
      const p = s.onOptionPreviewed(o.option_id);
      return p?.row_matches || p?.col_matches;
    });
    if (!opt) {
      throw new Error("Fixture không có phương án khớp hàng/cột");
    }
    const session = openSession();
    session.onOptionPreviewed(opt.option_id);
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(session, rs, 0);
    const a = vi.mocked(drawMatchGlow).mock.calls[0]?.[2];
    frame(session, rs, 500);
    expect(vi.mocked(drawMatchGlow).mock.calls[0]?.[2]).toBe(a);
  });

  it("vùng chạm không đổi khi sáng", () => {
    const session = openSession();
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    const opt = FIXTURE.content.options[0];
    if (opt) {
      session.onOptionPreviewed(opt.option_id);
    }
    frame(session, new RenderSystem(), 100);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });
});
