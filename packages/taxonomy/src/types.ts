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
    description: "Mathematical Thinking",
    name: "Tư duy toán học",
  },
  {
    code: "C2" as CompetencyCode,
    description: "Spatial Thinking",
    name: "Tư duy không gian",
  },
  {
    code: "C3" as CompetencyCode,
    description: "Logical Thinking",
    name: "Tư duy logic",
  },
  {
    code: "C4" as CompetencyCode,
    description: "Observation Thinking",
    name: "Tư duy quan sát",
  },
  {
    code: "C5" as CompetencyCode,
    description: "Language Thinking",
    name: "Tư duy ngôn ngữ",
  },
  {
    code: "C6" as CompetencyCode,
    description: "Executive Function",
    name: "Chức năng điều hành",
  },
] as const;

// ─── Strand constants ────────────────────────────────────────────────

export const STRANDS: readonly StrandTier[] = [
  // C1 — Mathematical Thinking (10 strands)
  {
    code: "C1.NREC" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Number Recognition",
    name: "Nhận biết số",
  },
  {
    code: "C1.CNT" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Counting",
    name: "Đếm",
  },
  {
    code: "C1.OTO" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "One-to-One Correspondence",
    name: "Tương ứng 1-1",
  },
  {
    code: "C1.CMP" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Compare",
    name: "So sánh",
  },
  {
    code: "C1.NCOMP" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Number Composition",
    name: "Tách gộp số",
  },
  {
    code: "C1.ADD" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Addition",
    name: "Phép cộng",
  },
  {
    code: "C1.SUB" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Subtraction",
    name: "Phép trừ",
  },
  {
    code: "C1.MEAS" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Measurement",
    name: "Đo lường",
  },
  {
    code: "C1.PAT" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Pattern",
    name: "Quy luật",
  },
  {
    code: "C1.PROB" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Problem Solving",
    name: "Giải quyết vấn đề",
  },

  // C2 — Spatial Thinking (8 strands)
  {
    code: "C2.ORI" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Orientation",
    name: "Định hướng",
  },
  {
    code: "C2.DIR" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Direction",
    name: "Hướng",
  },
  {
    code: "C2.GEO" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Geometry",
    name: "Hình học",
  },
  {
    code: "C2.CON" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Construction",
    name: "Xây dựng",
  },
  {
    code: "C2.ROT" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Rotation",
    name: "Xoay",
  },
  {
    code: "C2.MIR" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Mirror & Symmetry",
    name: "Đối xứng",
  },
  {
    code: "C2.PER" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Perspective",
    name: "Phối cảnh",
  },
  {
    code: "C2.MAZ" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Maze",
    name: "Mê cung",
  },

  // C3 — Logical Thinking (8 strands)
  {
    code: "C3.CLS" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Classification",
    name: "Phân loại",
  },
  {
    code: "C3.SRT" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Sorting / Seriation",
    name: "Sắp xếp",
  },
  {
    code: "C3.ANA" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Analogy",
    name: "Loại suy",
  },
  {
    code: "C3.SEQ" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Sequence",
    name: "Trình tự",
  },
  {
    code: "C3.RULE" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Rule Finding",
    name: "Tìm quy tắc",
  },
  {
    code: "C3.MTX" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Matrix",
    name: "Ma trận",
  },
  {
    code: "C3.DED" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Deduction",
    name: "Suy diễn",
  },
  {
    code: "C3.INF" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Inference",
    name: "Suy luận",
  },

  // C4 — Observation Thinking (4 strands)
  {
    code: "C4.VIS" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Visual Attention",
    name: "Chú ý thị giác",
  },
  {
    code: "C4.DET" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Detail Recognition",
    name: "Nhận biết chi tiết",
  },
  {
    code: "C4.MEM" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Memory",
    name: "Trí nhớ",
  },
  {
    code: "C4.SEN" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Sensory Discrimination",
    name: "Phân biệt giác quan",
  },

  // C5 — Language Thinking (5 strands)
  {
    code: "C5.LIS" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Listening",
    name: "Nghe",
  },
  {
    code: "C5.VOC" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Vocabulary",
    name: "Từ vựng",
  },
  {
    code: "C5.STO" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Story",
    name: "Truyện",
  },
  {
    code: "C5.DES" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Describe",
    name: "Mô tả",
  },
  {
    code: "C5.QUE" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Question",
    name: "Câu hỏi",
  },

  // C6 — Executive Function (6 strands)
  {
    code: "C6.ATT" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    description: "Attention",
    name: "Chú ý",
  },
  {
    code: "C6.WM" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    description: "Working Memory",
    name: "Trí nhớ làm việc",
  },
  {
    code: "C6.INH" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    description: "Inhibition",
    name: "Ức chế",
  },
  {
    code: "C6.FLX" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    description: "Cognitive Flexibility",
    name: "Linh hoạt nhận thức",
  },
  {
    code: "C6.PLN" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    description: "Planning",
    name: "Lập kế hoạch",
  },
  {
    code: "C6.MON" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    description: "Self Monitoring",
    name: "Tự giám sát",
  },
] as const;
