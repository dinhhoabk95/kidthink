import { SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot } from "#src/layout/types";
import { computeDiceSlots } from "#src/render/index.js";
import type { GT012Content } from "./template.js";

/**
 * Chia sân khấu của GT-012 (`BR-PSZ-01`): đĩa cloche cho pha loé ở một bên, hàng
 * lựa chọn trên dock ở bên kia. Portrait xếp đĩa trên, lựa chọn dưới; ngang xếp
 * đĩa trái, lựa chọn phải — sân khấu ngang quá thấp để chồng hai tầng.
 */
export const PLATE_MAX_PX = 220;

/** Cạnh vật trên đĩa — vật loé không chạm được nên không chịu sàn chạm. */
export const FLASH_ITEM_PX = 64;

/** Số cột tối đa khi vật loé không xếp theo xúc xắc. */
const FLASH_GRID_MAX_COLS = 3;

export interface RecallAreas {
  readonly plate: ZoneRect;
  readonly options: ZoneRect;
}

export function splitRecallStage(stage: ZoneRect): RecallAreas {
  if (stage.w >= stage.h) {
    const side = Math.min(PLATE_MAX_PX, stage.h);
    return {
      plate: {
        x: stage.x,
        y: stage.y + Math.round((stage.h - side) / 2),
        w: side,
        h: side,
      },
      options: {
        x: stage.x + side + SLOT_GAP_PX,
        y: stage.y,
        w: stage.w - side - SLOT_GAP_PX,
        h: stage.h,
      },
    };
  }
  const side = Math.min(PLATE_MAX_PX, stage.w);
  return {
    plate: {
      x: stage.x + Math.round((stage.w - side) / 2),
      y: stage.y,
      w: side,
      h: side,
    },
    options: {
      x: stage.x,
      y: stage.y + side + SLOT_GAP_PX,
      w: stage.w,
      h: stage.h - side - SLOT_GAP_PX,
    },
  };
}

/** Slot hình vuông của đĩa — tâm đĩa, cạnh đĩa. */
export function plateSlot(plate: ZoneRect): Slot {
  return {
    index: 0,
    x: Math.round(plate.x + plate.w / 2),
    y: Math.round(plate.y + plate.h / 2),
    w: plate.w,
    h: plate.h,
    hitW: plate.w,
    hitH: plate.h,
    page: 0,
    role: "target",
  };
}

function gridFlashSlots(plate: Slot, count: number): Slot[] {
  const cols = Math.min(FLASH_GRID_MAX_COLS, count);
  const rows = Math.ceil(count / cols);
  const cellW = plate.w / cols;
  const cellH = plate.h / rows;
  const left = plate.x - plate.w / 2;
  const top = plate.y - plate.h / 2;
  return Array.from({ length: count }, (_, i) => ({
    ...plate,
    index: i,
    x: Math.round(left + (i % cols) * cellW + cellW / 2),
    y: Math.round(top + Math.floor(i / cols) * cellH + cellH / 2),
    w: FLASH_ITEM_PX,
    h: FLASH_ITEM_PX,
    hitW: FLASH_ITEM_PX,
    hitH: FLASH_ITEM_PX,
    role: "neutral" as const,
  }));
}

/**
 * Vị trí vật loé trên đĩa. `arrangement` nói vật được **xếp** thế nào: xúc xắc
 * dùng bảng toạ độ cố định của `computeDiceSlots`, các kiểu còn lại xếp lưới
 * trong đĩa. Mọi vị trí nằm trong rect đĩa.
 */
export function computeFlashSlots(
  plate: ZoneRect,
  count: number,
  arrangement: GT012Content["arrangement"]
): Slot[] {
  const parent = plateSlot(plate);
  if (arrangement === "dice") {
    return computeDiceSlots(parent, count, FLASH_ITEM_PX).map((slot) => ({
      ...slot,
      role: "neutral" as const,
    }));
  }
  return gridFlashSlots(parent, count);
}
