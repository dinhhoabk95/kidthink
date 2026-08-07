/**
 * Glossary — banned terms and replacements.
 *
 * Source of truth: `docs/specs/00-foundation/glossary.md` §8
 * Rule: BR-GLOS-03 — these terms are banned in all specs, code, and UI.
 *
 * Exported for lint/tooling only, NOT for runtime guards.
 */

/** Terms banned in all specs, code, and UI (glossary §8). */
export const BANNED_TERMS = [
  "tenant",
  "tenant_id",
  "school",
  "school_admin",
  "classroom",
  "persona",
  "domain", // as taxonomy tier 2 — use "strand"
  "student",
  "pupil",
  "score", // displayed to child — use "sao", "hoàn thành"
] as const;

export type BannedTerm = (typeof BANNED_TERMS)[number];

/**
 * Banned → replacement mapping.
 * `null` = no replacement exists (term's concept is out of scope).
 */
export const TERM_REPLACEMENTS: Record<BannedTerm, string | null> = {
  tenant: null,
  tenant_id: null,
  school: null,
  school_admin: null,
  classroom: null,
  persona: "entitlement",
  domain: "strand",
  student: "child profile",
  pupil: "child profile",
  score: "sao / hoàn thành",
};
