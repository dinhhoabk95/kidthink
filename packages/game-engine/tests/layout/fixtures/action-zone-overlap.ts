import type { AgeBand } from "#src/contracts/types";
import type { Slot } from "#src/layout/types";
import { GT035Session } from "#src/templates/GT-035/session";

/**
 * Ca âm của `action-clear.test.ts` (Phase 24 mục 1): GT-035 với ô cuối bị đẩy
 * vào góc dưới phải canvas, đúng chỗ nút hành động (`zones.action`). Phép kiểm
 * phải báo ca này là "đè nút hành động" (`BR-PSZ-03`, `BR-PSZ-05`).
 */
export class GT035SlotOnActionSession extends GT035Session {
  protected override computeSlots(band: AgeBand): readonly Slot[] {
    const slots = [...super.computeSlots(band)];
    const last = slots.at(-1);
    if (!last) {
      return slots;
    }
    slots[slots.length - 1] = {
      ...last,
      x: this.logicSpace.w - last.hitW / 2,
      y: this.logicSpace.h - last.hitH / 2,
    };
    return slots;
  }
}
