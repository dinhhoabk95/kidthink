import type { ContentDemandLedger } from "./gates/content-demand.js";
import type { AnyContentSeed } from "./types.js";

const SEED_PROFILES = ["full", "core"] as const;
type SeedProfile = (typeof SEED_PROFILES)[number];

const DEFAULT_SEED_PROFILE: SeedProfile = "full";

function isSeedProfile(value: string): value is SeedProfile {
  return SEED_PROFILES.some((profile) => profile === value);
}

export function parseSeedProfile(raw: string | undefined): SeedProfile {
  const value = raw?.trim();
  if (!value) {
    return DEFAULT_SEED_PROFILE;
  }
  if (!isSeedProfile(value)) {
    throw new Error(
      `MINDKID_SEED_PROFILE='${value}' không hợp lệ, chỉ nhận ${SEED_PROFILES.join(" | ")} (BR-LRM-13)`
    );
  }
  return value;
}

function ledgerLevelCodes(ledger: ContentDemandLedger): ReadonlySet<string> {
  const codes = new Set<string>();
  for (const cell of ledger.cells) {
    for (const code of cell.filled_by) {
      codes.add(code);
    }
  }
  return codes;
}

export function selectSeedContent(
  profile: SeedProfile,
  seeds: readonly AnyContentSeed[],
  ledger: ContentDemandLedger
): AnyContentSeed[] {
  if (profile === "full") {
    return [...seeds];
  }
  const named = ledgerLevelCodes(ledger);
  return seeds.filter((seed) => named.has(seed.header.code));
}
