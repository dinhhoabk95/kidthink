import { describe, expect, it, vi } from "vitest";
import {
  FIND_RING_SPARKLES,
  FIND_RING_SWEEP_MS,
  findRingPose,
} from "#src/render/slot-decor";
import { RenderSystem } from "#src/systems/render-system";
import { GT025_FIXTURES } from "#src/templates/GT-025/fixtures.js";
import { GT025Session } from "#src/templates/GT-025/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Vòng khoanh lấp lánh quanh điểm tìm ra (`BR-E025-07`). */
const FIXTURE = GT025_FIXTURES[1] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-025");
}
const RING_START = -Math.PI / 2;

function openSession(): GT025Session {
  const session = new GT025Session(FIXTURE.content, FIXTURE.difficulty);
  session.prepareRound("4-5");
  return session;
}

/** Góc quét (rad) của mọi vòng khoanh trong một khung — cung bắt đầu ở -π/2. */
function ringSweeps(
  session: GT025Session,
  rs: RenderSystem,
  timeMs: number
): number[] {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const sweeps: number[] = [];
  vi.spyOn(ctx, "arc").mockImplementation(
    (_x: number, _y: number, _r: number, start: number, end: number) => {
      if (start === RING_START) {
        sweeps.push(end - start);
      }
    }
  );
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return sweeps;
}

describe("findRingPose (hàm thuần)", () => {
  it("vòng khép dần, tia chưa sáng cho tới khi khép kín", () => {
    expect(findRingPose(0, false).sweep).toBe(0);
    const half = findRingPose(FIND_RING_SWEEP_MS / 2, false);
    expect(half.sweep).toBeCloseTo(0.5, 5);
    expect(half.sparkles.every((b) => b === 0)).toBe(true);
    expect(findRingPose(FIND_RING_SWEEP_MS, false).sweep).toBe(1);
  });

  it("sau khi khép, các tia nhấp nháy lệch pha trong 0..1", () => {
    const pose = findRingPose(FIND_RING_SWEEP_MS + 123, false);
    expect(pose.sparkles).toHaveLength(FIND_RING_SPARKLES);
    expect(
      new Set(pose.sparkles.map((b) => b.toFixed(3))).size
    ).toBeGreaterThan(1);
    for (const b of pose.sparkles) {
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(1);
    }
  });

  it("reduced-motion: trạng thái cuối tĩnh, mọi lúc giống nhau", () => {
    expect(findRingPose(0, true)).toEqual(findRingPose(5000, true));
    expect(findRingPose(0, true).sweep).toBe(1);
  });
});

describe("GT-025: session vẽ vòng khoanh (BR-E025-07)", () => {
  it("chưa tìm ra điểm nào thì không vòng nào — không lộ điểm chưa tìm", () => {
    const session = openSession();
    expect(ringSweeps(session, new RenderSystem(), 100)).toEqual([]);
  });

  it("tìm ra một điểm: vòng quanh cả hai vật, khép dần theo đồng hồ khung", () => {
    const session = openSession();
    const rs = new RenderSystem();
    session.render(
      createFakeCanvas(960, 540).getContext("2d") as CanvasRenderingContext2D,
      rs,
      1000
    );
    session.onTapObject("l-flower-2");

    const mid = ringSweeps(session, rs, 1000 + FIND_RING_SWEEP_MS / 2);
    expect(mid).toHaveLength(2);
    for (const sweep of mid) {
      expect(sweep).toBeCloseTo(Math.PI, 3);
    }
    const done = ringSweeps(session, rs, 1000 + FIND_RING_SWEEP_MS * 3);
    expect(done).toHaveLength(2);
    for (const sweep of done) {
      expect(sweep).toBeCloseTo(Math.PI * 2, 3);
    }
  });

  it("mỗi điểm tìm thêm có thêm hai vòng", () => {
    const session = openSession();
    const rs = new RenderSystem();
    session.onTapObject("l-flower-2");
    session.onTapObject("l-bird");

    expect(ringSweeps(session, rs, 5000)).toHaveLength(4);
  });

  it("chạm sai không có vòng", () => {
    const session = openSession();
    session.onTapObject("l-flower-1");

    expect(ringSweeps(session, new RenderSystem(), 100)).toEqual([]);
  });

  it("reduced-motion: vòng đầy ngay khung đầu", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    session.onTapObject("l-flower-2");

    const sweeps = ringSweeps(session, rs, 0);
    expect(sweeps).toHaveLength(2);
    for (const sweep of sweeps) {
      expect(sweep).toBeCloseTo(Math.PI * 2, 3);
    }
  });
});
