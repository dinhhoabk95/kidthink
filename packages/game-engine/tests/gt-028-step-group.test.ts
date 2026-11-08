import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import { drawStepGroupIcon } from "#src/render/number-line";
import { RenderSystem } from "#src/systems/render-system";
import { GT028_FIXTURES } from "#src/templates/GT-028/fixtures";
import { GT028Session } from "#src/templates/GT-028/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/number-line", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/number-line")>();
  return { ...actual, drawStepGroupIcon: vi.fn(actual.drawStepGroupIcon) };
});

/** Mỗi vật đã chọn mang một nhóm theo `step` (`BR-E028-09`). */
const STAGE = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "4-5",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: true,
}).stage;

function drawnSteps(
  fixtureIndex: number,
  picks: number
): { steps: number[]; session: GT028Session } {
  const fixture = GT028_FIXTURES[fixtureIndex];
  if (!fixture) {
    throw new Error("Thiếu fixture");
  }
  const session = new GT028Session(fixture.content, fixture.difficulty, 0);
  session.prepareRound("4-5", DEFAULT_LOGIC_SPACE, STAGE);
  for (const item of fixture.content.items.slice(0, picks)) {
    session.onTapItem(item.item_id);
  }
  vi.mocked(drawStepGroupIcon).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 5000);
  return {
    steps: vi.mocked(drawStepGroupIcon).mock.calls.map((c) => c[4]),
    session,
  };
}

describe("GT-028: nhóm theo step trên vật đã chọn (BR-E028-09)", () => {
  it("chưa chọn: không vẽ nhóm nào", () => {
    expect(drawnSteps(0, 0).steps).toEqual([]);
  });

  it("step 2: mỗi vật chọn một đôi tất", () => {
    expect(drawnSteps(0, 3).steps).toEqual([2, 2, 2]);
  });

  it("step 5: mỗi vật chọn một bàn tay", () => {
    expect(drawnSteps(1, 2).steps).toEqual([5, 5]);
  });

  it("bỏ chọn thì nhóm biến mất cùng vật", () => {
    const fixture = GT028_FIXTURES[0];
    if (!fixture) {
      throw new Error("Thiếu fixture");
    }
    const first = fixture.content.items[0];
    const { session } = drawnSteps(0, 1);
    if (first) {
      session.onTapItem(first.item_id);
    }
    vi.mocked(drawStepGroupIcon).mockClear();
    const ctx = createFakeCanvas(960, 540).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    session.render(ctx as CanvasRenderingContext2D, new RenderSystem(), 6000);
    expect(vi.mocked(drawStepGroupIcon).mock.calls).toHaveLength(0);
  });

  it("vùng chạm không đổi: vẽ nhóm không dời slot", () => {
    const { session } = drawnSteps(0, 2);
    const before = session.slots.map((s) => ({
      x: s.x,
      y: s.y,
      w: s.hitW,
      h: s.hitH,
    }));
    drawnSteps(0, 2);
    expect(
      session.slots.map((s) => ({ x: s.x, y: s.y, w: s.hitW, h: s.hitH }))
    ).toEqual(before);
  });
});
