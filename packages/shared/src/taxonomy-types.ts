/**
 * Taxonomy type hierarchy — pure TypeScript types.
 *
 * Source of truth: `docs/specs/00-foundation/glossary.md` §7.1–§7.6
 * These are structural types only — no runtime code, no Zod dependency.
 */

import type { CompetencyCode, SkillCode, StrandCode } from "./ids.js";

// ─── Taxonomy tiers ──────────────────────────────────────────────────

/** Tier 1: Competency (6 total, C1–C6). */
export interface CompetencyTier {
  readonly code: CompetencyCode;
  readonly description: string;
  readonly name: string;
}

/** Tier 2: Strand (41 total), belongs to exactly one Competency. */
export interface StrandTier {
  readonly code: StrandCode;
  readonly competency_code: CompetencyCode;
  readonly description: string;
  readonly name: string;
}

/** Tier 3: Skill (230 total), belongs to exactly one Strand. */
export interface SkillTier {
  readonly code: SkillCode;
  readonly strand_code: StrandCode;
  readonly name: string;
  readonly age_min: 3 | 4 | 5 | 6;
  readonly age_max: 3 | 4 | 5 | 6;
  readonly difficulty: 1 | 2 | 3 | 4 | 5;
  readonly thinking: readonly ThinkingProcess[];
  readonly prerequisites: readonly SkillCode[];
}

/** Tier 4: Learning Objective, one observable behavior. ≥3 per Skill. */
export interface LearningObjectiveTier {
  readonly code: string; // LearningObjectiveCode — avoid circular import
  readonly skill_code: SkillCode;
  readonly description: string;
}

// ─── Thinking process ────────────────────────────────────────────────
// Axis 2 from taxonomy index.md §Trục 2

export type ThinkingProcess =
  | "observe"
  | "compare"
  | "sort"
  | "match"
  | "count"
  | "sequence"
  | "infer"
  | "predict"
  | "deduce"
  | "solve"
  | "verify"
  | "create"
  | "plan"
  | "recall"
  | "inhibit"
  | "shift"
  | "describe"
  | "listen";

// ─── Content axis: what ──────────────────────────────────────────────
// Axis 1 from taxonomy index.md §Trục 1

export type ContentWhat =
  | "number"
  | "quantity"
  | "arithmetic"
  | "geometry"
  | "space"
  | "pattern"
  | "colour"
  | "size"
  | "weight"
  | "capacity"
  | "time"
  | "money"
  | "category"
  | "vocabulary"
  | "story"
  | "sound"
  | "texture"
  | "rule";

// ─── Game mechanic ───────────────────────────────────────────────────
// Axis 3 from taxonomy index.md §Trục 3

export type GameMechanic =
  | "drag-to-container"
  | "drag-to-slot"
  | "drag-to-order"
  | "pair-match"
  | "tap-select"
  | "tap-count"
  | "flash-recall"
  | "memory-flip"
  | "maze-route"
  | "construct"
  | "rotate-transform"
  | "balance"
  | "trace-path"
  | "sequence-arrange"
  | "listen-respond"
  | "free-create";

// ─── Game template & level ───────────────────────────────────────────

/** Lớp 1 — code-owned. Mechanic + layout + content_contract. */
export interface GameTemplateMeta {
  readonly code: string; // GameTemplateCode
  readonly mechanic: GameMechanic;
  readonly name: string;
}

/** Lớp 2 — admin-owned. Template + content_pack + difficulty_params + theme. */
export interface GameLevelMeta {
  readonly code: string; // GameLevelCode
  readonly template_code: string; // GameTemplateCode
  readonly skill_code: SkillCode;
  readonly theme: string; // ThemeCode
}

// ─── Enums ───────────────────────────────────────────────────────────

export type { ContentLifecycleStatus } from "./lifecycle.js";

/** Access tier — applied to content, NOT to users (BR-GLOS-03). */
export type AccessTier = "free" | "login" | "standard" | "premium";

/** Data layer (glossary §7.6). */
export type DataLayer = "code_owned" | "admin_owned";
