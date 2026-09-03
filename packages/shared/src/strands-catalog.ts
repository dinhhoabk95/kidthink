/**
 * Bảng nhãn 71 mạch kỹ năng (Strands) — nguồn duy nhất cho mọi bề mặt.
 *
 * `name` và `description` chép nguyên văn `docs/taxonomy/index.md`.
 * Module này Cấm — NEVER import gì ngoài type, để `@mindkid/shared/client`
 * mang được nó xuống trình duyệt an toàn.
 */

import type { CompetencyCode, StrandCode } from "./ids.js";
import type { StrandTier } from "./taxonomy-types.js";

export interface StrandCatalogEntry extends StrandTier {
  readonly code: StrandCode;
  readonly competency_code: CompetencyCode;
  readonly name: string;
  readonly description: string;
}

export const STRANDS_CATALOG: readonly StrandCatalogEntry[] = [
  // C1 — Mathematical Thinking (12 strands)
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

  {
    code: "C1.ORD" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Ordinal Number",
    name: "Số thứ tự",
  },
  {
    code: "C1.DAT" as StrandCode,
    competency_code: "C1" as CompetencyCode,
    description: "Data",
    name: "Dữ liệu",
  },

  // C2 — Spatial Thinking (10 strands)
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

  {
    code: "C2.SOL" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Solid Shape",
    name: "Hình khối 3D",
  },
  {
    code: "C2.GRD" as StrandCode,
    competency_code: "C2" as CompetencyCode,
    description: "Grid & Coordinate",
    name: "Toạ độ lưới",
  },

  // C3 — Logical Thinking (10 strands)
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

  {
    code: "C3.SET" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Set & Membership",
    name: "Tập hợp",
  },
  {
    code: "C3.ALG" as StrandCode,
    competency_code: "C3" as CompetencyCode,
    description: "Algorithmic Thinking",
    name: "Tư duy thuật toán",
  },

  // C4 — Discovery Thinking (16 strands)
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

  {
    code: "C4.AUD" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Auditory Discrimination",
    name: "Phân biệt thính giác",
  },
  {
    code: "C4.TAC" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Tactile & Weight",
    name: "Xúc giác và trọng giác",
  },
  {
    code: "C4.OBS" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Scientific Observation",
    name: "Quan sát khoa học",
  },
  {
    code: "C4.EXP" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Experiment & Prediction",
    name: "Thử nghiệm và dự đoán",
  },
  {
    code: "C4.CAU" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Cause & Effect",
    name: "Nhân quả",
  },
  {
    code: "C4.LIV" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Living World",
    name: "Thế giới sống",
  },
  {
    code: "C4.MAT" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Matter & Phenomena",
    name: "Vật chất và hiện tượng",
  },
  {
    code: "C4.TOO" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Tools & Technology",
    name: "Công cụ và công nghệ",
  },
  {
    code: "C4.SOC" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Social Discovery",
    name: "Khám phá xã hội",
  },
  {
    code: "C4.HOM" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Homeland & Festival",
    name: "Quê hương và lễ hội",
  },
  {
    code: "C4.SAF" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Safety & Traffic",
    name: "An toàn và giao thông",
  },
  {
    code: "C4.ECO" as StrandCode,
    competency_code: "C4" as CompetencyCode,
    description: "Environment & Care",
    name: "Môi trường và bảo vệ",
  },

  // C5 — Language Thinking (15 strands)
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

  {
    code: "C5.PRA" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Pragmatics & Conversation",
    name: "Giao tiếp và hội thoại",
  },
  {
    code: "C5.GRM" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Sentence & Grammar",
    name: "Câu và ngữ pháp",
  },
  {
    code: "C5.PHO" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Phonological Awareness",
    name: "Nhận thức âm vị",
  },
  {
    code: "C5.RHY" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Rhyme & Rime",
    name: "Vần",
  },
  {
    code: "C5.TON" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Tone",
    name: "Thanh điệu",
  },
  {
    code: "C5.ALP" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Alphabet",
    name: "Chữ cái",
  },
  {
    code: "C5.PRN" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Print Concepts",
    name: "Khái niệm chữ viết",
  },
  {
    code: "C5.BOK" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Book & Story Handling",
    name: "Sách và truyện",
  },
  {
    code: "C5.WRT" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Pre-writing",
    name: "Tiền tập viết",
  },
  {
    code: "C5.WRD" as StrandCode,
    competency_code: "C5" as CompetencyCode,
    description: "Word Reading",
    name: "Đọc tiếng và từ",
  },

  // C6 — Executive Function (8 strands)
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
  {
    code: "C6.PER" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    description: "Persistence",
    name: "Kiên trì",
  },
  {
    code: "C6.INI" as StrandCode,
    competency_code: "C6" as CompetencyCode,
    description: "Initiative",
    name: "Khởi xướng",
  },
] as const;

/** Tra danh sách strands thuộc một competency code (C1..C6). */
export function findStrandsByCompetency(
  competencyCode: string
): readonly StrandCatalogEntry[] {
  return STRANDS_CATALOG.filter(
    (entry) => entry.competency_code === competencyCode
  );
}

/** Tra một strand theo mã. */
export function findStrand(code: string): StrandCatalogEntry | undefined {
  return STRANDS_CATALOG.find((entry) => entry.code === code);
}
