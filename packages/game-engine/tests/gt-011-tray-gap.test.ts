import { describe, expect, it } from "vitest";
import type { AgeBand } from "#src/contracts/types";
import { deriveLogicSpace, SLOT_GAP_PX } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import { dockRectAroundSlots, trayBoxWithin } from "#src/layout/slot-fit";
import type { ZoneRect } from "#src/layout/stage-zones";
import { boxFromSlots } from "#src/render/shared-render-shapes";
import { GT011_FIXTURES } from "#src/templates/GT-011/fixtures";
import { GT011Session } from "#src/templates/GT-011/session";

/**
 * GT-011 xem bằng mắt (Phase 24, `BR-E011-07`): khay đáp án (dock) không dính hay
 * đè khay lưới. Layout chỉ chừa `SLOT_GAP_PX` giữa hai hàng **ô**, còn khay vẽ
 * lùi ra ngoài ô 16 px (lưới) và 16 px (dock) nên hai khay chồng nhau.
 */
const FRAMES = [
  { name: "360x640", w: 360, h: 640 },
  { name: "390x844", w: 390, h: 844 },
  { name: "330x697", w: 330, h: 697 },
  { name: "610x350", w: 610, h: 350 },
  { name: "964x628", w: 964, h: 628 },
] as const;
const BANDS: readonly AgeBand[] = ["3-4", "4-5", "5-6"];
/** Nét gỗ đáy của `drawShapeTray`, tịnh tiến xuống dưới khay. */
const GRID_TRAY_RIM_PX = 4;
const GRID_TRAY_PAD_X_PX = 22;
const GRID_TRAY_PAD_Y_PX = 16;

function gapBetween(a: ZoneRect, b: ZoneRect): number {
  const dx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const dy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  return Math.max(dx, dy);
}

describe("GT-011: khe giữa khay lưới và khay đáp án (BR-E011-07)", () => {
  it("khe >= SLOT_GAP_PX ở mọi khung, band và level", () => {
    const problems: string[] = [];
    GT011_FIXTURES.forEach((fixture, fi) => {
      for (const band of BANDS) {
        for (const frame of FRAMES) {
          const space = deriveLogicSpace(frame.w, frame.h);
          const cssPerLogic = frame.w / space.w;
          const session = new GT011Session(
            fixture.content,
            fixture.difficulty,
            1
          );
          const zones = computeZonesForSession(
            { logicW: space.w, logicH: space.h, ageBand: band, cssPerLogic },
            session
          );
          session.prepareRound(
            band,
            space,
            zones.stage,
            zones.tray ?? undefined,
            cssPerLogic
          );
          const cellCount =
            fixture.content.matrix.rows * fixture.content.matrix.cols;
          const cells = session.slots.slice(0, cellCount);
          const options = session.slots.slice(cellCount);
          const box = boxFromSlots(cells);
          const dock = dockRectAroundSlots(options, zones.stage);
          if (!(box && dock)) {
            continue;
          }
          const inner = trayBoxWithin(box, zones.stage);
          const tray: ZoneRect = {
            x: inner.x - GRID_TRAY_PAD_X_PX,
            y: inner.y - GRID_TRAY_PAD_Y_PX,
            w: inner.w + 2 * GRID_TRAY_PAD_X_PX,
            h: inner.h + 2 * GRID_TRAY_PAD_Y_PX + GRID_TRAY_RIM_PX,
          };
          const gap = gapBetween(tray, dock);
          if (gap < SLOT_GAP_PX - 0.5) {
            problems.push(
              `mẫu ${fi} ${band} ${frame.name}: ${Math.round(gap)}`
            );
          }
        }
      }
    });
    expect(problems, problems.slice(0, 6).join("; ")).toEqual([]);
  });
});
