import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawMagnifier } from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures.js";
import { GT022_LENS_MS, GT022Session } from "#src/templates/GT-022/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawMagnifier: vi.fn(actual.drawMagnifier) };
});

/** Kính lúp của Vịt Con soi vật vừa chạm (`BR-E022-10`). */
type Fixture = (typeof GT022_FIXTURES)[number];

function openSession(fixture: Fixture): GT022Session {
  const session = new GT022Session(fixture.content, fixture.difficulty, 0);
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: false,
  });
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, zones.stage);
  return session;
}

function frame(session: GT022Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawMagnifier).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

describe("GT-022: kính lúp (BR-E022-10)", () => {
  it("mọi fixture: chưa chạm gì thì không kính lúp", () => {
    for (const fixture of GT022_FIXTURES) {
      const session = openSession(fixture);
      frame(session, new RenderSystem(), 0);
      expect(vi.mocked(drawMagnifier)).not.toHaveBeenCalled();
    }
  });

  it("mọi fixture: chạm vật đích hay vật nhiễu đều có đúng một kính lúp trong GT022_LENS_MS rồi tắt — cùng một luật", () => {
    for (const fixture of GT022_FIXTURES) {
      const visible = fixture.content.scene_objects.filter((o) => !o.is_hidden);
      for (const obj of visible) {
        const session = openSession(fixture);
        frame(session, new RenderSystem(), 100);
        session.onTapObject(obj.id);
        frame(session, new RenderSystem(), 200);
        expect(
          vi.mocked(drawMagnifier),
          `${fixture.content.prompt} ${obj.id}`
        ).toHaveBeenCalledTimes(1);
        frame(session, new RenderSystem(), 100 + GT022_LENS_MS + 50);
        expect(vi.mocked(drawMagnifier)).not.toHaveBeenCalled();
      }
    }
  });

  it("kính lúp lắc theo đồng hồ khung; reduced_motion đứng yên", () => {
    const fixture = GT022_FIXTURES[0];
    const obj = fixture?.content.scene_objects[0];
    if (!(fixture && obj)) {
      throw new Error("Thiếu fixture GT-022");
    }
    const session = openSession(fixture);
    frame(session, new RenderSystem(), 0);
    session.onTapObject(obj.id);
    const seen = new Set<number>();
    for (const t of [0, 200, 400, 600]) {
      frame(session, new RenderSystem(), t);
      seen.add(
        Math.round((vi.mocked(drawMagnifier).mock.calls[0]?.[1].x ?? 0) * 100)
      );
    }
    expect(seen.size).toBeGreaterThan(1);
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    const xs = new Set<number>();
    for (const t of [0, 200, 400, 600]) {
      frame(session, rs, t);
      xs.add(vi.mocked(drawMagnifier).mock.calls[0]?.[1].x ?? Number.NaN);
    }
    expect(xs.size).toBe(1);
  });

  it("vùng chạm không đổi khi vẽ", () => {
    for (const fixture of GT022_FIXTURES) {
      const session = openSession(fixture);
      const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
      frame(session, new RenderSystem(), 100);
      expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
        before
      );
    }
  });
});
