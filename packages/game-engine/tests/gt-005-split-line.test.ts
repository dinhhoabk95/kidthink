import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawSplitLine,
  drawStoryCharacterInStage,
  LINE_SPLIT_MS,
  placeStoryCharacter,
  STORY_CHARACTER_SIZE_PX,
  splitLineSegments,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT005_FIXTURES } from "#src/templates/GT-005/fixtures.js";
import { GT005Session } from "#src/templates/GT-005/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawSplitLine: vi.fn(actual.drawSplitLine),
    drawStoryCharacterInStage: vi.fn(actual.drawStoryCharacterInStage),
  };
});

/** Dây phơi tách đôi khi cặp chưa đúng và Sóc Nâu vẽ vector (`BR-E005-05`). */
const FIXTURE = GT005_FIXTURES[0] ?? failMissingFixture();
const PAIRS = FIXTURE.content.pairs;
const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: false,
});

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-005");
}

function openSession(): GT005Session {
  const session = new GT005Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage);
  return session;
}

function match(session: GT005Session, left: number, right: number): void {
  session.commit({
    type: "match_pair",
    data: {
      left_item_id: PAIRS[left]?.left.item_id,
      right_item_id: PAIRS[right]?.right.item_id,
    },
  });
}

function frame(session: GT005Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawSplitLine).mockClear();
  vi.mocked(drawStoryCharacterInStage).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

describe("splitLineSegments (hàm thuần)", () => {
  const A = { x: 0, y: 0 };
  const B = { x: 100, y: 40 };

  it("đầu nhịp hai nửa gần gặp nhau, cuối nhịp co hẳn về hai đầu", () => {
    const start = splitLineSegments(A, B, 0, false);
    expect(start).not.toBeNull();
    if (start) {
      expect(start[0].x2).toBeCloseTo(50, 6);
      expect(start[1].x2).toBeCloseTo(50, 6);
    }
    const late = splitLineSegments(A, B, LINE_SPLIT_MS - 1, false);
    if (late) {
      expect(Math.abs(late[0].x2 - A.x)).toBeLessThan(2);
      expect(Math.abs(late[1].x2 - B.x)).toBeLessThan(2);
    }
  });

  it("khe giữa rộng dần theo thời gian", () => {
    const gap = (ms: number): number => {
      const s = splitLineSegments(A, B, ms, false);
      return s ? Math.abs(s[1].x2 - s[0].x2) : Number.NaN;
    };
    expect(gap(300)).toBeGreaterThan(gap(100));
  });

  it("hết nhịp, trước nhịp hoặc reduced-motion: không còn dây", () => {
    expect(splitLineSegments(A, B, LINE_SPLIT_MS, false)).toBeNull();
    expect(splitLineSegments(A, B, -1, false)).toBeNull();
    expect(splitLineSegments(A, B, 100, true)).toBeNull();
  });
});

describe("GT-005: dây tách đôi và Sóc Nâu (BR-E005-05)", () => {
  it("nối sai: dây tách đôi trong LINE_SPLIT_MS theo đồng hồ khung rồi hết", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    expect(vi.mocked(drawSplitLine)).not.toHaveBeenCalled();
    match(session, 0, 1);
    frame(session, rs, 1100);
    expect(vi.mocked(drawSplitLine)).toHaveBeenCalledTimes(1);
    frame(session, rs, 1000 + LINE_SPLIT_MS + 20);
    expect(vi.mocked(drawSplitLine)).not.toHaveBeenCalled();
  });

  it("nối đúng: không có dây tách", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    match(session, 0, 0);
    frame(session, rs, 1100);
    expect(vi.mocked(drawSplitLine)).not.toHaveBeenCalled();
  });

  it("reduced-motion: không vẽ dây tách", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(session, rs, 1000);
    match(session, 0, 1);
    frame(session, rs, 1100);
    expect(vi.mocked(drawSplitLine)).not.toHaveBeenCalled();
  });

  it("Sóc Nâu vẽ một lần ở góc trống, không chồng lên vùng chạm nào", () => {
    const session = openSession();
    frame(session, new RenderSystem(), 0);
    const calls = vi.mocked(drawStoryCharacterInStage).mock.calls;
    expect(calls).toHaveLength(1);
    const [, kind, stage, slots] = calls[0] ?? [];
    expect(kind).toBe("squirrel");
    expect(slots).toBe(session.slots);
    const spot = placeStoryCharacter(stage, session.slots);
    expect(spot).not.toBeNull();
    if (!spot) {
      return;
    }
    const half = STORY_CHARACTER_SIZE_PX / 2;
    for (const s of session.slots) {
      const overlap =
        spot.cx + half > s.x - s.hitW / 2 &&
        spot.cx - half < s.x + s.hitW / 2 &&
        spot.cy + half > s.y - s.hitH / 2 &&
        spot.cy - half < s.y + s.hitH / 2;
      expect(overlap).toBe(false);
    }
  });

  it("vùng chạm không đổi khi vẽ", () => {
    const session = openSession();
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    match(session, 0, 1);
    frame(session, new RenderSystem(), 100);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });
});
