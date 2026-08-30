import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A06
 * Workbook 06: So sánh số lượng (Nhiều hơn / Ít hơn / Bằng nhau)
 * 2 dạng bài, 4 level, GT-001 và GT-003, band 3-4
 */
export const SEED_MONT_A06: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-CMP-CARD-0115",
      montessori_ref: "WB06-D1",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm nhanh số chú cá",
      instruction: "Bé nhìn nhanh xem có mấy chú cá nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CMP.04"],
      learning_objective_codes: ["LO-C1.CMP.04-01"],
      what_tags: ["category"],
      thinking_tags: ["compare", "count"],
      theme_tag: "ocean",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nhìn nhanh xem có mấy chú cá nhé!",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-fish",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-fish",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-fish",
          },
        },
        {
          item_id: "it-4",
          asset: {
            kind: "emoji",
            ref: "EMJ-fish",
          },
        },
      ],
      arrangement: "dice",
      options: [
        {
          value: 3,
          is_correct: false,
        },
        {
          value: 4,
          is_correct: true,
        },
        {
          value: 5,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 2000,
      item_count: 4,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-CARD-0116",
      montessori_ref: "WB06-D1",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm nhanh số bông hoa",
      instruction: "Bé nhìn nhanh xem có mấy bông hoa nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CMP.05"],
      learning_objective_codes: ["LO-C1.CMP.05-01"],
      what_tags: ["category"],
      thinking_tags: ["compare", "count"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé nhìn nhanh xem có mấy bông hoa nhé!",
      flash_items: [
        {
          item_id: "it-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-sunflower",
          },
        },
        {
          item_id: "it-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-sunflower",
          },
        },
        {
          item_id: "it-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-sunflower",
          },
        },
      ],
      arrangement: "dice",
      options: [
        {
          value: 2,
          is_correct: false,
        },
        {
          value: 3,
          is_correct: true,
        },
        {
          value: 4,
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      flash_ms: 2000,
      item_count: 3,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-CONT-0117",
      montessori_ref: "WB06-D2",
      content_version: 1,
      template_code: "GT-003",
      title: "Tặng cà rốt cho thỏ",
      instruction: "Bé kéo đúng 3 củ cà rốt cho 3 bạn thỏ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CMP.04"],
      learning_objective_codes: ["LO-C1.CMP.04-01"],
      what_tags: ["category"],
      thinking_tags: ["compare", "match"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé kéo đúng 3 củ cà rốt cho 3 bạn thỏ nhé!",
      container: {
        container_id: "rabbits",
        label: "Khay 3 bạn thỏ",
        accepts_attribute: "target",
      },
      items: [
        {
          item_id: "cr1",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "cr2",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "cr3",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "cr4",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 3,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CMP-CONT-0118",
      montessori_ref: "WB06-D2",
      content_version: 2,
      template_code: "GT-003",
      title: "Chia đều bóng vào rổ",
      instruction: "Bé kéo 2 bóng vào rổ để hai bên bằng nhau!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CMP.03"],
      learning_objective_codes: ["LO-C1.CMP.03-01"],
      what_tags: ["category"],
      thinking_tags: ["compare", "sort"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé kéo 2 bóng vào rổ để hai bên bằng nhau!",
      container: {
        container_id: "basket-right",
        label: "Rổ cân bằng",
        accepts_attribute: "target",
      },
      items: [
        {
          item_id: "b1",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
          is_correct: true,
        },
        {
          item_id: "b2",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
          is_correct: true,
        },
        {
          item_id: "b3",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-soccer",
          },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 1,
      target_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
];
