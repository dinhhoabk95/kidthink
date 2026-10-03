import type { AgeBand } from "#src/contracts/types";
import type { Slot } from "#src/layout/types";
import { GT009Session } from "#src/templates/GT-009/session";

/**
 * Ca âm của Task #283 B1: GT-009 vẫn xếp slot theo toạ độ cứng của canvas
 * 960x540 cũ — một hàng sát đỉnh, bước 130 — nên slot rơi ra ngoài `zones.stage`
 * ở mọi viewport hẹp. Đo khung phải báo.
 */
const LEGACY_FIRST_X = 80;
const LEGACY_STEP_X = 130;
const LEGACY_Y = 60;
const LEGACY_CARD_PX = 96;

export class GT009LegacyLayoutSession extends GT009Session {
  protected override computeSlots(_ageBand: AgeBand): readonly Slot[] {
    const count = this.content.clues.length + this.content.candidates.length;
    return Array.from({ length: count }, (_, index) => ({
      index,
      x: LEGACY_FIRST_X + index * LEGACY_STEP_X,
      y: LEGACY_Y,
      w: LEGACY_CARD_PX,
      h: LEGACY_CARD_PX,
      hitW: LEGACY_CARD_PX,
      hitH: LEGACY_CARD_PX,
      page: 0,
      role: index < this.content.clues.length ? "target" : "source",
    }));
  }
}
