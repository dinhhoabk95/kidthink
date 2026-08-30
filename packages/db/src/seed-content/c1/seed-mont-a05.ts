import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A05
 * Workbook 05: Thử tài đếm nhanh - Điền đúng (Tập hợp con)
 * 2 dạng bài, 4 level, GT-002 và GT-003, band 3-4
 */
export const SEED_MONT_A05: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-CNT-PAIR-0111",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép nhóm hoa với thẻ số",
      instruction: "Bé đếm số bông hoa rồi ghép với số đúng nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["category", "number"],
      thinking_tags: ["count", "match"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé đếm số bông hoa rồi ghép với số đúng nhé!",
      pairs: [
        {
          pair_id: "pair-1",
          left: {
            item_id: "f1",
            asset: {
              kind: "emoji",
              ref: "EMJ-star",
            },
          },
          right: {
            item_id: "num1",
            asset: {
              kind: "emoji",
              ref: "EMJ-one",
            },
          },
        },
        {
          pair_id: "pair-2",
          left: {
            item_id: "f2",
            asset: {
              kind: "emoji",
              ref: "EMJ-star",
            },
          },
          right: {
            item_id: "num2",
            asset: {
              kind: "emoji",
              ref: "EMJ-two",
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
      code: "GL-C1-CNT-PAIR-0112",
      content_version: 1,
      template_code: "GT-005",
      title: "Ghép nhóm lá xanh với số",
      instruction: "Bé đếm số chiếc lá và nối với số tương ứng nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["category", "number"],
      thinking_tags: ["count", "match"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé đếm số chiếc lá và nối với số tương ứng nhé!",
      pairs: [
        {
          pair_id: "pair-1",
          left: {
            item_id: "l1",
            asset: {
              kind: "emoji",
              ref: "EMJ-star",
            },
          },
          right: {
            item_id: "num2",
            asset: {
              kind: "emoji",
              ref: "EMJ-two",
            },
          },
        },
        {
          pair_id: "pair-2",
          left: {
            item_id: "l2",
            asset: {
              kind: "emoji",
              ref: "EMJ-star",
            },
          },
          right: {
            item_id: "num3",
            asset: {
              kind: "emoji",
              ref: "EMJ-three",
            },
          },
        },
        {
          pair_id: "pair-3",
          left: {
            item_id: "l3",
            asset: {
              kind: "emoji",
              ref: "EMJ-star",
            },
          },
          right: {
            item_id: "num4",
            asset: {
              kind: "emoji",
              ref: "EMJ-four",
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
      code: "GL-C1-CNT-CONT-0113",
      content_version: 1,
      template_code: "GT-003",
      title: "Kéo gà con vào chuồng",
      instruction: "Bé hãy kéo 2 chú gà con vào chuồng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["category"],
      thinking_tags: ["count", "sort"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy kéo 2 chú gà con vào chuồng nhé!",
      container: {
        container_id: "coop",
        label: "Chuồng 2 gà",
        accepts_attribute: "target",
      },
      items: [
        {
          item_id: "ch1",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-front-facing-baby-chick",
          },
          is_correct: true,
        },
        {
          item_id: "ch2",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-front-facing-baby-chick",
          },
          is_correct: true,
        },
        {
          item_id: "ch3",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-front-facing-baby-chick",
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
  {
    header: {
      code: "GL-C1-CNT-CONT-0114",
      content_version: 1,
      template_code: "GT-003",
      title: "Đếm nấm gom vào rổ",
      instruction: "Bé hãy gom đúng 3 cây nấm bỏ vào rổ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["category"],
      thinking_tags: ["count", "sort"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy gom đúng 3 cây nấm bỏ vào rổ nhé!",
      container: {
        container_id: "basket",
        label: "Rổ 3 nấm",
        accepts_attribute: "target",
      },
      items: [
        {
          item_id: "m1",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-mushroom",
          },
          is_correct: true,
        },
        {
          item_id: "m2",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-mushroom",
          },
          is_correct: true,
        },
        {
          item_id: "m3",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-mushroom",
          },
          is_correct: true,
        },
        {
          item_id: "m4",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-mushroom",
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
];
