import type { ContentSeed } from "../types.js";

/**
 * Batch: SEED-MONT-A11
 * Workbook 11: Thử tài điền số thông minh (Phần Lô A - Đếm nhảy cóc)
 * 1 dạng bài (WB11-D1), 2 level, GT-001, band 4-5
 */
export const SEED_MONT_A11: ContentSeed<unknown, unknown>[] = [
  // WB11-D1 Level 1 (Diff 2 - Login)
  {
    header: {
      code: "GL-C1-CNT-CARD-0119",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm nhảy cóc cách 2 số chẵn",
      instruction: "Bé chọn số còn thiếu trong dãy đếm cách 2 nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.05"],
      learning_objective_codes: ["LO-C1.CNT.05-01"],
      what_tags: ["number"],
      thinking_tags: ["count", "infer"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["2", "4", "?", "8", "10"],
      missing_index: 2,
      target: "6",
      options: [
        { id: "opt-1", text: "5", is_correct: false },
        { id: "opt-2", text: "6", is_correct: true },
        { id: "opt-3", text: "7", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Chú ếch nhảy qua từng số phát sáng",
        l2_guidance: "Bàn tay ảo đếm 'Hai, bốn... sáu, tám, mười'",
        l3_demo: "Bàn tay ảo chọn thẻ số 6",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
  // WB11-D1 Level 2 (Diff 3 - Standard)
  {
    header: {
      code: "GL-C1-CNT-CARD-0120",
      content_version: 1,
      template_code: "GT-001",
      title: "Đếm nhảy cóc cách 2 số lẻ",
      instruction: "Số lẻ nào còn thiếu ở ô trống, bé hãy chọn!",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.CNT.05"],
      learning_objective_codes: ["LO-C1.CNT.05-01"],
      what_tags: ["number"],
      thinking_tags: ["count", "infer"],
      theme_tag: "park",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      sequence: ["1", "3", "5", "?", "9"],
      missing_index: 3,
      target: "7",
      options: [
        { id: "opt-1", text: "6", is_correct: false },
        { id: "opt-2", text: "7", is_correct: true },
        { id: "opt-3", text: "8", is_correct: false },
      ],
      scaffolding: {
        l1_nudge: "Ô đá số 7 nhấp nháy phát sáng nhẹ",
        l2_guidance: "Bàn tay ảo đếm nhịp cách 2: 'Một, ba, năm... bảy!'",
        l3_demo: "Bàn tay ảo chạm thẻ số 7 làm mẫu",
      },
    },
    difficulty_params: { count: 3, distractor_count: 2 },
  },
];
