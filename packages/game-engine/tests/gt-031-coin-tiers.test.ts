import { describe, expect, it, vi } from "vitest";
import {
  coinDiameter,
  coinTierOf,
  MIN_COIN_DIAMETER_RATIO,
} from "#src/layout/coin-tiers";
import { DEFAULT_LOGIC_SPACE, resolveTouchFloor } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { RenderSystem } from "#src/systems/render-system";
import { GT031_FIXTURES } from "#src/templates/GT-031/fixtures.js";
import { GT031Session } from "#src/templates/GT-031/session.js";
import type { GT031Content } from "#src/templates/GT-031/template";
import { createFakeCanvas } from "./gates/fake-canvas.ts";
import { lettersOnly } from "./helpers/rendered-text.ts";

const FIXTURE = GT031_FIXTURES[0] ?? failMissing();

function failMissing(): never {
  throw new Error("Thiếu fixture GT-031");
}

const ZONES = computeStageZones({
  logicW: 960,
  logicH: 540,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: true,
  needsCommit: true,
});
const TRAY = ZONES.tray ?? undefined;

const THREE_KINDS: GT031Content = {
  ...FIXTURE.content,
  target_amount: 3,
  coins: [
    { coin_id: "a", asset: { kind: "emoji", ref: "🪙" }, value: 1 },
    { coin_id: "b", asset: { kind: "emoji", ref: "🪙" }, value: 2 },
    { coin_id: "c", asset: { kind: "emoji", ref: "🪙" }, value: 5 },
    { coin_id: "d", asset: { kind: "emoji", ref: "🪙" }, value: 1 },
  ],
};

function openSession(): GT031Session {
  const session = new GT031Session(THREE_KINDS, FIXTURE.difficulty, 0);
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY, 1);
  return session;
}

let lastTexts: string[] = [];

interface DrawnCoin {
  /** Bán kính đường tròn mặt xu. */
  readonly radius: number;
  /** Bán kính mép ngoài: mặt xu cộng nửa nét viền. */
  readonly outer: number;
  readonly fill: string;
  readonly pips: number;
}

/** Vẽ một khung, gom xu theo thứ tự `arc` bán kính lớn nhất mỗi xu. */
function drawCoins(session: GT031Session): DrawnCoin[] {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const texts: string[] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((t: string) => {
    texts.push(t);
  });
  interface Arc {
    x: number;
    y: number;
    r: number;
    fill: string;
    rim: number;
  }
  const arcs: Arc[] = [];
  let pending: Arc | null = null;
  let lastFilled: Arc | null = null;
  vi.spyOn(ctx, "arc").mockImplementation((x: number, y: number, r: number) => {
    pending = { x, y, r, fill: "", rim: 0 };
  });
  vi.spyOn(ctx, "fill").mockImplementation(() => {
    if (pending) {
      lastFilled = { ...pending, fill: String(ctx.fillStyle) };
      arcs.push(lastFilled);
      pending = null;
    }
  });
  // Nét viền vẽ ngay sau `fill` của mặt xu, trên cùng đường tròn.
  vi.spyOn(ctx, "stroke").mockImplementation(() => {
    if (lastFilled && pending === null && lastFilled.rim === 0) {
      lastFilled.rim = ctx.lineWidth;
    }
  });
  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
  lastTexts = texts;
  const coinSlots = session.slots.slice(1, 1 + session.content.coins.length);
  return coinSlots.map((slot) => {
    const onCoin = arcs.filter(
      (a) => Math.abs(a.x - slot.x) < 1.5 && Math.abs(a.y - slot.y) < 1.5
    );
    // Mặt xu là hình tròn lớn nhất; chấm là các hình tròn nhỏ trên mặt.
    const face = onCoin.reduce((big, a) => (a.r > big.r ? a : big), {
      x: 0,
      y: 0,
      r: 0,
      fill: "",
      rim: 0,
    });
    const pips = arcs.filter(
      (a) =>
        a.r < face.r * 0.2 &&
        Math.hypot(a.x - slot.x, a.y - slot.y) < face.r &&
        Math.hypot(a.x - slot.x, a.y - slot.y) > 0.1
    ).length;
    return {
      radius: face.r,
      outer: face.r + face.rim / 2,
      fill: face.fill,
      pips,
    };
  });
}

describe("GT-031: bậc giá trị của xu (BR-E031-09)", () => {
  it("coinTierOf xếp mệnh giá khác nhau tăng dần, bằng nhau cùng bậc", () => {
    const values = [5, 1, 2, 1];
    expect(coinTierOf(values, 1)).toEqual({ rank: 0, count: 3 });
    expect(coinTierOf(values, 2)).toEqual({ rank: 1, count: 3 });
    expect(coinTierOf(values, 5)).toEqual({ rank: 2, count: 3 });
  });

  it("coinDiameter tăng đơn điệu, nhỏ nhất ≥ sàn chạm, lớn nhất = ô chạm", () => {
    const floor = 64;
    const hit = 120;
    const sizes = [0, 1, 2, 3].map((rank) => coinDiameter(rank, 4, hit, floor));
    expect(sizes[0]).toBeGreaterThanOrEqual(floor);
    expect(sizes[3]).toBe(hit);
    for (let i = 1; i < sizes.length; i++) {
      expect(sizes[i]).toBeGreaterThan(sizes[i - 1] ?? 0);
    }
    expect(sizes[0]).toBe(Math.round(hit * MIN_COIN_DIAMETER_RATIO));
  });

  it("ô chạm bằng sàn chạm: mọi xu cùng cỡ, không nhỏ hơn sàn", () => {
    expect(coinDiameter(0, 3, 64, 64)).toBe(64);
    expect(coinDiameter(2, 3, 64, 64)).toBe(64);
  });

  it("một mệnh giá duy nhất: xu đầy ô chạm", () => {
    expect(coinDiameter(0, 1, 80, 64)).toBe(80);
  });

  it("xu vẽ to dần theo mệnh giá, cùng mệnh giá cùng cỡ", () => {
    const [d1, d2, d5, d1b] = drawCoins(openSession());
    expect(d1 && d2 && d5 && d1b).toBeTruthy();
    expect(d2?.radius).toBeGreaterThan(d1?.radius ?? 0);
    expect(d5?.radius).toBeGreaterThan(d2?.radius ?? 0);
    expect(d1b?.radius).toBe(d1?.radius);
  });
});

describe("GT-031: màu theo bậc và số chấm (BR-E031-10)", () => {
  it("số chấm bằng bậc + 1 và mỗi mệnh giá một màu nền", () => {
    const [d1, d2, d5, d1b] = drawCoins(openSession());
    expect([d1?.pips, d2?.pips, d5?.pips, d1b?.pips]).toEqual([1, 2, 3, 1]);
    expect(lettersOnly(lastTexts)).toEqual([]);
    const fills = new Set([d1?.fill, d2?.fill, d5?.fill]);
    expect(fills.size).toBe(3);
    expect(d1b?.fill).toBe(d1?.fill);
  });
});

describe("GT-031: sàn chạm và không chồng nhau (BR-E031-11)", () => {
  for (const [i, fixture] of GT031_FIXTURES.entries()) {
    it(`fixture ${i + 1}: vùng chạm ≥ sàn, đường kính trong [sàn, ô chạm], xu kề nhau không giao`, () => {
      const session = new GT031Session(fixture.content, fixture.difficulty, 0);
      session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage, TRAY, 1);
      const floor = resolveTouchFloor("5-6", 1);
      const coins = drawCoins(session);
      const slots = session.slots.slice(1, 1 + fixture.content.coins.length);
      for (const [k, slot] of slots.entries()) {
        const coin = coins[k];
        expect(slot.hitW).toBeGreaterThanOrEqual(floor);
        expect(slot.hitH).toBeGreaterThanOrEqual(floor);
        expect(coin?.radius).toBeLessThan(coin?.outer ?? 0);
        const diameter = (coin?.outer ?? 0) * 2;
        expect(diameter).toBeGreaterThanOrEqual(floor - 1);
        expect(diameter).toBeLessThanOrEqual(
          Math.min(slot.hitW, slot.hitH) + 1
        );
      }
      for (let a = 0; a < slots.length; a++) {
        for (let b = a + 1; b < slots.length; b++) {
          const sa = slots[a];
          const sb = slots[b];
          const dist = Math.hypot(
            (sa?.x ?? 0) - (sb?.x ?? 0),
            (sa?.y ?? 0) - (sb?.y ?? 0)
          );
          // Kể cả nét viền: hai mép ngoài không giao nhau.
          const ra = coins[a]?.outer ?? 0;
          const rb = coins[b]?.outer ?? 0;
          expect(dist).toBeGreaterThanOrEqual(ra + rb);
        }
      }
    });
  }
});
