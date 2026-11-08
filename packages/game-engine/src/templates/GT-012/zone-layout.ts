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
const PLATE_MAX_PX = 220;

/** Cạnh vật trên đĩa — vật loé không chạm được nên không chịu sàn chạm. */
const FLASH_ITEM_PX = 64;

/** Cạnh vật nhỏ nhất khi đĩa chật: dưới ngưỡng này vật không còn đọc ra. */
const FLASH_ITEM_MIN_PX = 24;
const FLASH_ITEM_STEP_PX = 4;

/** Khe giữa hai vật loé liền nhau trên đĩa. */
const FLASH_ITEM_GAP_PX = 8;

/**
 * Bán kính lòng đĩa theo phần bán kính đĩa. Vành gỗ và mép đĩa chiếm phần ngoài
 * (`drawWoodenPlate`), nên vật loé phải nằm trong vòng này, không tràn ra mép.
 */
export const FLASH_DISH_INNER_FRACTION = 0.72;

export interface RecallAreas {
  /** Đĩa khi có hàng lựa chọn bên cạnh (đã che nắp, chờ trẻ trả lời). */
  readonly plate: ZoneRect;
  /** Cùng cỡ đĩa nhưng ở giữa sân khấu: lúc chờ bấm và lúc loé chưa có lựa chọn. */
  readonly plateAlone: ZoneRect;
  readonly options: ZoneRect;
}

function centeredPlate(stage: ZoneRect, side: number): ZoneRect {
  return {
    x: stage.x + Math.round((stage.w - side) / 2),
    y: stage.y + Math.round((stage.h - side) / 2),
    w: side,
    h: side,
  };
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
      plateAlone: centeredPlate(stage, side),
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
    plateAlone: centeredPlate(stage, side),
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

interface Point {
  readonly x: number;
  readonly y: number;
}

/** Hàng lưới căn giữa quanh gốc: số cột ~ căn bậc hai, hàng cuối căn giữa. */
function gridOffsets(count: number, pitch: number): Point[] {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, count - row * cols);
    const col = i % cols;
    return {
      x: (col - (inRow - 1) / 2) * pitch,
      y: (row - (rows - 1) / 2) * pitch,
    };
  });
}

function reachOf(offsets: readonly Point[], size: number): number {
  return Math.max(...offsets.map((o) => Math.hypot(o.x, o.y))) + size / 2;
}

function isSeparated(offsets: readonly Point[], size: number): boolean {
  return offsets.every((a, i) =>
    offsets
      .slice(i + 1)
      .every((b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) >= size)
  );
}

interface FlashFit {
  readonly size: number;
  readonly offsets: readonly Point[];
}

/**
 * Cỡ lớn nhất (không quá `FLASH_ITEM_PX`) mà mọi vật nằm trong lòng đĩa và
 * không chồng nhau. `offsetsAt(size)` là vị trí tương đối so với tâm đĩa; vị
 * trí nào vượt lòng đĩa thì kéo dần về tâm (giữ hình sắp xếp) trước khi hạ cỡ.
 */
function fitInsideDish(
  plate: ZoneRect,
  offsetsAt: (size: number) => Point[]
): FlashFit {
  const inner = (Math.min(plate.w, plate.h) / 2) * FLASH_DISH_INNER_FRACTION;
  let last: FlashFit = {
    size: FLASH_ITEM_MIN_PX,
    offsets: offsetsAt(FLASH_ITEM_MIN_PX),
  };
  for (
    let size = FLASH_ITEM_PX;
    size >= FLASH_ITEM_MIN_PX;
    size -= FLASH_ITEM_STEP_PX
  ) {
    const raw = offsetsAt(size);
    const reach = reachOf(raw, size);
    const k =
      reach > inner ? Math.max(0, (inner - size / 2) / (reach - size / 2)) : 1;
    const offsets = raw.map((o) => ({ x: o.x * k, y: o.y * k }));
    last = { size, offsets };
    if (reachOf(offsets, size) <= inner + 0.001 && isSeparated(offsets, size)) {
      return last;
    }
  }
  return last;
}

/**
 * Vị trí vật loé trên đĩa. `arrangement` nói vật được **xếp** thế nào: xúc xắc
 * dùng bảng toạ độ cố định của `computeDiceSlots`, các kiểu còn lại xếp lưới
 * căn giữa. Mọi vật nằm trọn trong lòng đĩa (`BR-E012-10`).
 */
export function computeFlashSlots(
  plate: ZoneRect,
  count: number,
  arrangement: GT012Content["arrangement"]
): Slot[] {
  const parent = plateSlot(plate);
  const fit = fitInsideDish(plate, (size) =>
    arrangement === "dice"
      ? computeDiceSlots(parent, count, size).map((slot) => ({
          x: slot.x - parent.x,
          y: slot.y - parent.y,
        }))
      : gridOffsets(count, size + FLASH_ITEM_GAP_PX)
  );
  return fit.offsets.map((o, index) => ({
    ...parent,
    index,
    x: Math.round(parent.x + o.x),
    y: Math.round(parent.y + o.y),
    w: fit.size,
    h: fit.size,
    hitW: fit.size,
    hitH: fit.size,
    role: "neutral" as const,
  }));
}
