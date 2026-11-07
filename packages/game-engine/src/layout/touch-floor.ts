import type { AgeBand } from "@mindkid/shared/age-bands";
import { TOUCH_FLOORS } from "@mindkid/shared/touch-floors";

/**
 * Bảng sàn chạm duy nhất theo band tuổi (BR-A11-04, BR-ENG-05). Module lá để cả
 * `interaction` lẫn `layout/constants` dùng chung mà không tạo vòng import
 * (Task #313 B12).
 */
export function touchFloorOf(ageBand: AgeBand): number {
  switch (ageBand) {
    case "3-4":
      return TOUCH_FLOORS.kidBand3_4;
    case "5-6":
      return TOUCH_FLOORS.kidMin;
    default:
      return TOUCH_FLOORS.kidPrimary;
  }
}
