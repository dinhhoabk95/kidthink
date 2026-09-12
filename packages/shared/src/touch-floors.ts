/**
 * BR-A11-04 & BR-CFO-07: Single source of truth for touch floors across all 4 surfaces.
 * Sàn chạm tối thiểu (pixel) theo đối tượng và band tuổi.
 */
export const TOUCH_FLOORS = {
  kidBand3_4: 96,
  kidPrimary: 76,
  kidMin: 64,
  adult: 44,
  studio: 40,
  absoluteMin: 24,
} as const;

export type TouchFloorRole = keyof typeof TOUCH_FLOORS;
