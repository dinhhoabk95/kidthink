import type { AgeBand } from "#src/contracts/types";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { GT004Session } from "#src/templates/GT-004/session";

/**
 * Ca âm của Task #283 B3: GT-004 với **bố cục cũ** — nguồn xếp ở nửa trên canvas
 * và rổ ở nửa dưới theo `multi-bucket-bottom` trên cả canvas, không có `stage`
 * và không có khay. Chép nguyên từ `computeSlots` trước B3. Phép kiểm khung phải
 * báo nguồn nằm ngoài `zones.tray` (`BR-PSZ-01`).
 */
export class GT004LegacyTrayCoordsSession extends GT004Session {
  protected override computeSlots(ageBand: AgeBand): readonly Slot[] {
    const layoutFn = resolveLayout("multi-bucket-bottom");
    return layoutFn({
      slotCount: this.displayItems.length,
      targetCount: this.content.groups.length,
      ageBand,
      logic: this.logicSpace,
    });
  }
}
