import { describe, expect, it, vi } from "vitest";
import {
  CURTAIN_OPEN_MS,
  curtainGeometry,
  curtainOpenness,
  drawCurtains,
} from "#src/render/craft-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT000_FIXTURES } from "#src/templates/GT-000/fixtures.js";
import { GT000Session } from "#src/templates/GT-000/session.js";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Rèm sân khấu của bước recall (`BR-E000-16`). */
const FIXTURE = GT000_FIXTURES[0] ?? failMissingFixture();
const ROW = [
  { x: 100, y: 200, w: 80, h: 80 },
  { x: 220, y: 200, w: 80, h: 80 },
  { x: 340, y: 200, w: 80, h: 80 },
];

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-000");
}

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return (
    a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
  );
}

describe("curtainOpenness (hàm thuần)", () => {
  it("đi từ 0 tới 1 đơn điệu rồi đứng ở 1", () => {
    expect(curtainOpenness(0, false)).toBe(0);
    let prev = 0;
    for (let ms = 50; ms <= CURTAIN_OPEN_MS; ms += 50) {
      const v = curtainOpenness(ms, false);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
    expect(curtainOpenness(CURTAIN_OPEN_MS, false)).toBe(1);
    expect(curtainOpenness(CURTAIN_OPEN_MS * 3, false)).toBe(1);
  });

  it("reduced-motion: mở hẳn ngay", () => {
    expect(curtainOpenness(0, true)).toBe(1);
  });
});

describe("curtainGeometry (hàm thuần)", () => {
  it("khép kín phủ kín hàng vật", () => {
    const g = curtainGeometry(ROW, 800, 0);
    const left = g?.left;
    const right = g?.right;
    expect(left).toBeTruthy();
    expect(right).toBeTruthy();
    if (left && right) {
      expect(left.x).toBeLessThanOrEqual(ROW[0]?.x ?? 0);
      expect(right.x + right.w).toBeGreaterThanOrEqual(420);
      expect(left.x + left.w).toBeCloseTo(right.x, 6);
    }
  });

  it("mở hẳn không chạm vùng chạm nào, trong bề ngang logic", () => {
    const g = curtainGeometry(ROW, 800, 1);
    for (const d of [g?.left, g?.right]) {
      if (!d) {
        continue;
      }
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x + d.w).toBeLessThanOrEqual(800);
      for (const r of ROW) {
        expect(overlaps(d, r)).toBe(false);
      }
    }
  });

  it("không có vật thì không có rèm", () => {
    expect(curtainGeometry([], 800, 0)).toBeNull();
  });
});

describe("drawCurtains", () => {
  it("vẽ bằng fillRect: mỗi tấm một hình và một thanh treo", () => {
    const ctx = createFakeCanvas(800, 600).getContext("2d");
    if (!ctx) {
      throw new Error("Không lấy được context");
    }
    const fr = vi.spyOn(ctx, "fillRect");
    const g = curtainGeometry(ROW, 800, 0.5);
    if (!g) {
      throw new Error("Thiếu rèm");
    }
    drawCurtains(ctx as CanvasRenderingContext2D, g);
    expect(fr.mock.calls.length).toBe(3);
  });
});

function openSession(): GT000Session {
  const session = new GT000Session(FIXTURE.content, FIXTURE.difficulty);
  vi.spyOn(session.audio, "speakPrompt").mockImplementation((_t, onEnd) => {
    onEnd?.();
    return true;
  });
  vi.spyOn(session.audio, "playPromptAudio").mockImplementation(() => {
    /* mp3 — không liên quan */
  });
  session.prepareRound("3-4");
  return session;
}

function goToRecall(session: GT000Session): void {
  const steps = FIXTURE.content.steps ?? [];
  for (let guard = 0; guard < 50; guard++) {
    const step = steps[session.currentStepIndex];
    if (!step) {
      throw new Error("Hết bước mà chưa tới recall");
    }
    if (step.action === "recall") {
      return;
    }
    if (step.action === "recognise" || step.action === "link") {
      const e = session
        .getView()
        .entities.find((x) => x.id === step.target_asset_id);
      if (!e) {
        throw new Error(`Thiếu entity ${step.target_asset_id}`);
      }
      session.dispatch({ type: "tap", x: e.x, y: e.y, timeMs: 0 });
    } else {
      session.dispatch({ type: "commit", intent: "advance", timeMs: 0 });
    }
  }
  throw new Error("Không tới được recall");
}

function frameFillRects(
  session: GT000Session,
  rs: RenderSystem,
  timeMs: number
): number {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const fr = vi.spyOn(ctx, "fillRect");
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return fr.mock.calls.length;
}

describe("GT-000: rèm ở bước recall (BR-E000-16)", () => {
  it("bước present không vẽ rèm; recall vẽ rèm và không đổi vùng chạm", () => {
    const session = openSession();
    const rs = new RenderSystem();
    const presentRects = frameFillRects(session, rs, 0);
    goToRecall(session);
    const before = session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH]);
    const recallRects = frameFillRects(session, rs, 100);
    expect(recallRects).toBeGreaterThan(presentRects);
    expect(session.slots.map((s) => [s.x, s.y, s.hitW, s.hitH])).toEqual(
      before
    );
  });

  it("rèm vẽ ở cả đầu lẫn cuối nhịp mở (đều có thanh treo)", () => {
    const session = openSession();
    const rs = new RenderSystem();
    goToRecall(session);
    frameFillRects(session, rs, 1000);
    const early = frameFillRects(session, rs, 1010);
    const late = frameFillRects(session, rs, 1000 + CURTAIN_OPEN_MS + 50);
    expect(early).toBeGreaterThanOrEqual(3);
    expect(late).toBeGreaterThanOrEqual(3);
  });

  it("reduced-motion: khung đầu của recall đã là rèm mở hẳn (giống khung muộn)", () => {
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    const session = openSession();
    goToRecall(session);
    const first = frameFillRects(session, rs, 5000);
    const later = frameFillRects(session, rs, 9000);
    expect(first).toBe(later);
  });
});
