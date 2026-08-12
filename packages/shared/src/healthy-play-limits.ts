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
