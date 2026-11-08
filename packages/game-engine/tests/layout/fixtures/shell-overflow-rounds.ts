import { computeStageZones } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import type { PlacedRound } from "../helpers/shell-frame.ts";

/**
 * Ca âm tổng hợp của `overflowReasons` (`BR-LAY-13`): vòng dựng tay ở khung
 * logic 540x960, không phụ thuộc engine nào, để mutation "bỏ kiểm ngoài canvas"
 * hay "bỏ kiểm đè nút" làm test đỏ dù mọi engine thật đã lành.
 */
const SPACE = { w: 540, h: 960 } as const;
const HIT = 120;

const ZONES = computeStageZones({
  logicW: SPACE.w,
  logicH: SPACE.h,
  ageBand: "5-6",
  cssPerLogic: 1,
  needsTray: false,
  needsCommit: true,
  stageRows: 1,
});

function slotAt(x: number, y: number, size = HIT): Slot {
  return {
    index: 0,
    x,
    y,
    w: size,
    h: size,
    hitW: size,
    hitH: size,
    page: 0,
    role: "target",
  };
}

function roundWith(slot: Slot): PlacedRound {
  return { scale: 1, slots: [slot], space: SPACE, zones: ZONES };
}

/** Ô nằm gọn giữa sân khấu: không tràn. */
export const ROUND_INSIDE = roundWith(
  slotAt(ZONES.stage.x + ZONES.stage.w / 2, ZONES.stage.y + ZONES.stage.h / 2)
);

/** Ô thò xuống dưới đáy canvas (y > logicH), lệch trái nên không đè nút. */
export const ROUND_BELOW_CANVAS = roundWith(slotAt(HIT, SPACE.h + HIT / 4));

/** Ô thò ra mép phải canvas, ở giữa chiều cao. */
export const ROUND_PAST_RIGHT_EDGE = roundWith(
  slotAt(SPACE.w + HIT / 4, SPACE.h / 2)
);

/** Ô nằm trong canvas nhưng đè đúng tâm nút hành động. */
export const ROUND_ON_ACTION = roundWith(
  slotAt(
    ZONES.action.x + ZONES.action.w / 2,
    ZONES.action.y + ZONES.action.h / 2,
    Math.min(ZONES.action.w, ZONES.action.h)
  )
);
