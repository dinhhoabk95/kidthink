import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { splitCaption } from "#src/layout/slot-fit";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawProgressDots } from "#src/render/shared-render";
import { drawEmptyTargetSlot } from "#src/render/slot-decor";
import { RenderSystem } from "#src/systems/render-system";
import { GT023_FIXTURES } from "#src/templates/GT-023/fixtures.js";
import { GT023Session } from "#src/templates/GT-023/session.js";
import { GT024_FIXTURES } from "#src/templates/GT-024/fixtures.js";
import { GT024Session } from "#src/templates/GT-024/session.js";
import { GT025_FIXTURES } from "#src/templates/GT-025/fixtures.js";
import { GT025Session } from "#src/templates/GT-025/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

function missing(message: string): never {
  throw new Error(message);
}

const DIGITS_ONLY = /^\d+$/;

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return {
    ...actual,
    drawProgressDots: vi.fn(actual.drawProgressDots),
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

/**
 * Task #313 — cờ trong `difficulty_params` mà spec nói có tác dụng thì phải có
 * tác dụng thật. Mỗi describe khoá một trường: bật thì hiện, tắt thì ẩn.
 */

const STAGE = computeStageZones({
  logicW: 960,
  logicH: 540,
  ageBand: "4-5",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: false,
}).stage;

interface DrawnFrame {
  readonly texts: string[];
  readonly dashes: number[][];
}

function drawFrame(
  render: (ctx: CanvasRenderingContext2D, rs: RenderSystem) => void
): DrawnFrame {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const texts: string[] = [];
  const dashes: number[][] = [];
  vi.spyOn(ctx, "fillText").mockImplementation((text: string) => {
    texts.push(text);
  });
  vi.spyOn(ctx, "setLineDash").mockImplementation((segments: number[]) => {
    if (segments.length > 0) {
      dashes.push([...segments]);
    }
  });
  render(ctx as CanvasRenderingContext2D, new RenderSystem());
  return { texts, dashes };
}

describe("GT-024 — show_guide_lines và show_numbered_dots (GT-024.md N1, mục 11)", () => {
  const fixture = GT024_FIXTURES[0] ?? missing("Thiếu fixture GT-024");

  function frameWith(flags: {
    show_guide_lines: boolean;
    show_numbered_dots: boolean;
  }): DrawnFrame {
    const session = new GT024Session(
      fixture.content,
      { ...fixture.difficulty, ...flags },
      0
    );
    session.prepareRound("5-6");
    return drawFrame((ctx, rs) => session.render(ctx, rs, 0));
  }

  const digits = (frame: DrawnFrame): string[] =>
    frame.texts.filter((t) => DIGITS_ONLY.test(t));

  it("bật cả hai: có đường dẫn nét đứt và số thứ tự trên mọi điểm mốc", () => {
    const frame = frameWith({
      show_guide_lines: true,
      show_numbered_dots: true,
    });
    expect(frame.dashes.length).toBeGreaterThan(0);
    expect(digits(frame)).toHaveLength(fixture.content.waypoints.length);
  });

  it("tắt show_guide_lines: không còn đường dẫn nét đứt, số vẫn hiện", () => {
    const frame = frameWith({
      show_guide_lines: false,
      show_numbered_dots: true,
    });
    expect(frame.dashes).toEqual([]);
    expect(digits(frame)).toHaveLength(fixture.content.waypoints.length);
  });

  it("tắt show_numbered_dots: không còn số thứ tự, đường dẫn vẫn hiện", () => {
    const frame = frameWith({
      show_guide_lines: true,
      show_numbered_dots: false,
    });
    expect(digits(frame)).toEqual([]);
    expect(frame.dashes.length).toBeGreaterThan(0);
  });
});

describe("GT-023 — show_anchor_outline (GT-023.md N1, mục 11)", () => {
  const fixture =
    GT023_FIXTURES.find((f) => f.content.parts.length >= 2) ??
    missing("Thiếu fixture GT-023 nhiều mảnh");

  function outlineDraws(showAnchorOutline: boolean): number {
    const session = new GT023Session(
      fixture.content,
      { ...fixture.difficulty, show_anchor_outline: showAnchorOutline },
      0
    );
    session.prepareRound("5-6");
    vi.mocked(drawEmptyTargetSlot).mockClear();
    drawFrame((ctx, rs) => session.render(ctx, rs, 0));
    return vi.mocked(drawEmptyTargetSlot).mock.calls.length;
  }

  it("bật: mỗi mỏ neo trống có một khung viền", () => {
    expect(outlineDraws(true)).toBe(fixture.content.anchors.length);
  });

  it("tắt: không vẽ khung viền mỏ neo nào", () => {
    expect(outlineDraws(false)).toBe(0);
  });
});

describe("GT-025 — show_counter / show_difference_counter (GT-025.md N1, mục 11)", () => {
  const fixture = GT025_FIXTURES[1] ?? missing("Thiếu fixture GT-025");

  function counterCalls(flags: {
    show_counter?: boolean;
    show_difference_counter?: boolean;
  }): { done: number; total?: number }[] {
    const session = new GT025Session(
      fixture.content,
      { ...fixture.difficulty, ...flags },
      0
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, STAGE);
    vi.mocked(drawProgressDots).mockClear();
    drawFrame((ctx, rs) => session.render(ctx, rs, 0));
    return vi.mocked(drawProgressDots).mock.calls.map((c) => c[2]);
  }

  it("bật: một hàng chấm 0/target_count điểm khác biệt", () => {
    const calls = counterCalls({ show_counter: true });
    expect(calls).toHaveLength(1);
    expect(calls[0]?.done).toBe(0);
    expect(calls[0]?.total).toBe(fixture.content.target_count);
  });

  it("tắt show_counter: không vẽ bộ đếm", () => {
    expect(counterCalls({ show_counter: false })).toEqual([]);
  });

  it("show_difference_counter tường minh thắng show_counter (bí danh cũ của nội dung đã seed)", () => {
    expect(
      counterCalls({ show_counter: true, show_difference_counter: false })
    ).toEqual([]);
    expect(
      counterCalls({ show_counter: false, show_difference_counter: true })
    ).toHaveLength(1);
  });

  it("bộ đếm nằm trong dải nhãn: không slot nào chồng lên dải đó", () => {
    const session = new GT025Session(
      fixture.content,
      { ...fixture.difficulty, show_counter: true },
      0
    );
    session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, STAGE);
    const captionBottom = STAGE.y + splitCaption(STAGE).caption.h;
    for (const slot of session.slots) {
      expect(slot.y - slot.h / 2).toBeGreaterThanOrEqual(captionBottom - 1);
    }
  });
});
