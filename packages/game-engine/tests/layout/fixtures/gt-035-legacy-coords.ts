import type { AgeBand } from "#src/contracts/types";
import { getTouchFloor } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";
import { GT035Session } from "#src/templates/GT-035/session";

/**
 * Ca âm của Task #277 S7 (plan H12): GT-035 với **toạ độ cứng cũ** trên canvas
 * 960x540 — lưới tâm (300, 240), hàng lệnh từ x=620 cách 60 dù vùng chạm 64,
 * khay lệnh y=450 cách 90, nút chạy ở (780, 120). Chép nguyên từ `computeSlots`
 * trước S7. Phép kiểm khung phải báo cả vùng chạm chồng nhau (`BR-LAY-05`) lẫn
 * slot ra ngoài sân khấu (`BR-PSZ-01`).
 */
export class GT035LegacyCoordsSession extends GT035Session {
  protected override computeSlots(band: AgeBand): readonly Slot[] {
    const floor = getTouchFloor(band);
    const slots: Slot[] = [];
    const { rows, cols } = this.content.grid;

    const cellSize = Math.min(68, 360 / Math.max(rows, cols));
    const gridStartX = 300 - (cols * cellSize) / 2;
    const gridStartY = 240 - (rows * cellSize) / 2;

    let slotIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        slots.push({
          index: slotIdx++,
          role: "target",
          x: gridStartX + c * cellSize + cellSize / 2,
          y: gridStartY + r * cellSize + cellSize / 2,
          w: cellSize - 4,
          h: cellSize - 4,
          hitW: Math.max(cellSize, floor),
          hitH: Math.max(cellSize, floor),
          page: 0,
        });
      }
    }

    const maxCmd = this.difficulty.max_commands ?? 8;
    const qSlotSize = 52;
    for (let i = 0; i < maxCmd; i++) {
      slots.push({
        index: slotIdx++,
        role: "target",
        x: 620 + (i % 4) * (qSlotSize + 8) + qSlotSize / 2,
        y: 220 + Math.floor(i / 4) * (qSlotSize + 12) + qSlotSize / 2,
        w: qSlotSize,
        h: qSlotSize,
        hitW: Math.max(qSlotSize, floor),
        hitH: Math.max(qSlotSize, floor),
        page: 0,
      });
    }

    const allowed = this.content.allowed_commands ?? [];
    const palStartX = this.logicSpace.w / 2 - (allowed.length * 90) / 2;
    for (let p = 0; p < allowed.length; p++) {
      slots.push({
        index: slotIdx++,
        role: "source",
        x: palStartX + p * 90 + 45,
        y: 450,
        w: 80,
        h: 60,
        hitW: Math.max(80, floor),
        hitH: Math.max(60, floor),
        page: 0,
      });
    }

    slots.push({
      index: slotIdx++,
      role: "source",
      x: 780,
      y: 120,
      w: 96,
      h: 56,
      hitW: Math.max(96, floor),
      hitH: Math.max(56, floor),
      page: 0,
    });

    return slots;
  }
}
