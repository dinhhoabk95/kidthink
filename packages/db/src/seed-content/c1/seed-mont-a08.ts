import type { ContentSeed } from "../types.js";

/**
 * Batch: SEED-MONT-A08
 * Workbook 08: Tách gộp số lượng phạm vi 10 (GT-007 - number-bond)
 * 1 dạng bài (WB08-D1), 2 level, GT-007, band 4-5
 */
export const SEED_MONT_A08: ContentSeed<unknown, unknown>[] = [
  // WB08-D1 Level 1 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-NCOMP-BOND-0127",
      content_version: 1,
      template_code: "GT-007",
      title: "Tách số 10 thành 7 và mấy",
      instruction: "Bé chọn số còn thiếu để tách số 10 nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.NCOMP.09"],
      learning_objective_codes: ["LO-C1.NCOMP.09-01"],
      what_tags: ["numbers", "wb08"],
      thinking_tags: ["solve", "classify"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số 10 gồm 7 và mấy?",
      whole: { id: "w10", value: 10, label: "10" },
      parts: [
        { id: "p1", value: 7, is_target: false, label: "7" },
        { id: "p2", value: 3, is_target: true, label: "?" },
      ],
      options: [
        { id: "opt-1", value: 2, is_correct: false },
        { id: "opt-2", value: 3, is_correct: true },
        { id: "opt-3", value: 4, is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Ô chấm hỏi phát sáng nhẹ",
        l2_guidance: "Bàn tay ảo đếm 'Bảy thêm ba bằng mười'",
        l3_demo: "Bàn tay ảo chọn thẻ số 3 làm mẫu",
      },
    },
    difficulty_params: { part_count: 2, distractor_count: 2 },
  },
  // WB08-D1 Level 2 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C1-NCOMP-BOND-0128",
      content_version: 1,
      template_code: "GT-007",
      title: "Tách số 10 thành 5 và mấy",
      instruction: "Số 10 gồm 5 và mấy, bé hãy chọn số đúng!",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.NCOMP.09"],
      learning_objective_codes: ["LO-C1.NCOMP.09-01"],
      what_tags: ["numbers", "wb08"],
      thinking_tags: ["solve", "classify"],
      theme_tag: "household",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số 10 gồm 5 và mấy?",
      whole: { id: "w10", value: 10, label: "10" },
      parts: [
        { id: "p1", value: 5, is_target: false, label: "5" },
        { id: "p2", value: 5, is_target: true, label: "?" },
      ],
      options: [
        { id: "opt-1", value: 4, is_correct: false },
        { id: "opt-2", value: 5, is_correct: true },
        { id: "opt-3", value: 6, is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Số 5 ở rổ đối diện phát sáng",
        l2_guidance:
          "Bàn tay ảo gợi ý 'Hai bàn tay mỗi bên năm ngón là mười ngón'",
        l3_demo: "Bàn tay ảo chạm thẻ số 5",
      },
    },
    difficulty_params: { part_count: 2, distractor_count: 2 },
  },
];
