import { describe, expect, it } from "vitest";
import {
  type ClockGestureInput,
  resolveClockGestureTime,
} from "#src/templates/GT-016/layout.js";

/**
 * `BR-ENG-19` ở đồng hồ: kim hút về bước hợp lệ gần nhất; thả lệch 0,4 × sàn chạm
 * quanh đầu kim đích vẫn ra cùng giờ như thả đúng đầu kim.
 */
const FACE = { x: 0, y: 0, w: 400, h: 400 };
const FLOOR = 153;
const JITTER = 0.4 * FLOOR;
const DIRS: ReadonlyArray<readonly [number, number]> = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
];

function tip(deg: number, radius: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: Math.round(200 + Math.cos(rad) * radius),
    y: Math.round(200 + Math.sin(rad) * radius),
  };
}

function dropTo(
  inp: Omit<ClockGestureInput, "gesture">,
  to: { x: number; y: number }
) {
  return resolveClockGestureTime({
    ...inp,
    gesture: {
      type: "drop",
      fromX: 200,
      fromY: 200,
      toX: to.x,
      toY: to.y,
      timeMs: 0,
    },
  });
}

describe("GT-016 — thả kim dễ dãi (BR-ENG-19)", () => {
  it.each([
    [60, { hour: 2, minute: 0 }, { hour: 4, minute: 0 }, 120],
    [60, { hour: 9, minute: 0 }, { hour: 12, minute: 0 }, 0],
    [30, { hour: 3, minute: 0 }, { hour: 3, minute: 30 }, 180],
  ] as const)(
    "minute_step %i: lệch 0,4 x sàn ra cùng giá trị",
    (step, cur, tgt, deg) => {
      const inp = {
        faceBox: FACE,
        currentTime: cur,
        targetTime: tgt,
        minuteStep: step,
        snapRadiusPx: 0.45 * FLOOR,
      } as const;
      const centre = tip(deg, 146);
      const base = dropTo(inp, centre);
      expect(base).not.toBeNull();
      for (const [ux, uy] of DIRS) {
        const moved = { x: centre.x + ux * JITTER, y: centre.y + uy * JITTER };
        expect(dropTo(inp, moved)).toEqual(base);
      }
    }
  );

  it("ca âm: thả cách xa đầu kim đích hơn vùng hút thì vẫn ra bước gần nhất", () => {
    const inp = {
      faceBox: FACE,
      currentTime: { hour: 2, minute: 0 },
      targetTime: { hour: 4, minute: 0 },
      minuteStep: 60,
      snapRadiusPx: 0.45 * FLOOR,
    } as const;
    const action = dropTo(inp, tip(180, 146));
    expect(action).toEqual({
      type: "set_clock_time",
      data: { hour: 6, minute: 0, hand: "hour" },
    });
  });
});
