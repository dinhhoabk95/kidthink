import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A13
 * Workbook 13: Tách gộp số lượng phạm vi 20 (GT-007 - number-bond)
 * 1 dạng bài (WB13-D1), 2 level, GT-007, band 5-6
 */
export const SEED_MONT_A13: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-NCOMP-BOND-0129",
      content_version: 1,
      template_code: "GT-007",
      title: "Tách số 15 thành 10 và mấy",
      instruction: "Số 15 gồm 1 chục và mấy đơn vị, bé hãy chọn!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.NCOMP.09"],
      learning_objective_codes: ["LO-C1.NCOMP.09-01"],
      what_tags: ["number"],
      thinking_tags: ["infer", "sort"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số 15 gồm 10 và mấy?",
      whole: {
        id: "w15",
        value: 15,
        label: "15",
      },
      parts: [
        {
          id: "p1",
          value: 10,
          is_target: false,
          label: "10",
        },
        {
          id: "p2",
          value: 5,
          is_target: true,
          label: "?",
        },
      ],
      options: [
        {
          id: "opt-1",
          value: 4,
          is_correct: false,
        },
        {
          id: "opt-2",
          value: 5,
          is_correct: true,
        },
        {
          id: "opt-3",
          value: 6,
          is_correct: false,
        },
      ],
      scaffolding: {
        l1_nudge: "Bó 10 que tính phát sáng",
        l2_guidance: "Bàn tay ảo gợi ý 'Mười thêm năm là mười lăm'",
        l3_demo: "Bàn tay ảo chọn thẻ số 5",
      },
    },
    difficulty_params: {
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-NCOMP-BOND-0130",
      content_version: 1,
      template_code: "GT-007",
      title: "Tách số 20 thành 12 và mấy",
      instruction: "Bé tìm số còn thiếu để tách đủ 20 nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C1.NCOMP.09"],
      learning_objective_codes: ["LO-C1.NCOMP.09-01"],
      what_tags: ["number"],
      thinking_tags: ["infer", "sort"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số 20 gồm 12 và mấy?",
      whole: {
        id: "w20",
        value: 20,
        label: "20",
      },
      parts: [
        {
          id: "p1",
          value: 12,
          is_target: false,
          label: "12",
        },
        {
          id: "p2",
          value: 8,
          is_target: true,
          label: "?",
        },
      ],
      options: [
        {
          id: "opt-1",
          value: 7,
          is_correct: false,
        },
        {
          id: "opt-2",
          value: 8,
          is_correct: true,
        },
        {
          id: "opt-3",
          value: 9,
          is_correct: false,
        },
      ],
      scaffolding: {
        l1_nudge: "Ô chấm hỏi phát sáng nhẹ",
        l2_guidance: "Bàn tay ảo đếm bù 'Mười hai cộng tám bằng hai mươi'",
        l3_demo: "Bàn tay ảo chọn thẻ số 8",
      },
    },
    difficulty_params: {
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
];
