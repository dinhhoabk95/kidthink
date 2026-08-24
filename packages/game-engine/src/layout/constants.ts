import type { AgeBand } from "#src/contracts/types";

export const LOGIC_WIDTH = 960;
export const LOGIC_HEIGHT = 540;
export const SLOT_GAP_PX = 16;
export const SAFE_MARGIN_PX = 32;

/**
 * Sàn chạm tối thiểu theo band tuổi (BR-A11-04 & BR-ENG-05)
 * - Band 3-4: 96px
 * - Band 4-5: 76px
 * - Band 5-6: 64px
 */
export function getTouchFloor(ageBand: AgeBand): number {
  switch (ageBand) {
    case "3-4":
      return 96;
    case "4-5":
      return 76;
    case "5-6":
      return 64;
    default:
      return 76;
  }
}
