import { describe, expect, it, vi } from "vitest";
import { ACTION_CORRECT } from "#src/game-session";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  BEAM_FADE_MS,
  beamFadeIn,
  drawFlashlightBeam,
  drawWallShadow,
  flashlightBeamPolygon,
} from "#src/render/craft-shapes";
import { drawEmptyTargetSlot } from "#src/render/slot-decor";
import { RenderSystem } from "#src/systems/render-system";
import { GT019_FIXTURES } from "#src/templates/GT-019/fixtures.js";
import { GT019Session } from "#src/templates/GT-019/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawFlashlightBeam: vi.fn(actual.drawFlashlightBeam),
    drawWallShadow: vi.fn(actual.drawWallShadow),
  };
});

vi.mock("#src/render/slot-decor", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/slot-decor")>();
  return {
    ...actual,
    drawEmptyTargetSlot: vi.fn(actual.drawEmptyTargetSlot),
  };
});

/** Chùm sáng đèn pin và bóng đổ của mảnh đã đặt (`BR-E019-08`). */
type Fixture = (typeof GT019_FIXTURES)[number];

function openSession(fixture: Fixture): GT019Session {
  const session = new GT019Session(fixture.content, fixture.difficulty, 0);
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

function frame(session: GT019Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawFlashlightBeam).mockClear();
  vi.mocked(drawWallShadow).mockClear();
  vi.mocked(drawEmptyTargetSlot).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

/** Xoay/lật mảnh tới khi đặt đúng ô đích của nó; trả về `slot_id`. */
function placeCorrectly(
  session: GT019Session,
  fixture: Fixture,
  pieceId: string
): string {
  const piece = fixture.content.pieces.find((p) => p.piece_id === pieceId);
  if (!piece) {
    throw new Error("Thiếu mảnh");
  }
  for (let flip = 0; flip < 2; flip++) {
    for (let rot = 0; rot < 4; rot++) {
      if (
        session.onPlacePiece(piece.piece_id, piece.target_slot_id) ===
        ACTION_CORRECT
      ) {
        return piece.target_slot_id;
      }
      session.onRotatePiece(piece.piece_id, "cw");
    }
    session.onFlipPiece(piece.piece_id, "horizontal");
  }
  throw new Error(`Không đặt được ${pieceId}`);
}

describe("beamFadeIn / flashlightBeamPolygon (hàm thuần)", () => {
  it("hiện dần theo thời gian, đủ sau BEAM_FADE_MS; reduced_motion hiện đủ ngay", () => {
    expect(beamFadeIn(0, false)).toBe(0);
    expect(beamFadeIn(BEAM_FADE_MS / 2, false)).toBeCloseTo(0.5, 9);
    expect(beamFadeIn(BEAM_FADE_MS * 3, false)).toBe(1);
    expect(beamFadeIn(0, true)).toBe(1);
  });

  it("chùm sáng mở rộng từ đèn tới ô đích", () => {
    const poly = flashlightBeamPolygon(
      { x: 0, y: 0 },
      { x: 100, y: 0, w: 40, h: 40 }
    );
    expect(poly).toHaveLength(4);
    const width = (a: number, b: number): number =>
      Math.abs((poly[a]?.y ?? 0) - (poly[b]?.y ?? 0));
    expect(width(1, 2)).toBeGreaterThan(width(0, 3));
  });
});

describe("GT-019: chùm sáng và bóng đổ (BR-E019-08)", () => {
  it("mọi fixture: chưa đặt mảnh nào thì không chùm sáng, không bóng", () => {
    for (const fixture of GT019_FIXTURES) {
      const session = openSession(fixture);
      frame(session, new RenderSystem(), 0);
      expect(vi.mocked(drawFlashlightBeam)).not.toHaveBeenCalled();
      expect(vi.mocked(drawWallShadow)).not.toHaveBeenCalled();
    }
  });

  it("mọi fixture: mỗi mảnh đặt đúng thêm đúng một chùm sáng và một bóng; đặt sai không thêm", () => {
    for (const fixture of GT019_FIXTURES) {
      const session = openSession(fixture);
      let placed = 0;
      for (const piece of fixture.content.pieces) {
        placeCorrectly(session, fixture, piece.piece_id);
        placed++;
        frame(session, new RenderSystem(), 100);
        expect(vi.mocked(drawWallShadow)).toHaveBeenCalledTimes(placed);
        // Có nhân vật ở góc trống hoặc đèn rơi về mép trên sân khấu: luôn có đầu đèn.
        expect(vi.mocked(drawFlashlightBeam)).toHaveBeenCalledTimes(placed);
      }
    }
  });

  it("chùm sáng hiện dần theo đồng hồ khung sau khi đặt; reduced_motion đủ ngay", () => {
    const fixture = GT019_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture GT-019");
    }
    const first = fixture.content.pieces[0];
    if (!first) {
      throw new Error("Thiếu mảnh");
    }
    const session = openSession(fixture);
    frame(session, new RenderSystem(), 0);
    placeCorrectly(session, fixture, first.piece_id);
    frame(session, new RenderSystem(), 0);
    const s0 = vi.mocked(drawWallShadow).mock.calls[0]?.[2];
    frame(session, new RenderSystem(), BEAM_FADE_MS / 2);
    const s1 = vi.mocked(drawWallShadow).mock.calls[0]?.[2];
    frame(session, new RenderSystem(), BEAM_FADE_MS * 2);
    const s2 = vi.mocked(drawWallShadow).mock.calls[0]?.[2];
    expect(s0).toBeLessThan(s1 ?? 0);
    expect(s1).toBeLessThan(s2 ?? 0);

    const fresh = openSession(fixture);
    frame(fresh, new RenderSystem(), 0);
    placeCorrectly(fresh, fixture, first.piece_id);
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(fresh, rs, 0);
    expect(vi.mocked(drawWallShadow).mock.calls[0]?.[2]).toBe(1);
  });

  it("mọi chùm sáng/bóng vẽ trước mọi ô đích: không đè hình mờ của ô chưa đặt", () => {
    for (const fixture of GT019_FIXTURES) {
      const pieces = fixture.content.pieces;
      const last = pieces.at(-1);
      if (!last || pieces.length < 2) {
        continue;
      }
      const session = openSession(fixture);
      // Đặt mảnh cuối trước: ô đích của nó vẽ sau các ô còn trống.
      placeCorrectly(session, fixture, last.piece_id);
      frame(session, new RenderSystem(), 100);
      const lightOrder = [
        ...vi.mocked(drawFlashlightBeam).mock.invocationCallOrder,
        ...vi.mocked(drawWallShadow).mock.invocationCallOrder,
      ];
      const slotOrder = vi.mocked(drawEmptyTargetSlot).mock.invocationCallOrder;
      expect(lightOrder.length).toBeGreaterThan(0);
      expect(Math.max(...lightOrder)).toBeLessThan(Math.min(...slotOrder));
    }
  });

  it("vùng chạm không đổi khi vẽ", () => {
    for (const fixture of GT019_FIXTURES) {
      const session = openSession(fixture);
      const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
      frame(session, new RenderSystem(), 100);
      expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
        before
      );
    }
  });
});
