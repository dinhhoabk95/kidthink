/**
 * Healthy Play Limits — Package caps and play budget calculations.
 * Implements BR-HPL-01..08 & spec HEALTHY-PLAY-LIMITS.
 */

export interface PackagePlayCapConfig {
  maxCapMinutes: number;
  defaultCapMinutes: number;
}

export const PACKAGE_PLAY_CAPS: Record<
  "guest" | "login" | "standard" | "premium",
  PackagePlayCapConfig
> = {
  guest: {
    maxCapMinutes: 99_999, // Uncounted for guest (spec §7.1)
    defaultCapMinutes: 99_999,
  },
  login: {
    maxCapMinutes: 30,
    defaultCapMinutes: 30,
  },
  standard: {
    maxCapMinutes: 60,
    defaultCapMinutes: 45,
  },
  premium: {
    maxCapMinutes: 90,
    defaultCapMinutes: 60,
  },
};

export function getPackagePlayCap(
  tier: "guest" | "login" | "standard" | "premium"
): number {
  return PACKAGE_PLAY_CAPS[tier].maxCapMinutes;
}

export function getDefaultPlayCap(
  tier: "guest" | "login" | "standard" | "premium"
): number {
  return PACKAGE_PLAY_CAPS[tier].defaultCapMinutes;
}

export function validateCustomPlayCap(
  requestedCapMinutes: number,
  tier: "guest" | "login" | "standard" | "premium"
): boolean {
  if (requestedCapMinutes <= 0) {
    return false;
  }
  const maxCap = getPackagePlayCap(tier);
  return requestedCapMinutes <= maxCap;
}

export interface PlayBudgetStatsInput {
  readonly totalPlayTimeSeconds?: number | null;
  readonly total_play_time_seconds?: number | null;
  readonly extraTimeGrantedMinutes?: number | null;
  readonly extra_time_granted_minutes?: number | null;
  readonly inProgressSeconds?: number | null;
  readonly in_progress_seconds?: number | null;
}

/**
 * Ngân sách chơi còn lại trong ngày (tính bằng giây):
 * remaining = max(0, (cap_minutes + extra_time_granted_minutes) * 60 - used_seconds).
 */
export function computeRemainingPlaySeconds(
  stats: PlayBudgetStatsInput | null | undefined,
  capMinutes: number,
  inProgressSeconds = 0
): number {
  const safeCapMinutes = Number.isFinite(capMinutes)
    ? Math.max(0, capMinutes)
    : 0;
  const rawExtraMinutes =
    stats?.extraTimeGrantedMinutes ?? stats?.extra_time_granted_minutes ?? 0;
  const safeExtraMinutes = Number.isFinite(rawExtraMinutes)
    ? Math.max(0, rawExtraMinutes)
    : 0;
  const rawRecordedSeconds =
    stats?.totalPlayTimeSeconds ?? stats?.total_play_time_seconds ?? 0;
  const safeRecordedSeconds = Number.isFinite(rawRecordedSeconds)
    ? Math.max(0, rawRecordedSeconds)
    : 0;
  const rawStatsInProgress =
    stats?.inProgressSeconds ?? stats?.in_progress_seconds ?? 0;
  const safeStatsInProgress = Number.isFinite(rawStatsInProgress)
    ? Math.max(0, rawStatsInProgress)
    : 0;
  const safeArgInProgress = Number.isFinite(inProgressSeconds)
    ? Math.max(0, inProgressSeconds)
    : 0;

  const totalBudgetSeconds = (safeCapMinutes + safeExtraMinutes) * 60;
  const totalUsedSeconds =
    safeRecordedSeconds + safeStatsInProgress + safeArgInProgress;

  return Math.max(0, totalBudgetSeconds - totalUsedSeconds);
}
