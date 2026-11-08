import { describe, expect, it } from "vitest";
import { deriveLogicSpace } from "#src/layout/constants";
import { computeZonesForSession } from "#src/layout/session-zones";
import type { ZoneRect } from "#src/layout/stage-zones";
import { SAMPLE_LEVEL_1 } from "#src/templates/GT-012/fixtures";
import { FlashRecallSession } from "#src/templates/GT-012/session";
import type { GT012Content } from "#src/templates/GT-012/template";
import {
  computeFlashSlots,
  FLASH_DISH_INNER_FRACTION,
  splitRecallStage,
} from "#src/templates/GT-012/zone-layout";

/**
 * GT-012 xem bằng mắt (Phase 24, `BR-E012-09`): đĩa nằm giữa sân khấu lúc chờ bấm
 * và lúc loé (chưa có lựa chọn bên cạnh), vật loé nằm gọn trong lòng đĩa.
 */
const ARRANGEMENTS: readonly GT012Content["arrangement"][] = [
  "dice",
  "line",
  "triangle",
  "random",
  "hand",
];
const PLATES: readonly ZoneRect[] = [
  { x: 100, y: 100, w: 220, h: 220 },
  { x: 100, y: 100, w: 160, h: 160 },
];

describe("GT-012: vật loé nằm gọn trong lòng đĩa (BR-E012-09)", () => {
  for (const arrangement of ARRANGEMENTS) {
    for (let count = 1; count <= 6; count++) {
      it(`${arrangement} x${count}: mọi vật trong đĩa, không chồng nhau`, () => {
        for (const plate of PLATES) {
          const cx = plate.x + plate.w / 2;
          const cy = plate.y + plate.h / 2;
          const inner = (plate.w / 2) * FLASH_DISH_INNER_FRACTION;
          const slots = computeFlashSlots(plate, count, arrangement);
          expect(slots).toHaveLength(count);
          for (const s of slots) {
            const reach = Math.hypot(s.x - cx, s.y - cy) + s.w / 2;
            expect(reach).toBeLessThanOrEqual(inner + 0.5);
          }
          for (let i = 0; i < slots.length; i++) {
            for (let j = i + 1; j < slots.length; j++) {
              const a = slots[i];
              const b = slots[j];
              if (!(a && b)) {
                continue;
              }
              const overlap =
                Math.abs(a.x - b.x) < (a.w + b.w) / 2 &&
                Math.abs(a.y - b.y) < (a.h + b.h) / 2;
              expect(overlap, `plate ${plate.w}`).toBe(false);
            }
          }
        }
      });
    }
  }
});

describe("GT-012: đĩa ở giữa khi chưa có lựa chọn (BR-E012-09)", () => {
  const landscape: ZoneRect = { x: 16, y: 150, w: 1248, h: 420 };

  it("splitRecallStage landscape: plateAlone nằm giữa sân khấu cả hai chiều", () => {
    const areas = splitRecallStage(landscape);
    expect(areas.plateAlone.x + areas.plateAlone.w / 2).toBeCloseTo(
      landscape.x + landscape.w / 2,
      0
    );
    expect(areas.plateAlone.y + areas.plateAlone.h / 2).toBeCloseTo(
      landscape.y + landscape.h / 2,
      0
    );
    expect(areas.plateAlone.w).toBe(areas.plate.w);
  });

  it("session desktop: chờ bấm và lúc loé đĩa ở giữa, hết loé thì sang trái nhường lựa chọn", () => {
    const space = deriveLogicSpace(1280, 800);
    const session = new FlashRecallSession(
      SAMPLE_LEVEL_1.content_pack,
      SAMPLE_LEVEL_1.difficulty_params
    );
    const zones = computeZonesForSession(
      { logicW: space.w, logicH: space.h, ageBand: "3-4", cssPerLogic: 1 },
      session
    );
    session.prepareRound("3-4", space, zones.stage, undefined, 1);
    const stageCx = zones.stage.x + zones.stage.w / 2;
    const centerX = (r: ZoneRect | null) => (r ? r.x + r.w / 2 : Number.NaN);

    expect(session.isAwaitingStart()).toBe(true);
    expect(centerX(session.plateRect)).toBeCloseTo(stageCx, 0);

    session.startFlash();
    expect(session.isFlashVisible()).toBe(true);
    expect(centerX(session.plateRect)).toBeCloseTo(stageCx, 0);
    for (const s of session.getFlashSlots()) {
      const p = session.plateRect;
      expect(p).not.toBeNull();
      if (p) {
        expect(Math.abs(s.x - centerX(p))).toBeLessThan(p.w / 2);
      }
    }

    session.update(60_000);
    expect(session.isCovered()).toBe(true);
    expect(centerX(session.plateRect)).toBeLessThan(stageCx);
    const plate = session.plateRect;
    const firstOption = session.slots[0];
    if (!(plate && firstOption)) {
      throw new Error("Thiếu đĩa hoặc lựa chọn");
    }
    expect(plate.x + plate.w).toBeLessThanOrEqual(
      firstOption.x - firstOption.hitW / 2
    );
  });
});
