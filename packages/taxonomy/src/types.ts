/**
 * Taxonomy constants — competencies and strands.
 *
 * Source of truth: `docs/taxonomy/index.md` + per-competency files.
 * Layer 1 — code-owned master data. Admin reads only. Change = PR + deploy.
 *
 * Re-exports taxonomy types from @mindkid/shared so downstream
 * packages only need `@mindkid/taxonomy`.
 */

import type { CompetencyTier, StrandTier } from "@mindkid/shared";
import { COMPETENCY_TIERS, STRANDS_CATALOG } from "@mindkid/shared";

// Re-export all taxonomy types for convenience
export type {
  AccessTier,
  CompetencyTier,
  ContentWhat,
  DataLayer,
  GameLevelMeta,
  GameMechanic,
  GameTemplateMeta,
  LearningObjectiveTier,
  SkillAge,
  SkillProgressionTier,
  SkillTier,
  StrandTier,
  ThinkingProcess,
} from "@mindkid/shared";

// ─── Competency constants ────────────────────────────────────────────

/**
 * Tầng L1 — dẫn xuất từ `COMPETENCY_CATALOG` của `@mindkid/shared`.
 *
 * Bảng nhãn sống ở `shared` vì bề mặt công khai (component Vue) cũng cần nó và
 * chỉ với ra được `@mindkid/shared/client`. Khai lại ở đây là mở lại đúng khe
 * đã sinh ra bốn bảng lệch nhau trước task 165.
 */
export const COMPETENCIES: readonly CompetencyTier[] = COMPETENCY_TIERS;

// ─── Strand constants ────────────────────────────────────────────────

/**
 * Tầng L2 — dẫn xuất từ `STRANDS_CATALOG` của `@mindkid/shared`.
 *
 * Trước đây file này khai lại toàn bộ strand bằng tay, song song với
 * `packages/shared/src/strands-catalog.ts`. Đó đúng là khe đã đẻ ra bốn bảng
 * nhãn lệch nhau trước task 165, chỉ khác là ở tầng strand. Bảng sống ở
 * `shared` vì bề mặt công khai chỉ với ra được `@mindkid/shared/client`.
 */
export const STRANDS: readonly StrandTier[] = STRANDS_CATALOG;
