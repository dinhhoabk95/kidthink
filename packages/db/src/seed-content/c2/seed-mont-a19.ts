import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A19
 * Workbook 19: Tư duy hình khối (Khối 3D & Phối cảnh)
 * 2 dạng bài (WB19-D1, WB19-D2), 4 level, GT-005, band 5-6
 */
export const SEED_MONT_A19: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C2-GEO-MATCH-0101",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép đồ vật với khối hình tương ứng",
      instruction: "Bé nối quả bóng và hộp quà với khối hình dạng đúng!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C2.GEO.01"],
      learning_objective_codes: ["LO-C2.GEO.01-01"],
      what_tags: ["geometry"],
      thinking_tags: ["observe", "match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nối quả bóng và hộp quà với khối hình dạng đúng!",
      pairs: [
        {
          pair_id: "pair-1",
          left: {
            item_id: "ball",
            asset: {
              kind: "emoji",
              ref: "EMJ-soccer",
            },
          },
          right: {
            item_id: "sphere",
            asset: {
              kind: "emoji",
              ref: "EMJ-white-circle",
            },
          },
        },
        {
          pair_id: "pair-2",
          left: {
            item_id: "box",
            asset: {
              kind: "emoji",
              ref: "EMJ-gift",
            },
          },
          right: {
            item_id: "cube",
            asset: {
              kind: "emoji",
              ref: "EMJ-ice-cube",
            },
          },
        },
        {
          pair_id: "pair-3",
          left: {
            item_id: "can",
            asset: {
              kind: "emoji",
              ref: "EMJ-canned-food",
            },
          },
          right: {
            item_id: "cylinder",
            asset: {
              kind: "emoji",
              ref: "EMJ-oil-drum",
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
      code: "GL-C2-GEO-MATCH-0102",
      content_version: 1,
      template_code: "GT-005",
      title: "Phân loại 4 đồ vật theo khối hình học",
      instruction: "Bé hãy ghép 4 đồ vật với dạng khối 3D tương ứng!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C2.GEO.02"],
      learning_objective_codes: ["LO-C2.GEO.02-01"],
      what_tags: ["geometry"],
      thinking_tags: ["observe", "match"],
      theme_tag: "home",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy ghép 4 đồ vật với dạng khối 3D tương ứng!",
      pairs: [
        {
          pair_id: "pair-1",
          left: {
            item_id: "hat",
            asset: {
              kind: "emoji",
              ref: "EMJ-party-popper",
            },
          },
          right: {
            item_id: "cone",
            asset: {
              kind: "emoji",
              ref: "EMJ-ice-cream",
            },
          },
        },
        {
          pair_id: "pair-2",
          left: {
            item_id: "dice",
            asset: {
              kind: "emoji",
              ref: "EMJ-die",
            },
          },
          right: {
            item_id: "cube",
            asset: {
              kind: "emoji",
              ref: "EMJ-ice-cube",
            },
          },
        },
        {
          pair_id: "pair-3",
          left: {
            item_id: "globe",
            asset: {
              kind: "emoji",
              ref: "EMJ-earth",
            },
          },
          right: {
            item_id: "sphere",
            asset: {
              kind: "emoji",
              ref: "EMJ-white-circle",
            },
          },
        },
        {
          pair_id: "pair-4",
          left: {
            item_id: "drum",
            asset: {
              kind: "emoji",
              ref: "EMJ-drum",
            },
          },
          right: {
            item_id: "cylinder",
            asset: {
              kind: "emoji",
              ref: "EMJ-oil-drum",
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
      code: "GL-C2-PER-MATCH-0103",
      content_version: 2,
      template_code: "GT-005",
      title: "Nhìn ngôi nhà từ phía trước và từ trên cao",
      instruction: "Bé nối đồ vật với hình nhìn từ trên cao nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C2.PER.01"],
      learning_objective_codes: ["LO-C2.PER.01-01"],
      what_tags: ["spt"],
      thinking_tags: ["observe", "infer"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nối đồ vật với hình nhìn từ trên cao nhé!",
      pairs: [
        {
          pair_id: "pair-1",
          left: {
            item_id: "house",
            asset: {
              kind: "emoji",
              ref: "EMJ-house",
            },
          },
          right: {
            item_id: "roof-top",
            asset: {
              kind: "emoji",
              ref: "EMJ-red-triangle-up",
            },
          },
        },
        {
          pair_id: "pair-2",
          left: {
            item_id: "car",
            asset: {
              kind: "emoji",
              ref: "EMJ-car",
            },
          },
          right: {
            item_id: "car-top",
            asset: {
              kind: "emoji",
              ref: "EMJ-oncoming-automobile",
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
      code: "GL-C2-PER-MATCH-0104",
      content_version: 2,
      template_code: "GT-005",
      title: "Góc nhìn từ trên cao của 3 đồ vật",
      instruction: "Bé tìm hình chiếu từ trên xuống của từng đồ vật!",
      age_min: 5,
      age_max: 6,
      difficulty: 4,
      access_tier: "premium",
      skill_codes: ["C2.PER.03"],
      learning_objective_codes: ["LO-C2.PER.03-01"],
      what_tags: ["spt"],
      thinking_tags: ["observe", "infer"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé tìm hình chiếu từ trên xuống của từng đồ vật!",
      pairs: [
        {
          pair_id: "pair-1",
          left: {
            item_id: "cup",
            asset: {
              kind: "emoji",
              ref: "EMJ-milk",
            },
          },
          right: {
            item_id: "cup-top",
            asset: {
              kind: "emoji",
              ref: "EMJ-hollow-circle",
            },
          },
        },
        {
          pair_id: "pair-2",
          left: {
            item_id: "table",
            asset: {
              kind: "emoji",
              ref: "EMJ-chair",
            },
          },
          right: {
            item_id: "table-top",
            asset: {
              kind: "emoji",
              ref: "EMJ-brown-square",
            },
          },
        },
        {
          pair_id: "pair-3",
          left: {
            item_id: "tent",
            asset: {
              kind: "emoji",
              ref: "EMJ-tent",
            },
          },
          right: {
            item_id: "tent-top",
            asset: {
              kind: "emoji",
              ref: "EMJ-red-triangle-up",
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
