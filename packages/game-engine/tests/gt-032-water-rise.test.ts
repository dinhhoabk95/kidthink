import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  drawLiquidCup,
  drawStoryCharacterInStage,
  PONY_DRINK_MS,
  ponyDrinkMotion,
  WATER_RISE_MS,
  waterRiseLevel,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures.js";
import { GT032Session } from "#src/templates/GT-032/session.js";
import { GT032ContentSchema } from "#src/templates/GT-032/template.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawLiquidCup: vi.fn(actual.drawLiquidCup),
    drawStoryCharacterInStage: vi.fn(actual.drawStoryCharacterInStage),
  };
});

/** Nước dâng trong cốc theo từng nấc rót, Ngựa Con cúi uống (`BR-E032-14`). */
function failMissingFixture(): never {
  throw new Error("Thiếu fixture");
}
const FIXTURE = GT032_FIXTURES[0] ?? failMissingFixture();

function openPour(): GT032Session {
  const content = GT032ContentSchema.parse({
    prompt: "Bé hãy rót nước đến vạch 4 cho chiếc cốc nhé!",
    question_type: "pour_to_mark",
    conservation_trap: false,
    cups: [
      {
        cup_id: "cup_pour",
        shape: "standard",
        capacity_units: 6,
        fill_units: 2,
        target_units: 4,
        color: "sky",
      },
      {
        cup_id: "cup_ref",
        shape: "narrow_tall",
        capacity_units: 6,
        fill_units: 4,
        target_units: 4,
        color: "sky",
      },
    ],
  });
  const session = new GT032Session(content, FIXTURE.difficulty, 0);
  const zones = computeStageZones({
    logicW: DEFAULT_LOGIC_SPACE.w,
    logicH: DEFAULT_LOGIC_SPACE.h,
    ageBand: "5-6",
    cssPerLogic: 1,
    needsTray: false,
    needsCommit: true,
  });
  session.prepareRound("5-6", DEFAULT_LOGIC_SPACE, zones.stage);
  return session;
}

function frame(session: GT032Session, timeMs: number, reduced = false) {
  vi.mocked(drawLiquidCup).mockClear();
  vi.mocked(drawStoryCharacterInStage).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  const fills = vi
    .mocked(drawLiquidCup)
    .mock.calls.map((c) => [c[3].cupId, c[3].fillUnits] as const);
  return {
    fill: fills.find(([id]) => id === "cup_pour")?.[1],
    motion: vi.mocked(drawStoryCharacterInStage).mock.calls[0]?.[4],
    kind: vi.mocked(drawStoryCharacterInStage).mock.calls[0]?.[1],
  };
}

describe("hàm thuần", () => {
  it("waterRiseLevel dâng êm từ from tới to rồi đứng", () => {
    expect(waterRiseLevel(2, 3, 0, false)).toBe(2);
    const mid = waterRiseLevel(2, 3, WATER_RISE_MS / 2, false);
    expect(mid).toBeGreaterThan(2);
    expect(mid).toBeLessThan(3);
    expect(waterRiseLevel(2, 3, WATER_RISE_MS, false)).toBe(3);
    expect(waterRiseLevel(3, 2, WATER_RISE_MS / 2, false)).toBeLessThan(3);
    expect(waterRiseLevel(2, 3, 0, true)).toBe(3);
  });
  it("ponyDrinkMotion cúi rồi ngẩng, ngoài nhịp hoặc reduced thì đứng yên", () => {
    expect(ponyDrinkMotion(PONY_DRINK_MS / 2, false).lean).toBeGreaterThan(0);
    expect(ponyDrinkMotion(0, false).lean).toBeCloseTo(0, 5);
    expect(ponyDrinkMotion(PONY_DRINK_MS, false)).toEqual({});
    expect(ponyDrinkMotion(PONY_DRINK_MS / 2, true)).toEqual({});
  });
});

describe("GT-032: nước dâng và Ngựa Con (BR-E032-14)", () => {
  it("chưa rót: mực nước đúng fill ban đầu, Ngựa Con đứng yên", () => {
    const session = openPour();
    const a = frame(session, 0);
    expect(a.fill).toBe(2);
    expect(a.kind).toBe("pony");
    expect(a.motion).toEqual({});
  });

  it("rót một nấc: mực dâng từ 2 lên 3 qua các giá trị lẻ rồi đứng ở 3", () => {
    const session = openPour();
    frame(session, 0);
    session.commit({
      type: "adjust_cup",
      data: { cup_id: "cup_pour", delta: 1 },
    });
    const start = frame(session, 1000);
    const mid = frame(session, 1000 + WATER_RISE_MS / 2);
    const end = frame(session, 1000 + WATER_RISE_MS + 1);
    expect(start.fill).toBe(2);
    expect(mid.fill).toBeGreaterThan(2);
    expect(mid.fill).toBeLessThan(3);
    expect(end.fill).toBe(3);
  });

  it("rót xong Ngựa Con cúi uống đúng một nhịp theo đồng hồ khung", () => {
    const session = openPour();
    frame(session, 0);
    session.commit({
      type: "adjust_cup",
      data: { cup_id: "cup_pour", delta: 1 },
    });
    session.update(0);
    const mid = frame(session, PONY_DRINK_MS / 2);
    expect(mid.motion?.lean ?? 0).toBeGreaterThan(0);
    const after = frame(session, PONY_DRINK_MS + 10);
    expect(after.motion).toEqual({});
  });

  it("reduced_motion: nước nhảy thẳng tới mực mới, Ngựa Con đứng yên", () => {
    const session = openPour();
    frame(session, 0, true);
    session.commit({
      type: "adjust_cup",
      data: { cup_id: "cup_pour", delta: 1 },
    });
    const r = frame(session, 10, true);
    expect(r.fill).toBe(3);
    expect(r.motion).toEqual({});
  });

  it("rót đúng hay chưa tới vạch như nhau: nước dâng cùng nhịp, cùng chuyển động Ngựa Con", () => {
    const a = openPour();
    const b = openPour();
    frame(a, 0);
    frame(b, 0);
    a.commit({ type: "adjust_cup", data: { cup_id: "cup_pour", delta: 1 } });
    b.commit({
      type: "adjust_cup",
      data: { cup_id: "cup_pour", fill_units: 4 },
    });
    const fa = frame(a, 100);
    const fb = frame(b, 100);
    expect(fa.motion).toEqual(fb.motion);
  });
});
