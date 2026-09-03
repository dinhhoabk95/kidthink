import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A03
 * Workbook 03: Thử tài tìm bóng đúng
 * 2 dạng bài, 5 level, GT-001 và GT-005, band 3-4
 * WB03-D2 giữ 2 level (sàn tối thiểu); level thứ ba gỡ ở T99 WP99.0 để C4 về trần 9.
 */
export const SEED_MONT_A03: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C4-VIS-CARD-0101",
      montessori_ref: "WB03-D1",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm bóng của chú hươu cao cổ",
      instruction: "Bé hãy chọn bóng đúng của chú hươu cao cổ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      what_tags: ["category"],
      thinking_tags: ["observe", "match"],
      theme_tag: "animal",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chọn bóng đúng của chú hươu cao cổ nhé!",
      target_item: {
        item_id: "g1",
        asset: {
          kind: "emoji",
          ref: "🦒",
        },
      },
      options: [
        {
          item_id: "opt-1",
          asset: {
            kind: "emoji",
            ref: "🦒",
          },
          is_correct: true,
        },
        {
          item_id: "opt-2",
          asset: {
            kind: "emoji",
            ref: "🐘",
          },
          is_correct: false,
        },
        {
          item_id: "opt-3",
          asset: {
            kind: "emoji",
            ref: "🐎",
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
      code: "GL-C4-VIS-CARD-0102",
      montessori_ref: "WB03-D1",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm bóng của chiếc ô tô",
      instruction: "Bé hãy chọn chiếc bóng vừa vặn với ô tô nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      what_tags: ["category"],
      thinking_tags: ["observe", "match"],
      theme_tag: "vehicle",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chọn chiếc bóng vừa vặn với ô tô nhé!",
      target_item: {
        item_id: "car1",
        asset: {
          kind: "emoji",
          ref: "🚗",
        },
      },
      options: [
        {
          item_id: "opt-1",
          asset: {
            kind: "emoji",
            ref: "✈️",
          },
          is_correct: false,
        },
        {
          item_id: "opt-2",
          asset: {
            kind: "emoji",
            ref: "🚗",
          },
          is_correct: true,
        },
        {
          item_id: "opt-3",
          asset: {
            kind: "emoji",
            ref: "🚌",
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
      code: "GL-C4-VIS-CARD-0103",
      montessori_ref: "WB03-D1",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm bóng của chú bướm xinh",
      instruction: "Bé tìm bóng của chú bướm đang xòe cánh nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C4.VIS.01"],
      learning_objective_codes: ["LO-C4.VIS.01-01"],
      what_tags: ["category"],
      thinking_tags: ["observe", "compare"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm bóng của chú bướm đang xòe cánh nhé!",
      target_item: {
        item_id: "bf1",
        asset: {
          kind: "emoji",
          ref: "🦋",
        },
      },
      options: [
        {
          item_id: "opt-1",
          asset: {
            kind: "emoji",
            ref: "🐝",
          },
          is_correct: false,
        },
        {
          item_id: "opt-2",
          asset: {
            kind: "emoji",
            ref: "🦋",
          },
          is_correct: true,
        },
        {
          item_id: "opt-3",
          asset: {
            kind: "emoji",
            ref: "🦗",
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
      code: "GL-C4-VIS-MATCH-0104",
      montessori_ref: "WB03-D2",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép đôi 2 con vật với bóng",
      instruction: "Bé nối từng con vật với chiếc bóng tương ứng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      what_tags: ["category"],
      thinking_tags: ["observe", "match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nối từng con vật với chiếc bóng tương ứng nhé!",
      pairs: [
        {
          pair_id: "pair-1",
          left: {
            item_id: "cat",
            asset: {
              kind: "emoji",
              ref: "🐱",
            },
          },
          right: {
            item_id: "cat-shadow",
            asset: {
              kind: "emoji",
              ref: "🐱",
            },
          },
        },
        {
          pair_id: "pair-2",
          left: {
            item_id: "rabbit",
            asset: {
              kind: "emoji",
              ref: "🐰",
            },
          },
          right: {
            item_id: "rabbit-shadow",
            asset: {
              kind: "emoji",
              ref: "🐰",
            },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_sides: false,
    },
  },
  {
    header: {
      code: "GL-C4-VIS-MATCH-0105",
      montessori_ref: "WB03-D2",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép đôi 3 con vật với bóng",
      instruction: "Bé tìm bóng cho mèo, thỏ và rùa nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C4.VIS.02"],
      learning_objective_codes: ["LO-C4.VIS.02-01"],
      what_tags: ["category"],
      thinking_tags: ["observe", "match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm bóng cho mèo, thỏ và rùa nhé!",
      pairs: [
        {
          pair_id: "pair-1",
          left: {
            item_id: "cat",
            asset: {
              kind: "emoji",
              ref: "🐱",
            },
          },
          right: {
            item_id: "cat-shadow",
            asset: {
              kind: "emoji",
              ref: "🐱",
            },
          },
        },
        {
          pair_id: "pair-2",
          left: {
            item_id: "rabbit",
            asset: {
              kind: "emoji",
              ref: "🐰",
            },
          },
          right: {
            item_id: "rabbit-shadow",
            asset: {
              kind: "emoji",
              ref: "🐰",
            },
          },
        },
        {
          pair_id: "pair-3",
          left: {
            item_id: "turtle",
            asset: {
              kind: "emoji",
              ref: "🐢",
            },
          },
          right: {
            item_id: "turtle-shadow",
            asset: {
              kind: "emoji",
              ref: "🐢",
            },
          },
        },
      ],
    },
    difficulty_params: {
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_sides: false,
    },
  },
];
