import { describe, expect, it, vi } from "vitest";
import { RenderSystem } from "#src/systems/render-system";
import { GT032_FIXTURES } from "#src/templates/GT-032/fixtures";
import { GT032Session } from "#src/templates/GT-032/session";
import { createFakeCanvas } from "../gates/fake-canvas.ts";

/**
 * Task #313 — GT-032 `N5`: `L1` vạch đơn vị · `L2` số vạch có nước dưới mỗi cốc ·
 * `L3` hai cột nước tách khỏi cốc xếp cạnh nhau (`BR-E032-10`).
 */
const DIGITS = /^\d+$/;
const found = GT032_FIXTURES.find(
  (f) => f.content.question_type !== "pour_to_mark"
);
if (!found) {
  throw new Error("Thiếu fixture so sánh");
}
const compare = found;

function build(): GT032Session {
  const session = new GT032Session(compare.content, compare.difficulty, 1);
  session.prepareRound("5-6");
  return session;
}

interface Frame {
  readonly texts: string[];
  readonly columnWidths: number[];
  readonly tickLines: number;
}

function frame(session: GT032Session, timeMs: number, reduced = false): Frame {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const texts: string[] = [];
  const columnWidths: number[] = [];
  let tickLines = 0;
  vi.spyOn(ctx, "fillText").mockImplementation((t: string) => {
    texts.push(t);
  });
  vi.spyOn(ctx, "roundRect").mockImplementation(
    (_x: number, _y: number, w: number) => {
      columnWidths.push(w);
    }
  );
  vi.spyOn(ctx, "lineTo").mockImplementation(() => {
    tickLines += 1;
  });
  const rs = new RenderSystem();
  rs.reducedMotion = reduced;
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return { texts, columnWidths, tickLines };
}

const digits = (texts: readonly string[]) =>
  texts.filter((t) => DIGITS.test(t));

describe("GT-032 — thang hint L1/L2/L3 (N5)", () => {
  it("chưa có hint: không vạch, không số, không cột tách", () => {
    const f = frame(build(), 0);
    expect(digits(f.texts)).toEqual([]);
    expect(f.columnWidths.filter((w) => w === 36)).toEqual([]);
  });

  it("L1: vẽ vạch đơn vị, chưa hiện số", () => {
    const base = frame(build(), 0);
    const session = build();
    session.getHintTargetForLevel(1);
    const f = frame(session, 0);
    expect(f.tickLines).toBeGreaterThan(base.tickLines);
    expect(digits(f.texts)).toEqual([]);
  });

  it("L2: số vạch có nước hiện dưới mỗi cốc", () => {
    const session = build();
    session.getHintTargetForLevel(2);
    const f = frame(session, 0);
    expect(digits(f.texts)).toEqual(
      compare.content.cups.map((c) => String(c.fill_units))
    );
  });

  it("L3: cột nước tách khỏi cốc, xếp cạnh nhau đúng bề ngang chung; chậm dần rồi dừng", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    const start = frame(session, 1000);
    const end = frame(session, 1000 + 5000);
    const n = compare.content.cups.length;
    expect(end.columnWidths.filter((w) => w === 36)).toHaveLength(n);
    expect(start.columnWidths.filter((w) => w === 36)).toHaveLength(0);
  });

  it("L3 với giảm chuyển động: xếp cạnh nhau ngay, không tween", () => {
    const session = build();
    session.getHintTargetForLevel(3);
    const f = frame(session, 1000, true);
    expect(f.columnWidths.filter((w) => w === 36)).toHaveLength(
      compare.content.cups.length
    );
  });

  it("chọn một cốc thì hint về L0 (không vạch/số/cột)", () => {
    const session = build();
    session.getHintTargetForLevel(2);
    const cup = compare.content.cups[0];
    if (!cup) {
      throw new Error("Thiếu cốc");
    }
    session.dispatch({
      type: "tap",
      x: session.slots[0]?.x ?? 0,
      y: session.slots[0]?.y ?? 0,
      timeMs: 5,
    });
    expect(digits(frame(session, 100).texts)).toEqual([]);
  });
});
