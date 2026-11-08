import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { splitCaption } from "#src/layout/slot-fit";
import { computeStageZones } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawMarketStall,
  drawPiggyBank,
  marketStallGeometry,
  PIGGY_BOUNCE_MS,
  piggyBounceScale,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures";
import { GT031Session } from "#src/templates/GT-031/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawMarketStall: vi.fn(actual.drawMarketStall),
    drawPiggyBank: vi.fn(actual.drawPiggyBank),
  };
});

/** Quầy chợ và heo đất vẽ riêng (`BR-E031-12`). */
const FIXTURE = GT031_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-031");
}

const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: true,
  needsCommit: true,
});
const BODY = splitCaption(ZONES.stage).body;
const SLOT: Slot = {
  index: 0,
  page: 0,
  role: "target",
  x: BODY.x + BODY.w / 2,
  y: BODY.y + BODY.h / 2,
  w: 120,
  h: 120,
  hitW: 120,
  hitH: 120,
};

function inside(
  r: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    r.x >= b.x - 1e-9 &&
    r.y >= b.y - 1e-9 &&
    r.x + r.w <= b.x + b.w + 1e-9 &&
    r.y + r.h <= b.y + b.h + 1e-9
  );
}

describe("marketStallGeometry (hàm thuần)", () => {
  it("mái che trên, quầy dưới thẻ giá, đều nằm trong thân sân khấu", () => {
    const g = marketStallGeometry(SLOT, BODY);
    expect(g.canopy).not.toBeNull();
    expect(g.counter).not.toBeNull();
    if (g.canopy) {
      expect(inside(g.canopy, BODY)).toBe(true);
      expect(g.canopy.y + g.canopy.h).toBeLessThanOrEqual(
        SLOT.y - SLOT.h / 2 + 1e-9
      );
    }
    if (g.counter) {
      expect(inside(g.counter, BODY)).toBe(true);
      expect(g.counter.y).toBeGreaterThanOrEqual(SLOT.y + SLOT.h / 2 - 1e-9);
    }
  });

  it("heo đất nằm cạnh thẻ giá, trong thân sân khấu, không chồng lên thẻ giá", () => {
    const g = marketStallGeometry(SLOT, BODY);
    expect(g.piggy).not.toBeNull();
    if (!g.piggy) {
      return;
    }
    const half = g.piggy.size / 2;
    const rect = {
      x: g.piggy.cx - half,
      y: g.piggy.cy - half,
      w: g.piggy.size,
      h: g.piggy.size,
    };
    expect(inside(rect, BODY)).toBe(true);
    const slotLeft = SLOT.x - SLOT.w / 2;
    const slotRight = SLOT.x + SLOT.w / 2;
    expect(rect.x + rect.w <= slotLeft || rect.x >= slotRight).toBe(true);
  });

  it("thân sân khấu quá hẹp thì bỏ heo đất, không tràn ra ngoài", () => {
    const narrow = { x: SLOT.x - 70, y: BODY.y, w: 140, h: BODY.h };
    const g = marketStallGeometry(SLOT, narrow);
    expect(g.piggy).toBeNull();
    if (g.canopy) {
      expect(inside(g.canopy, narrow)).toBe(true);
    }
  });
});

describe("piggyBounceScale (hàm thuần)", () => {
  it("nảy quanh 1 trong nhịp rồi về đúng 1", () => {
    let moved = false;
    for (let ms = 10; ms < PIGGY_BOUNCE_MS; ms += 10) {
      const s = piggyBounceScale(ms, false);
      if (Math.abs(s - 1) > 0.01) {
        moved = true;
      }
      expect(s).toBeGreaterThan(0.85);
      expect(s).toBeLessThan(1.15);
    }
    expect(moved).toBe(true);
    expect(piggyBounceScale(PIGGY_BOUNCE_MS, false)).toBe(1);
    expect(piggyBounceScale(-5, false)).toBe(1);
  });

  it("reduced-motion: luôn 1", () => {
    expect(piggyBounceScale(60, true)).toBe(1);
  });
});

describe("drawPiggyBank / drawMarketStall", () => {
  it("heo đất vẽ bằng vector, có khe bỏ xu (một roundRect)", () => {
    const ctx = createFakeCanvas(200, 200).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    const rr = vi.spyOn(ctx, "roundRect");
    const el = vi.spyOn(ctx, "ellipse");
    drawPiggyBank(ctx as CanvasRenderingContext2D, 100, 100, 60, 1);
    expect(rr).toHaveBeenCalledTimes(1);
    expect(el.mock.calls.length).toBeGreaterThan(0);
  });

  it("quầy chợ vẽ mái sọc và quầy gỗ", () => {
    const ctx = createFakeCanvas(400, 300).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    const fr = vi.spyOn(ctx, "fillRect");
    drawMarketStall(
      ctx as CanvasRenderingContext2D,
      marketStallGeometry(SLOT, BODY)
    );
    expect(fr.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});

function openSession(): GT031Session {
  const session = new GT031Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound(
    "5-6",
    DEFAULT_LOGIC_SPACE,
    ZONES.stage,
    ZONES.tray ?? undefined
  );
  return session;
}

function frame(session: GT031Session, rs: RenderSystem, timeMs: number): void {
  vi.mocked(drawMarketStall).mockClear();
  vi.mocked(drawPiggyBank).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

describe("GT-031: session vẽ quầy chợ và heo đất (BR-E031-12)", () => {
  it("vẽ quầy và heo quanh thẻ giá, thẻ giá và xu không dời", () => {
    const session = openSession();
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    frame(session, new RenderSystem(), 0);
    expect(vi.mocked(drawMarketStall).mock.calls).toHaveLength(1);
    expect(vi.mocked(drawPiggyBank).mock.calls.length).toBeLessThanOrEqual(1);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });

  it("bỏ xu: heo nảy theo đồng hồ khung rồi đứng yên; gỡ xu không nảy", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, 1000);
    const coin = FIXTURE.content.coins[0];
    if (!coin) {
      throw new Error("Thiếu xu");
    }
    session.commit({ type: "deposit_coin", data: { coin_id: coin.coin_id } });
    let bounced = false;
    for (let ms = 10; ms < PIGGY_BOUNCE_MS; ms += 10) {
      frame(session, rs, 1000 + ms);
      const call = vi.mocked(drawPiggyBank).mock.calls[0];
      if (call && Math.abs(call[4] - 1) > 0.01) {
        bounced = true;
      }
    }
    expect(bounced).toBe(true);
    frame(session, rs, 1000 + PIGGY_BOUNCE_MS + 50);
    expect(vi.mocked(drawPiggyBank).mock.calls[0]?.[4]).toBe(1);
    session.commit({ type: "remove_coin", data: { coin_id: coin.coin_id } });
    frame(session, rs, 3000);
    expect(vi.mocked(drawPiggyBank).mock.calls[0]?.[4]).toBe(1);
  });

  it("reduced-motion: heo không nảy", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(session, rs, 1000);
    const coin = FIXTURE.content.coins[0];
    if (!coin) {
      throw new Error("Thiếu xu");
    }
    session.commit({ type: "deposit_coin", data: { coin_id: coin.coin_id } });
    frame(session, rs, 1050);
    expect(vi.mocked(drawPiggyBank).mock.calls[0]?.[4]).toBe(1);
  });
});
