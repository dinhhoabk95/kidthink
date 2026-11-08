import { describe, expect, it } from "vitest";
import {
  FROG_BADGE_W_PX,
  FROG_TARGET_W_PX,
  frogLineLayout,
} from "#src/render/number-line";

/**
 * GT-028 xem bằng mắt (Phase 24, `BR-E028-10`): ếch ở vạch 0 không chạm nhãn
 * `+n` bên trái, ếch ở chỗ "ngoài mút" không chạm số đích bên phải.
 */
const CLEARANCE_PX = 4;
const RECTS = [
  { x: 16, y: 150, w: 330, h: 44 },
  { x: 16, y: 150, w: 508, h: 44 },
  { x: 20, y: 230, w: 1240, h: 44 },
  { x: 16, y: 150, w: 400, h: 30 },
];

describe("GT-028: ếch không đè nhãn trục (BR-E028-10)", () => {
  for (const rect of RECTS) {
    for (let ticks = 1; ticks <= 12; ticks++) {
      it(`rect ${rect.w}x${rect.h}, ${ticks} mốc`, () => {
        const layout = frogLineLayout(rect, ticks);
        const half = layout.frogSize / 2;
        const first = layout.tickXs[0] ?? Number.NaN;
        expect(first - half).toBeGreaterThanOrEqual(
          layout.badgeX + FROG_BADGE_W_PX / 2 + CLEARANCE_PX
        );
        expect(layout.overflowX + half).toBeLessThanOrEqual(
          layout.targetX - FROG_TARGET_W_PX / 2 - CLEARANCE_PX
        );
        expect(layout.tickXs.length).toBe(ticks + 1);
      });
    }
  }
});
