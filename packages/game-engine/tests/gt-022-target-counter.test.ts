import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawProgressDots } from "#src/render/shared-render";
import { RenderSystem } from "#src/systems/render-system";
import { GT022_FIXTURES } from "#src/templates/GT-022/fixtures.js";
import { GT022Session } from "#src/templates/GT-022/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";
import { collectRenderedText } from "./helpers/rendered-text.ts";

vi.mock("#src/render/shared-render", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/shared-render")>();
  return { ...actual, drawProgressDots: vi.fn(actual.drawProgressDots) };
});

/** BR-E022-09 — `show_target_counter` vẽ hàng chấm đích đã tìm, không chữ. */
function missing(): never {
  throw new Error("Thiếu fixture GT-022");
}
const fixture =
  GT022_FIXTURES.find(
    (f) => f.content.scene_objects.filter((o) => o.is_target).length >= 2
  ) ?? missing();
const STAGE = computeStageZones({
  logicW: 960,
  logicH: 540,
  ageBand: "4-5",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: false,
}).stage;
const TARGETS = fixture.content.scene_objects.filter((o) => o.is_target);

function open(show: boolean): GT022Session {
  const session = new GT022Session(
    fixture.content,
    { ...fixture.difficulty, show_target_counter: show },
    0
  );
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, STAGE);
  return session;
}

function dotsCalls(session: GT022Session): { done: number; total?: number }[] {
  vi.mocked(drawProgressDots).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 0);
  return vi.mocked(drawProgressDots).mock.calls.map((c) => c[2]);
}

describe("GT-022: show_target_counter (BR-E022-09)", () => {
  it("bật: một hàng chấm, số chấm bằng số đích, chưa chấm nào đặc", () => {
    expect(dotsCalls(open(true))).toEqual([{ done: 0, total: TARGETS.length }]);
  });

  it("bật: tìm ra một đích thì thêm đúng một chấm đặc; chạm lại không đổi", () => {
    const session = open(true);
    const first = TARGETS[0];
    if (!first) {
      missing();
    }
    session.onTapObject(first.id);
    session.onTapObject(first.id);
    expect(dotsCalls(session)).toEqual([{ done: 1, total: TARGETS.length }]);
  });

  it("tắt: không vẽ hàng chấm", () => {
    expect(dotsCalls(open(false))).toEqual([]);
  });

  it("bộ đếm không thêm chữ phải đọc", () => {
    const on = collectRenderedText(open(true), { prepare: false });
    const off = collectRenderedText(open(false), { prepare: false });
    expect(on).toEqual(off);
  });
});
