/**
 * Taxonomy constants — competencies and strands.
 *
 * Source of truth: `docs/taxonomy/index.md` + per-competency files.
 * Layer 1 — code-owned master data. Admin reads only. Change = PR + deploy.
 *
 * Re-exports taxonomy types from @kidthink/shared so downstream
 * packages only need `@kidthink/taxonomy`.
 */

import type {
  CompetencyCode,
  CompetencyTier,
  StrandCode,
  StrandTier,
} from "@kidthink/shared";

// Re-export all taxonomy types for convenience
export type {
  AccessTier,
  CompetencyTier,
  ContentLifecycleStatus,
  ContentWhat,
  DataLayer,
  GameLevelMeta,
  GameMechanic,
  GameTemplateMeta,
  LearningObjectiveTier,
  SkillTier,
  StrandTier,
  ThinkingProcess,
} from "@kidthink/shared";

// ─── Competency constants ────────────────────────────────────────────

export const COMPETENCIES: readonly CompetencyTier[] = [
  {
    code: "C1" as CompetencyCode,
    name_en: "Mathematical Thinking",
    name_vi: "Tư duy toán học",
  },
  {
    code: "C2" as CompetencyCode,
    name_en: "Spatial Thinking",
    name_vi: "Tư duy không gian",
  },
  {
    code: "C3" as CompetencyCode,
    name_en: "Logical Thinking",
    name_vi: "Tư duy logic",
  },
  {
    code: "C4" as CompetencyCode,
    name_en: "Observation Thinking",
    name_vi: "Tư duy quan sát",
  },
  {
    code: "C5" as CompetencyCode,
    name_en: "Language Thinking",
    name_vi: "Tư duy ngôn ngữ",
  },
  {
    code: "C6" as CompetencyCode,
    name_en: "Executive Function",
    name_vi: "Chức năng điều hành",
  },
] as const;

// ─── Strand constants ────────────────────────────────────────────────

export const STRANDS: readonly StrandTier[] = [
  // C1 — Mathematical Thinking (10 strands)
  {
    code: "C1.NREC" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "Number Recognition",
    name_vi: "Nhận biết số",
  },
  {
    code: "C1.CNT" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "Counting",
    name_vi: "Đếm",
  },
  {
    code: "C1.OTO" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "One-to-One Correspondence",
    name_vi: "Tương ứng 1-1",
  },
  {
    code: "C1.CMP" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "Compare",
    name_vi: "So sánh",
  },
  {
    code: "C1.NCOMP" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "Number Composition",
    name_vi: "Tách gộp số",
  },
  {
    code: "C1.ADD" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "Addition",
    name_vi: "Phép cộng",
  },
  {
    code: "C1.SUB" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "Subtraction",
    name_vi: "Phép trừ",
  },
  {
    code: "C1.MEAS" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "Measurement",
    name_vi: "Đo lường",
  },
  {
    code: "C1.PAT" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "Pattern",
    name_vi: "Quy luật",
  },
  {
    code: "C1.PROB" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    name_en: "Problem Solving",
    name_vi: "Giải quyết vấn đề",
  },

  // C2 — Spatial Thinking (8 strands)
  {
    code: "C2.ORI" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    name_en: "Orientation",
    name_vi: "Định hướng",
  },
  {
    code: "C2.DIR" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    name_en: "Direction",
    name_vi: "Hướng",
  },
  {
    code: "C2.GEO" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    name_en: "Geometry",
    name_vi: "Hình học",
  },
  {
    code: "C2.CON" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    name_en: "Construction",
    name_vi: "Xây dựng",
  },
  {
    code: "C2.ROT" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    name_en: "Rotation",
    name_vi: "Xoay",
  },
  {
    code: "C2.MIR" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    name_en: "Mirror & Symmetry",
    name_vi: "Đối xứng",
  },
  {
    code: "C2.PER" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    name_en: "Perspective",
    name_vi: "Phối cảnh",
  },
  {
    code: "C2.MAZ" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    name_en: "Maze",
    name_vi: "Mê cung",
  },

  // C3 — Logical Thinking (8 strands)
  {
    code: "C3.CLS" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    name_en: "Classification",
    name_vi: "Phân loại",
  },
  {
    code: "C3.SRT" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    name_en: "Sorting / Seriation",
    name_vi: "Sắp xếp",
  },
  {
    code: "C3.ANA" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    name_en: "Analogy",
    name_vi: "Loại suy",
  },
  {
    code: "C3.SEQ" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    name_en: "Sequence",
    name_vi: "Trình tự",
  },
  {
    code: "C3.RULE" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    name_en: "Rule Finding",
    name_vi: "Tìm quy tắc",
  },
  {
    code: "C3.MTX" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    name_en: "Matrix",
    name_vi: "Ma trận",
  },
  {
    code: "C3.DED" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    name_en: "Deduction",
    name_vi: "Suy diễn",
  },
  {
    code: "C3.INF" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    name_en: "Inference",
    name_vi: "Suy luận",
  },

  // C4 — Observation Thinking (4 strands)
  {
    code: "C4.VIS" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    name_en: "Visual Attention",
    name_vi: "Chú ý thị giác",
  },
  {
    code: "C4.DET" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    name_en: "Detail Recognition",
    name_vi: "Nhận biết chi tiết",
  },
  {
    code: "C4.MEM" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    name_en: "Memory",
    name_vi: "Trí nhớ",
  },
  {
    code: "C4.SEN" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    name_en: "Sensory Discrimination",
    name_vi: "Phân biệt giác quan",
  },

  // C5 — Language Thinking (5 strands)
  {
    code: "C5.LIS" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    name_en: "Listening",
    name_vi: "Nghe",
  },
  {
    code: "C5.VOC" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    name_en: "Vocabulary",
    name_vi: "Từ vựng",
  },
  {
    code: "C5.STO" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    name_en: "Story",
    name_vi: "Truyện",
  },
  {
    code: "C5.DES" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    name_en: "Describe",
    name_vi: "Mô tả",
  },
  {
    code: "C5.QUE" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    name_en: "Question",
    name_vi: "Câu hỏi",
  },

  // C6 — Executive Function (6 strands)
  {
    code: "C6.ATT" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    name_en: "Attention",
    name_vi: "Chú ý",
  },
  {
    code: "C6.WM" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    name_en: "Working Memory",
    name_vi: "Trí nhớ làm việc",
  },
  {
    code: "C6.INH" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    name_en: "Inhibition",
    name_vi: "Ức chế",
  },
  {
    code: "C6.FLX" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    name_en: "Cognitive Flexibility",
    name_vi: "Linh hoạt nhận thức",
  },
  {
    code: "C6.PLN" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    name_en: "Planning",
    name_vi: "Lập kế hoạch",
  },
  {
    code: "C6.MON" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    name_en: "Self Monitoring",
    name_vi: "Tự giám sát",
  },
] as const;
