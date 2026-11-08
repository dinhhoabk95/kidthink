import { describe, expect, it, vi } from "vitest";
import {
  BELL_LIFT_MS,
  bellLiftProgress,
  FIREFLY_PERIOD_MS,
  fireflyGlow,
  fireflyHaloRadius,
} from "#src/render/container-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { SAMPLE_LEVEL_1 } from "#src/templates/GT-012/fixtures";
import { FlashRecallSession } from "#src/templates/GT-012/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Đom đóm nhấp nháy và nắp chuông thuỷ tinh (`BR-E012-08`). */
const FLASH_MS = 3000;

describe("fireflyGlow (hàm thuần)", () => {
  it("luôn trong [0.35, 1] và dao động theo chu kỳ", () => {
    let min = 1;
    let max = 0;
    for (let ms = 0; ms < FIREFLY_PERIOD_MS; ms += 10) {
      const g = fireflyGlow(ms, 0, false);
      min = Math.min(min, g);
      max = Math.max(max, g);
    }
    expect(min).toBeGreaterThanOrEqual(0.35 - 1e-9);
    expect(max).toBeLessThanOrEqual(1 + 1e-9);
    expect(max - min).toBeGreaterThan(0.3);
    expect(fireflyGlow(120, 0, false)).toBeCloseTo(
      fireflyGlow(120 + FIREFLY_PERIOD_MS, 0, false),
      9
    );
  });

  it("mỗi đom đóm lệch pha nhau", () => {
    expect(fireflyGlow(200, 0, false)).not.toBeCloseTo(
      fireflyGlow(200, 1, false),
      3
    );
  });

  it("reduced-motion: sáng tĩnh ở mức cao nhất", () => {
    expect(fireflyGlow(0, 0, true)).toBe(1);
    expect(fireflyGlow(321, 2, true)).toBe(1);
  });
});

describe("bellLiftProgress (hàm thuần)", () => {
  it("nắp nhấc lên đầu pha nhìn, hạ xuống cuối pha, đậy kín khi hết", () => {
    expect(bellLiftProgress(0, FLASH_MS, false)).toBe(0);
    expect(bellLiftProgress(BELL_LIFT_MS, FLASH_MS, false)).toBe(1);
    expect(bellLiftProgress(FLASH_MS / 2, FLASH_MS, false)).toBe(1);
    expect(bellLiftProgress(FLASH_MS, FLASH_MS, false)).toBe(0);
    expect(bellLiftProgress(FLASH_MS + 1000, FLASH_MS, false)).toBe(0);
  });

  it("pha ngắn nhất vẫn lên rồi xuống, không vượt [0,1]", () => {
    for (let ms = 0; ms <= 600; ms += 20) {
      const p = bellLiftProgress(ms, 600, false);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it("reduced-motion: mở hẳn trong pha nhìn, đậy hẳn ngoài pha", () => {
    expect(bellLiftProgress(10, FLASH_MS, true)).toBe(1);
    expect(bellLiftProgress(FLASH_MS, FLASH_MS, true)).toBe(0);
  });
});

function openSession(): FlashRecallSession {
  const session = new FlashRecallSession(
    SAMPLE_LEVEL_1.content_pack,
    { ...SAMPLE_LEVEL_1.difficulty_params, flash_ms: FLASH_MS },
    0
  );
  session.prepareRound("3-4");
  return session;
}

function frame(
  session: FlashRecallSession,
  rs: RenderSystem,
  timeMs: number
): { glowRadii: number[]; lifts: number[] } {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const glowRadii: number[] = [];
  const lifts: number[] = [];
  vi.spyOn(ctx, "createRadialGradient").mockImplementation(
    (_x0, _y0, _r0, _x1, _y1, r1: number) => {
      glowRadii.push(r1);
      return { addColorStop: () => undefined } as unknown as CanvasGradient;
    }
  );
  vi.spyOn(ctx, "translate").mockImplementation((x: number, y: number) => {
    if (x === 0) {
      lifts.push(y);
    }
  });
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return { glowRadii, lifts };
}

function expectedHalos(
  session: FlashRecallSession,
  rs: RenderSystem,
  elapsedMs: number
): number[] {
  return session
    .getFlashSlots()
    .map((slot, i) =>
      fireflyHaloRadius(slot, fireflyGlow(elapsedMs, i, rs.reducedMotion))
    );
}

describe("GT-012: session vẽ đom đóm và nắp chuông (BR-E012-08)", () => {
  it("chờ bấm: nắp đậy kín, chưa có quầng đom đóm nào", () => {
    const session = openSession();
    const rs = new RenderSystem();
    const { lifts, glowRadii } = frame(session, rs, 0);
    expect(lifts.every((y) => y >= 0)).toBe(true);
    for (const r of expectedHalos(session, rs, 0)) {
      expect(glowRadii).not.toContain(r);
    }
  });

  it("pha nhìn: nắp nhấc lên và quầng đổi cỡ theo đồng hồ khung", () => {
    const session = openSession();
    const rs = new RenderSystem();
    session.startFlash();
    const a = frame(session, rs, 500);
    expect(a.lifts.some((y) => y < 0)).toBe(true);
    for (const r of expectedHalos(session, rs, 500)) {
      expect(a.glowRadii).toContain(r);
    }
    const later = 500 + FIREFLY_PERIOD_MS / 4;
    const b = frame(session, rs, later);
    for (const r of expectedHalos(session, rs, later)) {
      expect(b.glowRadii).toContain(r);
    }
    expect(expectedHalos(session, rs, 500)).not.toEqual(
      expectedHalos(session, rs, later)
    );
  });

  it("hết pha nhìn: không còn quầng đom đóm nào (không lộ số lượng)", () => {
    const session = openSession();
    const rs = new RenderSystem();
    session.startFlash();
    session.update(FLASH_MS + 100);
    const { glowRadii, lifts } = frame(session, rs, FLASH_MS + 100);
    for (const r of expectedHalos(session, rs, FLASH_MS + 100)) {
      expect(glowRadii).not.toContain(r);
    }
    expect(lifts.every((y) => y >= 0)).toBe(true);
  });

  it("reduced-motion: quầng đứng yên giữa hai khung", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    session.startFlash();
    expect(expectedHalos(session, rs, 500)).toEqual(
      expectedHalos(session, rs, 500 + FIREFLY_PERIOD_MS / 4)
    );
    const a = frame(session, rs, 500);
    for (const r of expectedHalos(session, rs, 500)) {
      expect(a.glowRadii).toContain(r);
    }
  });
});
