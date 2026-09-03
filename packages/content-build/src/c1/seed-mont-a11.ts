import type { ContentSeed } from "@mindkid/content";

/**
 * Batch: SEED-MONT-A11
 * Workbook 11: Thử tài điền số thông minh (Phần Lô A - Đếm nhảy cóc)
 * 1 dạng bài (WB11-D1), 2 level, GT-001, band 4-5
 */
export const SEED_MONT_A11: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-CNT-CARD-0119",
      montessori_ref: "WB11-D1",
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
      prompt: "Bé chọn số còn thiếu trong dãy đếm cách 2 nhé!",
      target_item: {
        item_id: "opt-2",
        asset: {
          kind: "emoji",
          ref: "6️⃣",
        },
      },
      options: [
        {
          item_id: "opt-1",
          asset: {
            kind: "emoji",
            ref: "5️⃣",
          },
          is_correct: false,
        },
        {
          item_id: "opt-2",
          asset: {
            kind: "emoji",
            ref: "6️⃣",
          },
          is_correct: true,
        },
        {
          item_id: "opt-3",
          asset: {
            kind: "emoji",
            ref: "7️⃣",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-CARD-0120",
      montessori_ref: "WB11-D1",
      content_version: 2,
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
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Số lẻ nào còn thiếu ở ô trống, bé hãy chọn!",
      target_item: {
        item_id: "opt-2",
        asset: {
          kind: "emoji",
          ref: "7️⃣",
        },
      },
      options: [
        {
          item_id: "opt-1",
          asset: {
            kind: "emoji",
            ref: "6️⃣",
          },
          is_correct: false,
        },
        {
          item_id: "opt-2",
          asset: {
            kind: "emoji",
            ref: "7️⃣",
          },
          is_correct: true,
        },
        {
          item_id: "opt-3",
          asset: {
            kind: "emoji",
            ref: "8️⃣",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
];
