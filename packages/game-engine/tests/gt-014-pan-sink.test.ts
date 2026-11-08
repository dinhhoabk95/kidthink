import { describe, expect, it, vi } from "vitest";
import { DEFAULT_LOGIC_SPACE } from "#src/layout/constants";
import { computeStageZones } from "#src/layout/stage-zones";
import {
  approachPanSink,
  drawBalanceScale,
  PAN_SINK_MAX_FRACTION,
  panSinkPx,
  panSinkTarget,
} from "#src/render/board-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT014_FIXTURES } from "#src/templates/GT-014/fixtures.js";
import { BalanceScaleSession } from "#src/templates/GT-014/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

vi.mock("#src/render/board-shapes", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("#src/render/board-shapes")>();
  return { ...actual, drawBalanceScale: vi.fn(actual.drawBalanceScale) };
});

/** Đĩa cân lún theo khối lượng vật đã đặt (`BR-E014-07`). */
const ZONES = computeStageZones({
  logicW: DEFAULT_LOGIC_SPACE.w,
  logicH: DEFAULT_LOGIC_SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: true,
  trayItems: 4,
  needsCommit: false,
});

function openSession(
  fixture: (typeof GT014_FIXTURES)[number]
): BalanceScaleSession {
  const session = new BalanceScaleSession(
    fixture.content,
    fixture.difficulty,
    0
  );
  session.prepareRound(
    "5-6",
    DEFAULT_LOGIC_SPACE,
    ZONES.stage,
    ZONES.tray ?? undefined
  );
  return session;
}

function frame(
  session: BalanceScaleSession,
  rs: RenderSystem,
  timeMs: number
): void {
  vi.mocked(drawBalanceScale).mockClear();
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
}

describe("panSinkTarget / approachPanSink / panSinkPx (hàm thuần)", () => {
  it("không vật hoặc đầu vào xấu: không lún", () => {
    expect(panSinkTarget(0, 10)).toBe(0);
    expect(panSinkTarget(5, 0)).toBe(0);
  });

  it("tăng theo khối lượng trên đĩa, kẹp ở 1", () => {
    expect(panSinkTarget(8, 10)).toBeGreaterThan(panSinkTarget(2, 10));
    expect(panSinkTarget(999, 10)).toBe(1);
  });

  it("đổi ra px: tối đa PAN_SINK_MAX_FRACTION × chiều cao đĩa", () => {
    expect(panSinkPx(1, 40)).toBeCloseTo(40 * PAN_SINK_MAX_FRACTION, 9);
    expect(panSinkPx(0, 40)).toBe(0);
    expect(panSinkPx(2, 40)).toBe(panSinkPx(1, 40));
  });

  it("tiến dần tới đích, không vượt", () => {
    let v = 0;
    const seen: number[] = [];
    for (let i = 0; i < 60; i++) {
      v = approachPanSink(v, 0.6, 16);
      seen.push(v);
    }
    expect(seen[0]).toBeGreaterThan(0);
    expect(seen[0]).toBeLessThan(0.6);
    expect(Math.max(...seen)).toBe(0.6);
    expect(approachPanSink(0.6, 0, 5000)).toBe(0);
  });
});

describe("GT-014: đĩa lún (BR-E014-07)", () => {
  it("mọi fixture: độ lún đích mỗi đĩa chỉ theo vật đang nằm trên đĩa đó", () => {
    for (const fixture of GT014_FIXTURES) {
      const session = openSession(fixture);
      frame(session, new RenderSystem(), 0);
      const empty = session.getPanSinkTarget();
      // Khi mở bài, mức lún đang vẽ đã đứng ở đích (không trượt từ 0).
      expect(session.getPanSink()).toEqual(empty);
      const first = fixture.content.tray[0];
      if (!first || fixture.content.goal !== "balance") {
        continue;
      }
      session.placeItem(first.item_id, "left");
      const after = session.getPanSinkTarget();
      expect(after.left).toBeGreaterThan(empty.left);
      expect(after.right).toBe(empty.right);
    }
  });

  it("đĩa lún dần theo đồng hồ khung khi đặt thêm vật; reduced_motion về đích ngay", () => {
    const fixture = GT014_FIXTURES.find(
      (f) => f.content.goal === "balance" && f.content.tray.length > 0
    );
    const item = fixture?.content.tray[0];
    if (!(fixture && item)) {
      throw new Error("Thiếu fixture goal balance");
    }
    const session = openSession(fixture);
    frame(session, new RenderSystem(), 0);
    const before = session.getPanSink();
    session.placeItem(item.item_id, "left");
    session.update(16);
    const mid = session.getPanSink();
    expect(mid.left).toBeGreaterThan(before.left);
    const finalTarget = session.getPanSinkTarget().left;
    expect(mid.left).toBeLessThan(finalTarget);

    frame(session, new RenderSystem(), 100);
    const drawn = vi.mocked(drawBalanceScale).mock.calls.at(-1)?.[5];
    expect(drawn?.left).toBeCloseTo(mid.left, 9);

    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(session, rs, 200);
    expect(
      vi.mocked(drawBalanceScale).mock.calls.at(-1)?.[5]?.left
    ).toBeCloseTo(session.getPanSinkTarget().left, 9);
  });

  it("vùng chạm không đổi khi vẽ", () => {
    for (const fixture of GT014_FIXTURES) {
      const session = openSession(fixture);
      const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
      frame(session, new RenderSystem(), 100);
      expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
        before
      );
    }
  });
});
