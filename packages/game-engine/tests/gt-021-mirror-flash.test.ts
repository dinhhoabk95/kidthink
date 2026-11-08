import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawMirrorFlash,
  MIRROR_FLASH_MS,
  MIRROR_REVEAL_MS,
  mirrorFlashStrength,
  mirrorRevealAlpha,
} from "#src/render/craft-shapes";
import { drawMirroredSlotItem } from "#src/render/shared-render";
import { RenderSystem } from "#src/systems/render-system";
import { GT021_FIXTURES } from "#src/templates/GT-021/fixtures.js";
import { GT021Session } from "#src/templates/GT-021/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

const revealAlphas: number[] = [];

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawMirrorFlash: vi.fn(actual.drawMirrorFlash) };
});
vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return {
    ...actual,
    drawMirroredSlotItem: vi.fn(
      (...args: Parameters<typeof actual.drawMirroredSlotItem>) => {
        revealAlphas.push(args[0].globalAlpha);
        return actual.drawMirroredSlotItem(...args);
      }
    ),
  };
});

/** Mặt gương loé sáng và ảnh phản chiếu hiện dần (`BR-E021-08`). */
type Fixture = (typeof GT021_FIXTURES)[number];

function openSession(fixture: Fixture): GT021Session {
  const session = new GT021Session(fixture.content, fixture.difficulty, 0);
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: true,
    trayItems: fixture.content.options.length,
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

function frame(session: GT021Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawMirrorFlash).mockClear();
  vi.mocked(drawMirroredSlotItem).mockClear();
  revealAlphas.length = 0;
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

function pair(
  fixture: Fixture,
  correct: boolean
): { itemId: string; slotId: string } {
  const target = fixture.content.target_slots[0];
  const opt = fixture.content.options.find(
    (o) => (o.asset_ref === target?.expected_asset_ref) === correct
  );
  if (!(target && opt)) {
    throw new Error("Thiếu cặp đặt");
  }
  return { itemId: opt.item_id, slotId: target.slot_id };
}

describe("mirrorRevealAlpha / mirrorFlashStrength (hàm thuần)", () => {
  it("ảnh phản chiếu hiện dần; reduced_motion hiện đủ ngay", () => {
    expect(mirrorRevealAlpha(0, false)).toBe(0);
    expect(mirrorRevealAlpha(MIRROR_REVEAL_MS / 2, false)).toBeCloseTo(0.5, 9);
    expect(mirrorRevealAlpha(MIRROR_REVEAL_MS * 2, false)).toBe(1);
    expect(mirrorRevealAlpha(0, true)).toBe(1);
  });

  it("trục loé rồi tắt; reduced_motion không loé", () => {
    expect(mirrorFlashStrength(0, false)).toBe(1);
    expect(mirrorFlashStrength(MIRROR_FLASH_MS / 2, false)).toBeCloseTo(0.5, 9);
    expect(mirrorFlashStrength(MIRROR_FLASH_MS, false)).toBe(0);
    expect(mirrorFlashStrength(0, true)).toBe(0);
  });
});

describe("GT-021: gương loé và ảnh hiện dần (BR-E021-08)", () => {
  it("mọi fixture: chưa đặt gì thì trục không loé", () => {
    for (const fixture of GT021_FIXTURES) {
      const session = openSession(fixture);
      frame(session, new RenderSystem(), 0);
      const strengths = vi.mocked(drawMirrorFlash).mock.calls.map((c) => c[3]);
      expect(strengths.every((v) => v === 0)).toBe(true);
    }
  });

  it("mọi fixture: đặt đúng thì trục loé rồi tắt theo đồng hồ khung; đặt sai thì không loé", () => {
    for (const fixture of GT021_FIXTURES) {
      const wrongPair = fixture.content.options.some(
        (o) =>
          o.asset_ref !== fixture.content.target_slots[0]?.expected_asset_ref
      );
      if (wrongPair) {
        const wrong = openSession(fixture);
        frame(wrong, new RenderSystem(), 0);
        const w = pair(fixture, false);
        wrong.onPlaceOption(w.itemId, w.slotId);
        frame(wrong, new RenderSystem(), 50);
        expect(
          vi.mocked(drawMirrorFlash).mock.calls.every((c) => c[3] === 0)
        ).toBe(true);
      }
      const session = openSession(fixture);
      frame(session, new RenderSystem(), 0);
      const c = pair(fixture, true);
      session.onPlaceOption(c.itemId, c.slotId);
      frame(session, new RenderSystem(), 100);
      expect(vi.mocked(drawMirrorFlash).mock.calls[0]?.[3]).toBeGreaterThan(0);
      frame(session, new RenderSystem(), MIRROR_FLASH_MS + 100);
      expect(vi.mocked(drawMirrorFlash).mock.calls[0]?.[3] ?? 0).toBe(0);
    }
  });

  it("ảnh phản chiếu hiện dần sau khi đặt; reduced_motion hiện đủ ngay", () => {
    for (const fixture of GT021_FIXTURES) {
      const session = openSession(fixture);
      frame(session, new RenderSystem(), 0);
      const c = pair(fixture, true);
      session.onPlaceOption(c.itemId, c.slotId);
      frame(session, new RenderSystem(), MIRROR_REVEAL_MS / 2);
      const mid = revealAlphas[0];
      frame(session, new RenderSystem(), MIRROR_REVEAL_MS * 3);
      const late = revealAlphas[0];
      expect(mid).toBeLessThan(late ?? 0);
      const rs = new RenderSystem();
      rs.reducedMotion = true;
      frame(session, rs, MIRROR_REVEAL_MS / 2);
      expect(revealAlphas[0]).toBe(1);
    }
  });

  it("vùng chạm không đổi khi vẽ", () => {
    for (const fixture of GT021_FIXTURES) {
      const session = openSession(fixture);
      const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
      frame(session, new RenderSystem(), 100);
      expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
        before
      );
    }
  });
});
