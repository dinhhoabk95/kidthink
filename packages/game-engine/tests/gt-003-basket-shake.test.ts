import { describe, expect, it, vi } from "vitest";
import {
  BASKET_SHAKE_MS,
  basketShakeOffset,
} from "#src/render/container-shapes";
import { RenderSystem } from "#src/systems/render-system";
import { GT003_FIXTURES } from "#src/templates/GT-003/fixtures";
import { GT003Session } from "#src/templates/GT-003/session";
import { createFakeCanvas } from "./gates/fake-canvas.ts";

/** Rổ rung nhẹ khi vật đúng rơi vào (`BR-E003-09`). */
const FIXTURE = GT003_FIXTURES[0] ?? failMissingFixture();

function failMissingFixture(): never {
  throw new Error("Thiếu fixture GT-003");
}
const DROP_AT_MS = 1000;
const PROBE_MS = 40;

function openSession(): GT003Session {
  const session = new GT003Session(FIXTURE.content, FIXTURE.difficulty, 0);
  session.prepareRound("3-4");
  return session;
}

function frame(
  session: GT003Session,
  rs: RenderSystem,
  timeMs: number
): number[] {
  const ctx = createFakeCanvas(960, 540).getContext("2d");
  if (!ctx) {
    throw new Error("Không lấy được context");
  }
  const xs: number[] = [];
  vi.spyOn(ctx, "translate").mockImplementation((x: number, y: number) => {
    if (y === 0) {
      xs.push(x);
    }
  });
  session.render(ctx as CanvasRenderingContext2D, rs, timeMs);
  return xs;
}

function drop(session: GT003Session, correct: boolean): void {
  const index = session.displayItems.findIndex((i) => i.is_correct === correct);
  const slot = session.sourceSlots[index];
  const box = session.getContainerBox();
  if (!(slot && box)) {
    throw new Error("Thiếu slot hoặc rổ");
  }
  session.dispatch({
    type: "drop",
    fromX: slot.x,
    fromY: slot.y,
    toX: box.x,
    toY: box.y,
    timeMs: DROP_AT_MS,
  });
}

describe("basketShakeOffset (hàm thuần)", () => {
  it("lệch khác 0 trong nhịp, tắt dần về 0, 0 sau nhịp", () => {
    expect(basketShakeOffset(0, false)).toBe(0);
    expect(basketShakeOffset(PROBE_MS, false)).not.toBe(0);
    expect(basketShakeOffset(BASKET_SHAKE_MS, false)).toBe(0);
    expect(basketShakeOffset(BASKET_SHAKE_MS + 500, false)).toBe(0);
  });

  it("nhẹ: biên độ không quá 5 px và giảm dần", () => {
    let early = 0;
    let late = 0;
    for (let ms = 0; ms < BASKET_SHAKE_MS / 3; ms += 2) {
      early = Math.max(early, Math.abs(basketShakeOffset(ms, false)));
    }
    for (let ms = (BASKET_SHAKE_MS * 2) / 3; ms < BASKET_SHAKE_MS; ms += 2) {
      late = Math.max(late, Math.abs(basketShakeOffset(ms, false)));
    }
    expect(early).toBeLessThanOrEqual(5);
    expect(late).toBeLessThan(early);
  });

  it("reduced-motion: luôn 0 (trạng thái cuối tĩnh)", () => {
    expect(basketShakeOffset(PROBE_MS, true)).toBe(0);
  });
});

describe("GT-003: session vẽ rổ rung (BR-E003-09)", () => {
  it("chưa có vật rơi thì rổ đứng yên", () => {
    const session = openSession();
    const xs = frame(session, new RenderSystem(), 0);
    expect(xs.includes(basketShakeOffset(PROBE_MS, false))).toBe(false);
  });

  it("vật đúng rơi vào: rổ lệch theo sóng rung rồi đứng yên", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, DROP_AT_MS);
    drop(session, true);

    const during = frame(session, rs, DROP_AT_MS + PROBE_MS);
    expect(during).toContain(basketShakeOffset(PROBE_MS, false));

    const after = frame(session, rs, DROP_AT_MS + BASKET_SHAKE_MS + 10);
    expect(after).not.toContain(basketShakeOffset(PROBE_MS, false));
  });

  it("thả sai: rổ không rung", () => {
    const session = openSession();
    const rs = new RenderSystem();
    frame(session, rs, DROP_AT_MS);
    drop(session, false);

    const during = frame(session, rs, DROP_AT_MS + PROBE_MS);
    expect(during).not.toContain(basketShakeOffset(PROBE_MS, false));
  });

  it("reduced-motion: rổ không lệch", () => {
    const session = openSession();
    const rs = new RenderSystem();
    rs.reducedMotion = true;
    frame(session, rs, DROP_AT_MS);
    drop(session, true);

    const during = frame(session, rs, DROP_AT_MS + PROBE_MS);
    expect(during).not.toContain(basketShakeOffset(PROBE_MS, false));
  });
});
