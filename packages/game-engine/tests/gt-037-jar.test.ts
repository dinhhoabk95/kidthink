import { describe, expect, it, vi } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { JAR_STAR_FLIGHT_MS } from "#src/render/container-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT037Session } from "#src/templates/GT-037/session";
import type {
  GT037Content,
  GT037Difficulty,
} from "#src/templates/GT-037/template";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

const CONTENT: GT037Content = {
  prompt: "Con tìm hết số 3 nhé",
  symbols: [
    { id: "sym-target", asset: { kind: "text", text: "3" } },
    { id: "sym-distractor", asset: { kind: "text", text: "5" } },
    { id: "sym-other", asset: { kind: "text", text: "7" } },
  ],
  target_ids: ["sym-target"],
  target_copies: 4,
  item_count: 10,
  confusable_ids: [],
};

const BAND: AgeBand = "5-6";

interface Frame {
  readonly session: GT037Session;
  readonly rs: RenderSystem;
  readonly ctx: CanvasRenderingContext2D;
}

function openFrame(difficulty: GT037Difficulty = {}): Frame {
  const space = deriveLogicSpace(1024, 640);
  const cssPerLogic = 1024 / space.w;
  const zones = computeStageZones({
    logicW: space.w,
    logicH: space.h,
    ageBand: BAND,
    cssPerLogic,
    needsTray: false,
    needsCommit: false,
  });
  const session = new GT037Session(CONTENT, difficulty, 7);
  session.prepareRound(BAND, space, zones.stage, undefined, cssPerLogic);
  const rs = new RenderSystem();
  rs.logicSpace = space;
  const ctx = createFakeCanvas(1024, 640).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  return { session, rs, ctx: ctx as CanvasRenderingContext2D };
}

function targetIndexes(session: GT037Session): number[] {
  const out: number[] = [];
  session.boardSymbols.forEach((sym, i) => {
    if (session.targetSet.has(sym.id)) {
      out.push(i);
    }
  });
  return out;
}

function tapTarget(session: GT037Session, nth: number): void {
  const slotIndex = targetIndexes(session)[nth] ?? -1;
  const symbolId = session.boardSymbols[slotIndex]?.id ?? "";
  session.commit({ type: "tap_symbol", data: { slotIndex, symbolId } });
}

/** Chiều cao các lần tô chữ nhật (phần nước của lọ) trong một khung. */
function jarFillHeights(frame: Frame, timeMs: number): number[] {
  const heights: number[] = [];
  vi.spyOn(frame.ctx, "fillRect").mockImplementation(
    (_x: number, _y: number, w: number, h: number) => {
      // Nền cảnh tô cả khung; nước trong lọ chỉ rộng cỡ một ô.
      if (w < frame.rs.LOGIC_WIDTH / 2) {
        heights.push(h);
      }
    }
  );
  frame.session.render(frame.ctx, frame.rs, timeMs);
  return heights;
}

function lineToCount(frame: Frame, timeMs: number): number {
  let count = 0;
  vi.spyOn(frame.ctx, "lineTo").mockImplementation(() => {
    count++;
  });
  frame.session.render(frame.ctx, frame.rs, timeMs);
  return count;
}

describe("GT-037: lọ đầy dần và sao bay vào lọ (BR-E037-14)", () => {
  it("chưa tìm ô nào thì lọ rỗng, không có sao bay", () => {
    const frame = openFrame();
    expect(jarFillHeights(frame, 0)).toEqual([]);
  });

  it("lọ chỉ dâng sau khi sao bay tới miệng lọ", () => {
    const frame = openFrame();
    frame.session.update(0);
    tapTarget(frame.session, 0);

    expect(jarFillHeights(frame, 100)).toEqual([]);
    expect(jarFillHeights(frame, JAR_STAR_FLIGHT_MS + 50)).toHaveLength(1);
  });

  it("sao bay được vẽ giữa chuyến bay và biến mất sau đó", () => {
    const frame = openFrame();
    tapTarget(frame.session, 0);
    const mid = lineToCount(frame, JAR_STAR_FLIGHT_MS / 2);
    const after = lineToCount(frame, JAR_STAR_FLIGHT_MS + 50);

    expect(mid).toBeGreaterThan(after);
  });

  it("mỗi ô đích thêm làm lọ đầy thêm", () => {
    const frame = openFrame();
    tapTarget(frame.session, 0);
    const [one] = jarFillHeights(frame, JAR_STAR_FLIGHT_MS + 50);
    tapTarget(frame.session, 1);
    const two = jarFillHeights(frame, 2 * JAR_STAR_FLIGHT_MS + 100);

    expect(two[0] ?? 0).toBeGreaterThan(one ?? 0);
  });

  it("reduced-motion: không có sao bay, lọ nhảy thẳng tới mức cuối", () => {
    const frame = openFrame();
    frame.rs.reducedMotion = true;
    tapTarget(frame.session, 0);

    expect(jarFillHeights(frame, 10)).toHaveLength(1);
    expect(lineToCount(frame, 10)).toBe(lineToCount(frame, 5000));
  });

  it("chạm nhầm ô sai không làm lọ đầy", () => {
    const frame = openFrame();
    const wrong = frame.session.boardSymbols.findIndex(
      (s) => !frame.session.targetSet.has(s.id)
    );
    frame.session.commit({
      type: "tap_symbol",
      data: { slotIndex: wrong, symbolId: "sym-distractor" },
    });

    expect(jarFillHeights(frame, JAR_STAR_FLIGHT_MS + 50)).toEqual([]);
  });

  it("không lộ tổng (declare): mức đầy sau mọi sao đều thấp hơn lọ đầy", () => {
    const shown = openFrame({ finish_mode: "auto" });
    const hidden = openFrame({ finish_mode: "declare" });
    for (const frame of [shown, hidden]) {
      for (let i = 0; i < 4; i++) {
        tapTarget(frame.session, i);
      }
    }
    const [shownFill] = jarFillHeights(shown, 5000);
    const [hiddenFill] = jarFillHeights(hidden, 5000);

    expect(hiddenFill ?? 0).toBeLessThan(shownFill ?? 0);
  });
});
