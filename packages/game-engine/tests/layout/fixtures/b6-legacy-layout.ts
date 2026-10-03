import type { AgeBand } from "#src/contracts/types";
import { resolveLayout } from "#src/layout/registry";
import type { Slot } from "#src/layout/types";
import { GT030Session } from "#src/templates/GT-030/session";
import { GT031Session } from "#src/templates/GT-031/session";
import { GT033Session } from "#src/templates/GT-033/session";

/**
 * Ca âm của Task #283 B6: ba engine với **bố cục cũ** — layout chạy trên cả
 * canvas, không đọc `stage` và không có khay. Chép nguyên từ `computeSlots`
 * trước B6. Phép kiểm khung phải báo slot nằm ngoài vùng của nó (`BR-PSZ-01`).
 */
export class GT030LegacyLayoutSession extends GT030Session {
  protected override computeSlots(ageBand: AgeBand): readonly Slot[] {
    return resolveLayout("measure-strip")({
      slotCount: this.content.answer_options.length,
      ageBand,
      targetCount: this.content.object.length_in_units,
      logic: this.logicSpace,
    });
  }
}

export class GT031LegacyLayoutSession extends GT031Session {
  protected override computeSlots(ageBand: AgeBand): readonly Slot[] {
    return resolveLayout("multi-bucket-bottom")({
      slotCount: this.content.coins.length,
      ageBand,
      targetCount: 1,
      logic: this.logicSpace,
    });
  }
}

export class GT033LegacyLayoutSession extends GT033Session {
  protected override computeSlots(ageBand: AgeBand): readonly Slot[] {
    return resolveLayout("weave-grid")({
      slotCount: this.content.palette.length,
      ageBand,
      targetCount: this.content.grid.rows * this.content.grid.cols,
      logic: this.logicSpace,
    });
  }
}
