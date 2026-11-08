import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  SNAP_WOBBLE_AMPLITUDE_PX,
  SNAP_WOBBLE_MS,
  snapWobbleOffset,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures.js";
import { GT023Session } from "#src/templates/GT-023/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, snapWobbleOffset: vi.fn(actual.snapWobbleOffset) };
});

/** Mảnh gỗ rung nhẹ khi khớp neo (`BR-E023-10`). */
type Fixture = (typeof GT023_FIXTURES)[number];

function openSession(fixture: Fixture): GT023Session {
  const session = new GT023Session(fixture.content, fixture.difficulty, 0);
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: true,
    trayItems: session.trayItemCount,
    trayLabels: false,
    needsCommit: false,
  });
  session.prepareRound(
    "5-6",
    DEFAULT_LOGIC_SPACE,
    zones.stage,
    zones.tray ?? undefined
  );
  return session;
}

/** Vẽ một khung và trả về độ lệch rung của từng mảnh đã đặt. */
function offsets(
  session: GT023Session,
  rs: RenderSystem,
  timeMs: number
): number[] {
  vi.mocked(snapWobbleOffset).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return vi.mocked(snapWobbleOffset).mock.results.map((r) => r.value);
}

describe("snapWobbleOffset (hàm thuần)", () => {
  it("rung trong biên độ rồi tắt về 0 sau SNAP_WOBBLE_MS", () => {
    for (let t = 0; t < SNAP_WOBBLE_MS; t += 20) {
      expect(Math.abs(snapWobbleOffset(t, false))).toBeLessThanOrEqual(
        SNAP_WOBBLE_AMPLITUDE_PX
      );
    }
    expect(snapWobbleOffset(SNAP_WOBBLE_MS, false)).toBe(0);
    expect(snapWobbleOffset(-5, false)).toBe(0);
  });

  it("có lúc lệch khác 0; reduced_motion luôn 0", () => {
    const moving = [20, 60, 100, 140].some(
      (t) => snapWobbleOffset(t, false) !== 0
    );
    expect(moving).toBe(true);
    expect(snapWobbleOffset(100, true)).toBe(0);
  });
});

describe("GT-023: mảnh rung khi khớp (BR-E023-10)", () => {
  it("mọi fixture: chưa khớp mảnh nào thì không mảnh nào rung", () => {
    for (const fixture of GT023_FIXTURES) {
      const session = openSession(fixture);
      expect(offsets(session, new RenderSystem(), 0)).toEqual([]);
    }
  });

  it("mọi fixture: mảnh khớp neo rung trong SNAP_WOBBLE_MS theo đồng hồ khung rồi đứng yên; reduced_motion không rung", () => {
    for (const fixture of GT023_FIXTURES) {
      const part = fixture.content.parts[0];
      if (!part) {
        continue;
      }
      const session = openSession(fixture);
      offsets(session, new RenderSystem(), 0);
      session.onAssemblePart(part.part_id, part.target_anchor_id);
      const seen = [30, 70, 110, 150].flatMap((t) =>
        offsets(session, new RenderSystem(), t)
      );
      expect(seen.some((v) => v !== 0)).toBe(true);
      const after = offsets(session, new RenderSystem(), SNAP_WOBBLE_MS + 50);
      expect(after.every((v) => v === 0)).toBe(true);
      const rs = new RenderSystem();
      rs.reducedMotion = true;
      expect(offsets(session, rs, 50).every((v) => v === 0)).toBe(true);
    }
  });

  it("vùng chạm không đổi khi rung", () => {
    for (const fixture of GT023_FIXTURES) {
      const session = openSession(fixture);
      const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
      offsets(session, new RenderSystem(), 100);
      expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
        before
      );
    }
  });
});
