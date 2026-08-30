import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A07
 * Workbook 07: Tách gộp số lượng phạm vi 5 (GT-007 - number-bond)
 * 1 dạng bài (WB07-D1), 2 level, GT-007, band 3-4
 */
export const SEED_MONT_A07: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-NCOMP-BOND-0125",
      montessori_ref: "WB07-D1",
      content_version: 1,
      template_code: "GT-007",
      title: "Tách số 4 thành 3 và mấy",
      instruction: "Bé chọn số còn thiếu để tách số 4 nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.NCOMP.04"],
      learning_objective_codes: ["LO-C1.NCOMP.04-01"],
      what_tags: ["number"],
      thinking_tags: ["infer", "sort"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số 4 gồm 3 và mấy?",
      whole: {
        id: "w4",
        value: 4,
        label: "4",
      },
      parts: [
        {
          id: "p1",
          value: 3,
          is_target: false,
          label: "3",
        },
        {
          id: "p2",
          value: 1,
          is_target: true,
          label: "?",
        },
      ],
      options: [
        {
          id: "opt-1",
          value: 1,
          is_correct: true,
        },
        {
          id: "opt-2",
          value: 2,
          is_correct: false,
        },
        {
          id: "opt-3",
          value: 3,
          is_correct: false,
        },
      ],
      scaffolding: {
        l1_nudge: "Nhánh số 1 phát sáng nhẹ",
        l2_guidance: "Bàn tay ảo đếm 'Ba thêm một là bốn'",
        l3_demo: "Bàn tay ảo chọn thẻ số 1 làm mẫu",
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
      code: "GL-C1-NCOMP-BOND-0126",
      montessori_ref: "WB07-D1",
      content_version: 1,
      template_code: "GT-007",
      title: "Tách số 5 thành 2 và mấy",
      instruction: "Số 5 tách thành 2 và mấy, bé hãy chọn!",
      age_min: 3,
      age_max: 4,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.NCOMP.04"],
      learning_objective_codes: ["LO-C1.NCOMP.04-01"],
      what_tags: ["number"],
      thinking_tags: ["infer", "sort"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số 5 gồm 2 và mấy?",
      whole: {
        id: "w5",
        value: 5,
        label: "5",
      },
      parts: [
        {
          id: "p1",
          value: 2,
          is_target: false,
          label: "2",
        },
        {
          id: "p2",
          value: 3,
          is_target: true,
          label: "?",
        },
      ],
      options: [
        {
          id: "opt-1",
          value: 1,
          is_correct: false,
        },
        {
          id: "opt-2",
          value: 3,
          is_correct: true,
        },
        {
          id: "opt-3",
          value: 4,
          is_correct: false,
        },
      ],
      scaffolding: {
        l1_nudge: "Ô chấm hỏi nhấp nháy phát sáng",
        l2_guidance: "Bàn tay ảo gợi ý 'Hai ngón tay thêm ba ngón tay là năm'",
        l3_demo: "Bàn tay ảo chạm thẻ số 3",
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
