export const BADGE_REGISTRY = [
  "STRAND_FIRST_COMPLETE",
  "WEEK_CURRICULUM_COMPLETE",
  "PLAY_DAYS_5",
] as const;

export type BadgeCode = (typeof BADGE_REGISTRY)[number];

export interface BadgeAwardContext {
  distinctPlayDays?: number;
  isFirstStrandComplete?: boolean;
  isWeekCurriculumComplete?: boolean;
  existingBadgeCodes?: Set<string>;
}

/**
 * BR-PRG-04, BR-PRG-07 & spec §7.2
 * Evaluates candidate badges to award based on deterministic milestone events.
 */
export function evaluateBadges(context: BadgeAwardContext): BadgeCode[] {
  const awarded: BadgeCode[] = [];
  const existing = context.existingBadgeCodes ?? new Set<string>();

  if (
    context.distinctPlayDays &&
    context.distinctPlayDays >= 5 &&
    !existing.has("PLAY_DAYS_5")
  ) {
    awarded.push("PLAY_DAYS_5");
  }

  if (context.isFirstStrandComplete && !existing.has("STRAND_FIRST_COMPLETE")) {
    awarded.push("STRAND_FIRST_COMPLETE");
  }

  if (
    context.isWeekCurriculumComplete &&
    !existing.has("WEEK_CURRICULUM_COMPLETE")
  ) {
    awarded.push("WEEK_CURRICULUM_COMPLETE");
  }

  return awarded;
}
