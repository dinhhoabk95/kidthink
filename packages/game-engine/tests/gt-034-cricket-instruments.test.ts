import { describe, expect, it, vi } from "vitest";
import {
  cricketArm,
  drawInstrumentGlyph,
  drawStoryCharacterInStage,
  instrumentGlyphKind,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT034_FIXTURES } from "#src/templates/GT-034/fixtures";
import { GT034Session } from "#src/templates/GT-034/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/craft-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/craft-shapes")>();
  return {
    ...actual,
    drawInstrumentGlyph: vi.fn(actual.drawInstrumentGlyph),
    drawStoryCharacterInStage: vi.fn(actual.drawStoryCharacterInStage),
  };
});

/** Nhạc cụ vẽ riêng, Dế Mèn gõ tay theo phách chỉ khi mẫu tự phát (`BR-E034-13`, `BR-E034-09`). */
const BEAT_MS = 750;

function build(index = 0): GT034Session {
  const f = GT034_FIXTURES[index];
  if (!f) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT034Session(f.content, f.difficulty);
  session.prepareRound("5-6");
  return session;
}

function arm(session: GT034Session, reduced = false): number | undefined {
  vi.mocked(drawStoryCharacterInStage).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs);
  const call = vi.mocked(drawStoryCharacterInStage).mock.calls[0];
  if (call?.[1] !== "cricket") {
    throw new Error("Không vẽ Dế Mèn");
  }
  return call[4]?.arm;
}

describe("hàm thuần", () => {
  it("cricketArm: hạ hết cỡ ở đầu phách, nhấc lại trước giữa phách", () => {
    expect(cricketArm(0)).toBe(1);
    expect(cricketArm(0.2)).toBeCloseTo(0.5, 5);
    expect(cricketArm(0.5)).toBe(0);
    expect(cricketArm(1)).toBe(0);
  });
  it("instrumentGlyphKind nhận id đã biết, lạ thì null", () => {
    expect(instrumentGlyphKind("drum")).toBe("drum");
    expect(instrumentGlyphKind("Clap")).toBe("clappers");
    expect(instrumentGlyphKind("mo")).toBe("woodfish");
    expect(instrumentGlyphKind("cymbal")).toBeNull();
  });
});

describe("GT-034: Dế Mèn gõ tay theo phách (BR-E034-13)", () => {
  it("chưa nghe mẫu: tay không gõ", () => {
    expect(arm(build()) ?? 0).toBe(0);
  });

  it("mẫu tự phát: tay hạ ở đầu phách rồi nhấc theo đồng hồ", () => {
    const session = build();
    session.dispatch({ type: "commit", timeMs: 0 });
    expect(arm(session)).toBe(1);
    session.update(BEAT_MS * 0.2);
    const mid = arm(session) ?? 0;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    session.update(BEAT_MS * 0.4);
    expect(arm(session) ?? 0).toBe(0);
  });

  it("reduced_motion: tay không gõ", () => {
    const session = build();
    session.dispatch({ type: "commit", timeMs: 0 });
    expect(arm(session, true) ?? 0).toBe(0);
  });

  it("lúc trẻ gõ: tay không gõ theo, không lộ phách (BR-E034-09)", () => {
    const session = build();
    const entity = session.getView().entities.find((v) => v.id === "drum");
    if (!entity) {
      throw new Error("Thiếu nhạc cụ drum");
    }
    session.dispatch({ type: "tap", x: entity.x, y: entity.y, timeMs: 100 });
    expect(arm(session) ?? 0).toBe(0);
  });

  it("mẫu gợi ý L3 tự phát: tay gõ; trẻ gõ một bước thì mẫu dừng và tay thôi gõ", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    expect(arm(session)).toBe(1);
    const entity = session.getView().entities.find((v) => v.id === "drum");
    if (!entity) {
      throw new Error("Thiếu nhạc cụ drum");
    }
    session.dispatch({ type: "tap", x: entity.x, y: entity.y, timeMs: 100 });
    expect(arm(session) ?? 0).toBe(0);
  });

  it("nhịp nghỉ của mẫu: tay không gõ", () => {
    const rest = GT034_FIXTURES.findIndex((f) =>
      f.content.target_pattern.includes(null)
    );
    const session = build(rest);
    session.dispatch({ type: "commit", timeMs: 0 });
    const pattern = session.content.target_pattern;
    const restStep = pattern.indexOf(null);
    const beatSec = 60 / session.content.tempo_bpm;
    session.update(restStep * beatSec * 1000 + 10);
    expect(arm(session) ?? 0).toBe(0);
  });
});

describe("GT-034: nhạc cụ vẽ riêng (BR-E034-13)", () => {
  it("id đã biết vẽ bằng hình riêng, id lạ vẫn dùng asset", () => {
    const session = build();
    vi.mocked(drawInstrumentGlyph).mockClear();
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    session.render(ctx as CanvasRenderingContext2D, new RenderSystem());
    const kinds = vi.mocked(drawInstrumentGlyph).mock.calls.map((c) => c[1]);
    // Fixture 0: drum (trống cơm) + cymbal (id lạ, giữ asset).
    expect(kinds).toEqual(["drum"]);
  });
});
