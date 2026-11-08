import { describe, expect, it, vi } from "vitest";
import type { Slot } from "#src/layout/types";
import {
  beadStringSegments,
  drawBeadString,
  drawStoryCharacterInStage,
  nightingaleSway,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT036_FIXTURES } from "#src/templates/GT-036/fixtures.js";
import {
  GT036_LIGHT_STEP_MS,
  GT036Session,
} from "#src/templates/GT-036/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawBeadString: vi.fn(actual.drawBeadString),
    drawStoryCharacterInStage: vi.fn(actual.drawStoryCharacterInStage),
  };
});

/** Họa Mi nhún theo nhịp mô-típ, dây xâu hạt nối các ô cùng hàng (`BR-E036-14`). */
function slot(index: number, x: number, y: number): Slot {
  return {
    index,
    x,
    y,
    w: 60,
    h: 60,
    hitW: 60,
    hitH: 60,
    page: 0,
    role: "target",
  };
}

describe("hàm thuần", () => {
  it("beadStringSegments chỉ nối ô liền nhau cùng hàng", () => {
    const segs = beadStringSegments([
      slot(0, 100, 100),
      slot(1, 200, 100),
      slot(2, 300, 100),
      slot(3, 100, 200),
      slot(4, 200, 200),
    ]);
    expect(segs).toHaveLength(3);
    expect(segs.every((s) => s.y1 === s.y2)).toBe(true);
  });
  it("nightingaleSway nhún theo từng bước, đứng yên ngoài dãy và khi reduced", () => {
    const step = GT036_LIGHT_STEP_MS;
    expect(nightingaleSway(step / 2, step, 3, false).bob).toBeLessThan(0);
    expect(nightingaleSway(0, step, 3, false).bob ?? 0).toBeCloseTo(0, 5);
    const a = nightingaleSway(step * 0.5, step, 3, false).lean ?? 0;
    const b = nightingaleSway(step * 1.5, step, 3, false).lean ?? 0;
    expect(a * b).toBeLessThan(0);
    expect(nightingaleSway(step * 3, step, 3, false)).toEqual({});
    expect(nightingaleSway(step / 2, step, 3, true)).toEqual({});
  });
});

function open(index: number): GT036Session {
  const f = GT036_FIXTURES[index];
  if (!f) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT036Session(f.content, f.difficulty, 0);
  session.prepareRound("5-6");
  return session;
}

function frame(session: GT036Session, reduced = false) {
  vi.mocked(drawBeadString).mockClear();
  vi.mocked(drawStoryCharacterInStage).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs);
  const call = vi.mocked(drawStoryCharacterInStage).mock.calls[0];
  return {
    kind: call?.[1],
    motion: call?.[4],
    strings: vi.mocked(drawBeadString).mock.calls.length,
  };
}

function fillTrack(session: GT036Session): void {
  const f = session.content;
  const pal = f.palette[0];
  if (!pal) {
    throw new Error("Thiếu palette");
  }
  session.commit({ type: "select_palette", data: { paletteId: pal.id } });
  for (let i = 0; i < f.track_length; i++) {
    session.commit({ type: "place_element", data: { slotIndex: i } });
  }
}

describe("GT-036: Họa Mi và dây xâu hạt (BR-E036-14)", () => {
  for (const [index] of GT036_FIXTURES.entries()) {
    it(`fixture ${index}: dây hạt vẽ một lần, Họa Mi đứng yên trước khi chốt`, () => {
      const session = open(index);
      const f = frame(session);
      expect(f.strings).toBe(1);
      expect(f.kind).toBe("nightingale");
      expect(f.motion).toEqual({});
    });
  }

  it("chốt xong: Họa Mi nhún theo từng bước sáng rồi đứng yên, reduced thì đứng yên", () => {
    const session = open(0);
    fillTrack(session);
    session.commit({ type: "submit_creation", data: {} });
    session.update(GT036_LIGHT_STEP_MS / 2);
    expect(frame(session).motion?.bob ?? 0).toBeLessThan(0);
    expect(frame(session, true).motion).toEqual({});
    session.update(GT036_LIGHT_STEP_MS * 40);
    expect(frame(session).motion).toEqual({});
  });
});
