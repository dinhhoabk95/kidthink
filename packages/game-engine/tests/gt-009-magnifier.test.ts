import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawMagnifier,
  MAGNIFIER_SWAY_MS,
  magnifierPose,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT009_FIXTURES } from "#src/templates/GT-009/fixtures.js";
import { GT009Session } from "#src/templates/GT-009/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawMagnifier: vi.fn(actual.drawMagnifier) };
});

/** Kính lúp soi ứng viên vừa chốt, chỉ sau kết quả (`BR-E009-08`). */
const FIXTURE = GT009_FIXTURES[0] ?? failMissingFixture();
const ANSWER = FIXTURE.content.answer_candidate_id;
const WRONG =
  FIXTURE.content.candidates.find((c) => c.candidate_id !== ANSWER)
    ?.candidate_id ?? "";
const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: true,
});
const SLOT: Slot = {
  index: 0,
  page: 0,
  role: "target",
  x: 200,
  y: 200,
  w: 80,
  h: 80,
  hitW: 80,
  hitH: 80,
};

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-009");
}

function openSession(): GT009Session {
  const session = new GT009Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage);
  return session;
}

function frame(session: GT009Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawMagnifier).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

describe("magnifierPose (hàm thuần)", () => {
  it("vành bao quanh ô, lắc nhẹ quanh tâm ô, tuần hoàn", () => {
    const p = magnifierPose(SLOT, 400, false);
    expect(p.r).toBe(40);
    expect(Math.hypot(p.x - SLOT.x, p.y - SLOT.y)).toBeLessThanOrEqual(
      p.r * 0.061
    );
    const q = magnifierPose(SLOT, 400 + MAGNIFIER_SWAY_MS, false);
    expect(q.x).toBeCloseTo(p.x, 6);
    expect(q.y).toBeCloseTo(p.y, 6);
  });

  it("reduced-motion: đứng yên ở tâm ô", () => {
    const p = magnifierPose(SLOT, 400, true);
    expect(p.x).toBe(SLOT.x);
    expect(p.y).toBe(SLOT.y);
  });
});

describe("GT-009: kính lúp soi ứng viên (BR-E009-08)", () => {
  it("chưa chốt gì: không có kính lúp trên bất kỳ ứng viên nào", () => {
    const session = openSession();
    frame(session, new RenderSystem(), 100);
    expect(vi.mocked(drawMagnifier)).not.toHaveBeenCalled();
  });

  it("úp nháp một ứng viên, kể cả ứng viên đúng, không gọi kính lúp", () => {
    const session = openSession();
    session.commit({ type: "toggle_eliminate", data: { item_id: ANSWER } });
    session.commit({ type: "toggle_eliminate", data: { item_id: WRONG } });
    frame(session, new RenderSystem(), 100);
    expect(vi.mocked(drawMagnifier)).not.toHaveBeenCalled();
  });

  it("chốt sai: kính lúp soi đúng ứng viên đó trong nhịp nháy sai rồi tắt", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    session.commit({ type: "select_candidate", data: { item_id: WRONG } });
    frame(session, rs, 1100);
    expect(vi.mocked(drawMagnifier)).toHaveBeenCalledTimes(1);
    frame(session, rs, 5000);
    expect(vi.mocked(drawMagnifier)).not.toHaveBeenCalled();
  });

  it("chốt đúng: kính lúp soi ứng viên đúng sau khi thắng", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    session.commit({ type: "select_candidate", data: { item_id: ANSWER } });
    expect(session.checkWinCondition()).toBe(true);
    frame(session, rs, 1100);
    expect(vi.mocked(drawMagnifier)).toHaveBeenCalledTimes(1);
  });

  it("reduced-motion: kính lúp đứng yên ở tâm ô", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(session, rs, 1000);
    session.commit({ type: "select_candidate", data: { item_id: ANSWER } });
    frame(session, rs, 1234);
    const pose = vi.mocked(drawMagnifier).mock.calls[0]?.[1];
    const slot = session.slots.find((s) => s.x === pose?.x && s.y === pose?.y);
    expect(slot).toBeDefined();
  });

  it("vùng chạm không đổi khi vẽ kính lúp", () => {
    const session = openSession();
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    session.commit({ type: "select_candidate", data: { item_id: ANSWER } });
    frame(session, new RenderSystem(), 100);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });
});
