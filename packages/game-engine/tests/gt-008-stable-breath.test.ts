import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawStable,
  STABLE_BREATH_MS,
  stableBreathScale,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT008_FIXTURES } from "#src/templates/GT-008/fixtures.js";
import { GT008Session } from "#src/templates/GT-008/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawStable: vi.fn(actual.drawStable) };
});

/** Chuồng vẽ vector, thở khi trẻ cầm vật (`BR-E008-07`). */
const FIXTURE = GT008_FIXTURES[0] ?? failMissingFixture();
const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: true,
  needsCommit: false,
});

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-008");
}

function openSession(): GT008Session {
  const session = new GT008Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound(
    "5-6",
    DEFAULT_LOGIC_SPACE,
    ZONES.stage,
    ZONES.tray ?? undefined
  );
  return session;
}

function frame(session: GT008Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawStable).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

function stageFirstItem(session: GT008Session): void {
  const src = session.slots.find((s) => s.role === "source");
  if (!src) {
    throw new Error("Thiếu ô nguồn");
  }
  session.toAction({ type: "tap", x: src.x, y: src.y, timeMs: 0 });
  if (session.getStagedItemId() === null) {
    throw new Error("Chạm ô nguồn chưa cầm được vật");
  }
}

describe("stableBreathScale (hàm thuần)", () => {
  it("không cầm vật hoặc reduced-motion: luôn 1", () => {
    for (const t of [0, 300, 900, 5000]) {
      expect(stableBreathScale(t, false, false)).toBe(1);
      expect(stableBreathScale(t, true, true)).toBe(1);
    }
  });

  it("cầm vật: thở trong (1, 1.06], tuần hoàn theo STABLE_BREATH_MS", () => {
    const values = [0, 200, 400, 600, 800, 1000].map((t) =>
      stableBreathScale(t, true, false)
    );
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(1.0601);
    }
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(0.02);
    expect(stableBreathScale(250, true, false)).toBeCloseTo(
      stableBreathScale(250 + STABLE_BREATH_MS, true, false),
      9
    );
  });
});

describe("GT-008: chuồng và nhịp thở (BR-E008-07)", () => {
  it("mỗi ô đích còn trống có một chuồng; chuồng đã có vật thì không vẽ", () => {
    const session = openSession();
    frame(session, new RenderSystem(), 0);
    expect(vi.mocked(drawStable)).toHaveBeenCalledTimes(
      FIXTURE.content.slots.length
    );
    session.commit({
      type: "place_item",
      data: {
        item_id: FIXTURE.content.slots[0]?.expected_item_id,
        slot_id: FIXTURE.content.slots[0]?.slot_id,
      },
    });
    frame(session, new RenderSystem(), 10);
    expect(vi.mocked(drawStable)).toHaveBeenCalledTimes(
      FIXTURE.content.slots.length - 1
    );
  });

  it("chưa cầm vật: mọi chuồng đứng yên ở tỉ lệ 1", () => {
    const session = openSession();
    for (const t of [0, 300, 700]) {
      frame(session, new RenderSystem(), t);
      for (const call of vi.mocked(drawStable).mock.calls) {
        expect(call[2]).toBe(1);
      }
    }
  });

  it("đã cầm vật: MỌI chuồng trống thở cùng một giá trị, không riêng ô đúng", () => {
    const session = openSession();
    stageFirstItem(session);
    const rs = new RenderSystem();
    let breathed = false;
    for (const t of [100, 300, 500, 700]) {
      frame(session, rs, t);
      const scales = vi.mocked(drawStable).mock.calls.map((c) => c[2]);
      expect(scales).toHaveLength(FIXTURE.content.slots.length);
      expect(new Set(scales).size).toBe(1);
      if ((scales[0] ?? 1) > 1.001) {
        breathed = true;
      }
    }
    expect(breathed).toBe(true);
  });

  it("reduced-motion: cầm vật cũng không thở", () => {
    const session = openSession();
    stageFirstItem(session);
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(session, rs, 400);
    for (const call of vi.mocked(drawStable).mock.calls) {
      expect(call[2]).toBe(1);
    }
  });

  it("vùng chạm không đổi khi chuồng thở", () => {
    const session = openSession();
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    stageFirstItem(session);
    frame(session, new RenderSystem(), 400);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });
});
