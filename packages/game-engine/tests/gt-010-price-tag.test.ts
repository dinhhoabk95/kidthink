import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import {
  drawPriceTag,
  PRICE_COINS_MAX,
  priceCoinLayout,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT010_FIXTURES } from "#src/templates/GT-010/fixtures.js";
import { SubstitutionSession } from "#src/templates/GT-010/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return { ...actual, drawPriceTag: vi.fn(actual.drawPriceTag) };
});

/** Thẻ giá có xu thật trên bảng giá (`BR-E010-07`). */
const FIXTURE = GT010_FIXTURES[0] ?? failMissingFixture();
const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: false,
});
const SLOT: Slot = {
  index: 0,
  page: 0,
  role: "target",
  x: 300,
  y: 100,
  w: 220,
  h: 72,
  hitW: 220,
  hitH: 72,
};

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-010");
}

function openSession(fixture = FIXTURE): SubstitutionSession {
  const session = new SubstitutionSession(
    fixture.content,
    fixture.difficulty,
    0
  );
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, ZONES.stage);
  return session;
}

describe("priceCoinLayout (hàm thuần)", () => {
  it("số xu bằng đúng giá; giá vượt PRICE_COINS_MAX hoặc không dương thì không xu, không cắt bớt", () => {
    expect(priceCoinLayout(SLOT, 3)).toHaveLength(3);
    expect(priceCoinLayout(SLOT, PRICE_COINS_MAX)).toHaveLength(
      PRICE_COINS_MAX
    );
    expect(priceCoinLayout(SLOT, PRICE_COINS_MAX + 1)).toHaveLength(0);
    expect(priceCoinLayout(SLOT, 99)).toHaveLength(0);
    expect(priceCoinLayout(SLOT, 0)).toHaveLength(0);
    expect(priceCoinLayout(SLOT, -4)).toHaveLength(0);
  });

  it("xu nằm trong ô và không chồng nhau", () => {
    for (const value of [1, 4, 7, 10]) {
      const coins = priceCoinLayout(SLOT, value);
      for (const c of coins) {
        expect(c.x - c.r).toBeGreaterThanOrEqual(SLOT.x - SLOT.w / 2);
        expect(c.x + c.r).toBeLessThanOrEqual(SLOT.x + SLOT.w / 2);
        expect(c.y - c.r).toBeGreaterThanOrEqual(SLOT.y - SLOT.h / 2);
        expect(c.y + c.r).toBeLessThanOrEqual(SLOT.y + SLOT.h / 2);
      }
      for (let i = 1; i < coins.length; i++) {
        const a = coins[i - 1];
        const b = coins[i];
        if (a && b) {
          expect(b.x - a.x).toBeGreaterThanOrEqual(a.r + b.r);
        }
      }
    }
  });
});

describe("GT-010: bảng giá có xu thật (BR-E010-07)", () => {
  function tagValues(fixture: (typeof GT010_FIXTURES)[number]): number[] {
    const session = openSession(fixture);
    vi.mocked(drawPriceTag).mockClear();
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
    return vi.mocked(drawPriceTag).mock.calls.map((c) => c[2]);
  }

  it("mọi fixture: mỗi dòng luật một thẻ giá theo đúng giá; ô câu hỏi là thẻ trống, không xu", () => {
    for (const fixture of GT010_FIXTURES) {
      const values = tagValues(fixture);
      const expected = fixture.content.equations.map((e) => e.right_value);
      expect(values.slice(0, expected.length)).toEqual(expected);
      expect(values.slice(expected.length)).toEqual([0]);
    }
  });

  it("mọi fixture: tổng cần tìm không bao giờ thành số xu trên thẻ nào ngoài giá của chính dòng luật", () => {
    for (const fixture of GT010_FIXTURES) {
      const correct = fixture.content.options.find((o) => o.is_correct)?.value;
      const prices = fixture.content.equations.map((e) => e.right_value);
      const values = tagValues(fixture);
      // Thẻ câu hỏi luôn trống.
      expect(values.at(-1)).toBe(0);
      if (correct !== undefined && !prices.includes(correct)) {
        for (const v of values) {
          expect(v).not.toBe(correct);
        }
      }
    }
  });

  it("vùng chạm không đổi khi vẽ thẻ giá", () => {
    const session = openSession();
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });
});
