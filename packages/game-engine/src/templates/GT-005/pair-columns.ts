import type { AgeBand } from "#src/contracts/types";
import { resolveTouchFloor, SLOT_GAP_PX } from "#src/layout/constants";
import type { ZoneRect } from "#src/layout/stage-zones";
import type { Slot, SlotRole } from "#src/layout/types";

/**
 * Hai cột ghép cặp trong `zones.stage` (`BR-PSZ-01`, `BR-LAY-05`).
 *
 * Cột đơn kiểu `two-column-matching` cần `n × (sàn chạm + khe)` chiều cao; sân
 * khấu thấp (điện thoại ngang, sàn chạm tính theo px CSS thật) không đủ. Khi
 * một cột không vừa, mỗi bên tách thành nhiều cột con điền theo cột, vẫn chia
 * đôi sân khấu trái - phải: trái là nguồn, phải là đích.
 */
const MAX_SLOT_W = 120;
const MAX_SLOT_H = 90;
/** Thân đất sét vẽ thêm một thanh dày 5 px dưới ô (`RenderSystem.drawClayBody`). */
const CLAY_SLAB_PX = 5;

export interface PairColumnsInput {
  readonly stage: ZoneRect;
  readonly ageBand: AgeBand;
  readonly cssPerLogic?: number;
  readonly leftCount: number;
  readonly rightCount: number;
}

interface SideBlock {
  readonly count: number;
  readonly originX: number;
  readonly width: number;
  readonly role: SlotRole;
  readonly firstIndex: number;
}

/** Số hàng tối đa của một cột con để mọi ô giữ được sàn chạm trong `height`. */
function rowsPerColumn(height: number, floor: number): number {
  return Math.max(
    1,
    Math.floor((height + SLOT_GAP_PX) / (floor + SLOT_GAP_PX))
  );
}

function layoutBlock(
  block: SideBlock,
  stage: ZoneRect,
  floor: number,
  rows: number
): Slot[] {
  const subCols = Math.max(1, Math.ceil(block.count / rows));
  const rowsInCol = Math.min(rows, block.count);
  // Làm tròn xuống số nguyên để khe giữa hai ô liền kề đúng `SLOT_GAP_PX`.
  const slotW = Math.floor(
    Math.max(
      floor,
      Math.min(
        MAX_SLOT_W,
        (block.width - (subCols - 1) * SLOT_GAP_PX) / subCols
      )
    )
  );
  const slotH = Math.floor(
    Math.max(
      floor,
      Math.min(
        MAX_SLOT_H,
        (stage.h - (rowsInCol - 1) * SLOT_GAP_PX) / rowsInCol
      )
    )
  );
  const totalW = subCols * slotW + (subCols - 1) * SLOT_GAP_PX;
  const totalH = rowsInCol * slotH + (rowsInCol - 1) * SLOT_GAP_PX;
  const startX = Math.round(block.originX + (block.width - totalW) / 2);
  const startY = Math.round(stage.y + (stage.h - totalH) / 2);
  const slots: Slot[] = [];
  for (let i = 0; i < block.count; i++) {
    const col = Math.floor(i / rows);
    const row = i % rows;
    slots.push({
      index: block.firstIndex + i,
      x: Math.round(startX + col * (slotW + SLOT_GAP_PX) + slotW / 2),
      y: Math.round(startY + row * (slotH + SLOT_GAP_PX) + slotH / 2),
      w: Math.round(slotW),
      h: Math.round(slotH),
      hitW: Math.max(floor, Math.round(slotW)),
      hitH: Math.max(floor, Math.round(slotH)),
      page: 0,
      role: block.role,
    });
  }
  return slots;
}

export function computePairColumnsInStage(input: PairColumnsInput): Slot[] {
  const { leftCount, rightCount } = input;
  const stage = { ...input.stage, h: input.stage.h - CLAY_SLAB_PX };
  const floor = Math.ceil(resolveTouchFloor(input.ageBand, input.cssPerLogic));
  const zoneW = (stage.w - SLOT_GAP_PX) / 2;
  const rows = rowsPerColumn(stage.h, floor);
  return [
    ...layoutBlock(
      {
        count: leftCount,
        originX: stage.x,
        width: zoneW,
        role: "source",
        firstIndex: 0,
      },
      stage,
      floor,
      rows
    ),
    ...layoutBlock(
      {
        count: rightCount,
        originX: stage.x + zoneW + SLOT_GAP_PX,
        width: zoneW,
        role: "target",
        firstIndex: leftCount,
      },
      stage,
      floor,
      rows
    ),
  ];
}
