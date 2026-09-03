import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A10
 * Workbook 10: Tư duy màu sắc (Sắc độ & Phân loại màu)
 * 2 dạng bài, 4 level, GT-004 và GT-006, band 4-5
 */
export const SEED_MONT_A10: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C4-SEN-SORT-0107",
      montessori_ref: "WB10-D1",
      content_version: 2,
      template_code: "GT-004",
      title: "Phân loại đồ vật theo màu Đỏ và Vàng",
      instruction: "Bé hãy xếp đồ màu đỏ và vàng vào đúng rổ nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      what_tags: ["colour"],
      thinking_tags: ["sort", "compare"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy xếp đồ màu đỏ và vàng vào đúng rổ nhé!",
      groups: [
        {
          group_id: "g0",
          label: "Rổ Đỏ",
          label_emoji: "🧺",
        },
        {
          group_id: "g1",
          label: "Rổ Vàng",
          label_emoji: "🧺",
        },
      ],
      items: [
        {
          item_id: "item-1",
          asset: {
            kind: "emoji",
            ref: "🍎",
          },
          correct_group_id: "g0",
        },
        {
          item_id: "item-2",
          asset: {
            kind: "emoji",
            ref: "🍓",
          },
          correct_group_id: "g0",
        },
        {
          item_id: "item-3",
          asset: {
            kind: "emoji",
            ref: "🍌",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item-4",
          asset: {
            kind: "emoji",
            ref: "🍋",
          },
          correct_group_id: "g1",
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C4-SEN-SORT-0108",
      montessori_ref: "WB10-D1",
      content_version: 2,
      template_code: "GT-004",
      title: "Phân loại 3 nhóm màu Xanh, Đỏ, Vàng",
      instruction: "Bé phân loại các đồ vật vào 3 hộp màu nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      what_tags: ["colour"],
      thinking_tags: ["sort", "compare"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé phân loại các đồ vật vào 3 hộp màu nhé!",
      groups: [
        {
          group_id: "g0",
          label: "Hộp Đỏ",
          label_emoji: "🧺",
        },
        {
          group_id: "g1",
          label: "Hộp Vàng",
          label_emoji: "🧺",
        },
        {
          group_id: "g2",
          label: "Hộp Xanh",
          label_emoji: "🧺",
        },
      ],
      items: [
        {
          item_id: "item-1",
          asset: {
            kind: "emoji",
            ref: "🍎",
          },
          correct_group_id: "g0",
        },
        {
          item_id: "item-2",
          asset: {
            kind: "emoji",
            ref: "🍌",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item-3",
          asset: {
            kind: "emoji",
            ref: "🫐",
          },
          correct_group_id: "g2",
        },
        {
          item_id: "item-4",
          asset: {
            kind: "emoji",
            ref: "🚗",
          },
          correct_group_id: "g0",
        },
        {
          item_id: "item-5",
          asset: {
            kind: "emoji",
            ref: "🐥",
          },
          correct_group_id: "g1",
        },
        {
          item_id: "item-6",
          asset: {
            kind: "emoji",
            ref: "🐳",
          },
          correct_group_id: "g2",
        },
      ],
    },
    difficulty_params: {
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    header: {
      code: "GL-C4-SEN-SEQ-0109",
      montessori_ref: "WB10-D2",
      content_version: 2,
      template_code: "GT-006",
      title: "Xếp 3 sắc độ màu từ nhạt đến đậm",
      instruction: "Bé xếp các thẻ màu từ nhạt nhất đến đậm nhất nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      what_tags: ["colour"],
      thinking_tags: ["compare", "sequence"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé xếp các thẻ màu từ nhạt nhất đến đậm nhất nhé!",
      sequence: [
        {
          step_id: "c-dark",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "⭐",
          },
          label: "Xanh đậm",
        },
        {
          step_id: "c-light",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "⭐",
          },
          label: "Xanh nhạt",
        },
        {
          step_id: "c-mid",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "⭐",
          },
          label: "Xanh vừa",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
  {
    header: {
      code: "GL-C4-SEN-SEQ-0110",
      montessori_ref: "WB10-D2",
      content_version: 2,
      template_code: "GT-006",
      title: "Xếp 4 sắc độ màu hồng nhạt đến đậm",
      instruction: "Bé xếp dải màu hồng theo thứ tự từ nhạt đến đậm!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C4.SEN.01"],
      learning_objective_codes: ["LO-C4.SEN.01-01"],
      what_tags: ["colour"],
      thinking_tags: ["compare", "sequence"],
      theme_tag: "art",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé xếp dải màu hồng theo thứ tự từ nhạt đến đậm!",
      sequence: [
        {
          step_id: "p-4",
          order_index: 3,
          asset: {
            kind: "emoji",
            ref: "⭐",
          },
          label: "Hồng đậm nhất",
        },
        {
          step_id: "p-2",
          order_index: 1,
          asset: {
            kind: "emoji",
            ref: "⭐",
          },
          label: "Hồng vừa",
        },
        {
          step_id: "p-1",
          order_index: 0,
          asset: {
            kind: "emoji",
            ref: "⭐",
          },
          label: "Hồng phấn nhạt",
        },
        {
          step_id: "p-3",
          order_index: 2,
          asset: {
            kind: "emoji",
            ref: "⭐",
          },
          label: "Hồng sen",
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 12_000,
      allow_retry: true,
      shuffle_initial: true,
    },
  },
];
