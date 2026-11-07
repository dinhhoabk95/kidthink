import { SLOT_GAP_PX } from "#src/layout/constants";
import type { Slot } from "#src/layout/types";

/**
 * Hai vùng chạm cách nhau dưới `SLOT_GAP_PX` thì coi là chồng (`BR-LAY-05`).
 * Engine dùng để thử một bố cục và lùi về bố cục khác khi sân khấu quá chật.
 */
export function hasHitOverlap(slots: readonly Slot[]): boolean {
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slots[i];
      const b = slots[j];
      if (!(a && b)) {
        continue;
      }
      const dx = Math.abs(a.x - b.x) - (a.hitW + b.hitW) / 2;
      const dy = Math.abs(a.y - b.y) - (a.hitH + b.hitH) / 2;
      if (Math.max(dx, dy) < SLOT_GAP_PX) {
        return true;
      }
    }
  }
  return false;
}
