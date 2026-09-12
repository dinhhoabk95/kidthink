/**
 * Canonical Age Bands across the entire workspace (Hạng B - BR-CFO-06).
 * Single Source of Truth for 3-6 preschool age bands.
 */
export const AGE_BANDS = ["3-4", "4-5", "5-6"] as const;

export type AgeBand = (typeof AGE_BANDS)[number];

export function isAgeBand(value: string): value is AgeBand {
  return (AGE_BANDS as readonly string[]).includes(value);
}
