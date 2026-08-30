import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A18
 * Workbook 18: Làm quen với đồng hồ (Phần Lô A - Đọc giờ đúng)
 * 1 dạng bài (WB18-D1), 2 level, GT-001, band 5-6
 */
export const SEED_MONT_A18: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-MEAS-CARD-0123",
      content_version: 1,
      template_code: "GT-016",
      title: "Đọc đồng hồ 3 giờ đúng",
      instruction: "Đồng hồ đang chỉ mấy giờ, bé hãy chọn số đúng nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C1.MEAS.13"],
      learning_objective_codes: ["LO-C1.MEAS.13-01"],
      what_tags: ["time"],
      thinking_tags: ["observe", "match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Đồng hồ đang chỉ mấy giờ, bé hãy chọn số đúng nhé!",
      mode: "read",
      target_time: {
        hour: 3,
        minute: 0,
      },
      options: [
        {
          hour: 3,
          minute: 0,
          is_correct: true,
        },
        {
          hour: 12,
          minute: 0,
          is_correct: false,
        },
        {
          hour: 4,
          minute: 0,
          is_correct: false,
        },
      ],
      activity_cards: [],
    },
    difficulty_params: {
      minute_step: 30,
      distractor_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-MEAS-CARD-0124",
      content_version: 1,
      template_code: "GT-016",
      title: "Đọc đồng hồ 9 giờ đúng",
      instruction: "Bé nhìn kim ngắn và kim dài xem là mấy giờ nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C1.MEAS.13"],
      learning_objective_codes: ["LO-C1.MEAS.13-01"],
      what_tags: ["time"],
      thinking_tags: ["observe", "match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nhìn kim ngắn và kim dài xem là mấy giờ nhé!",
      mode: "read",
      target_time: {
        hour: 9,
        minute: 0,
      },
      options: [
        {
          hour: 6,
          minute: 0,
          is_correct: false,
        },
        {
          hour: 9,
          minute: 0,
          is_correct: true,
        },
        {
          hour: 10,
          minute: 0,
          is_correct: false,
        },
      ],
      activity_cards: [],
    },
    difficulty_params: {
      minute_step: 30,
      distractor_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
];
