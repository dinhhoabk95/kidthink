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

/**
 * Bậc tiến triển của một kỹ năng bên trong strand của nó.
 *
 * Thay cho cột `status` viết tay đã bị gỡ. Trục này mô tả **nhiệm vụ**, không
 * mô tả đứa trẻ — Cấm — NEVER viết "con đang ở mức làm quen" trong báo cáo.
 */
export type SkillProgressionTier = "pre" | "basic" | "core" | "advanced";

/** Dải tuổi của một kỹ năng. `6-7` là band tiền tiểu học. */
export type SkillAge = 3 | 4 | 5 | 6 | 7;

/** Tier 3: Skill, belongs to exactly one Strand. */
export interface SkillTier {
  readonly code: SkillCode;
  readonly strand_code: StrandCode;
  readonly name: string;
  readonly age_min: SkillAge;
  readonly age_max: SkillAge;
  readonly difficulty: 1 | 2 | 3 | 4 | 5;
  readonly thinking: readonly ThinkingProcess[];
  readonly tier: SkillProgressionTier;
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

export const ALL_GAME_MECHANICS = [
  "drag-to-container",
  "drag-to-slot",
  "number-bond",
  "pair-match",
  "clue-deduction",
  "substitution",
  "matrix-choice",
  "tap-select",
  "tap-select-multi",
  "tap-count",
  "flash-recall",
  "memory-flip",
  "maze-route",
  "balance-scale",
  "sudoku-mini",
  "clock-hands",
  "block-stack",
  "sort-groups",
  "sequence-order",
  "construct",
  "rotate-transform",
  "trace-path",
  "listen-respond",
  "mirror-complete",
  "hidden-object",
  "spot-difference",
  "go-nogo",
  "rule-switch",
  "remove-from-set",
  "measure-with-unit",
  "coin-compose",
  "pour-quantity",
  "weave-grid",
  "beat-sequence",
  "command-sequence",
  "free-create",
  "concept-intro",
] as const;

export type GameMechanic = (typeof ALL_GAME_MECHANICS)[number];

export interface ReservedMechanicEntry {
  readonly mechanic: GameMechanic;
  readonly task: string;
}

export const RESERVED_MECHANICS: readonly ReservedMechanicEntry[] = [] as const;

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
