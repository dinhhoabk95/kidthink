import type { ContentSeed } from "#src/seed-content/types";

/**
 * Batch: SEED-MONT-A01
 * Workbook 01: Nhận biết số (Phạm vi 0–10)
 * 3 dạng bài, 6 level, GT-001 và GT-003, band 3-4
 */
export const SEED_MONT_A01: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C1-NREC-CARD-0101",
      content_version: 1,
      template_code: "GT-001",
      title: "Chạm vào số 3",
      instruction: "Bé hãy chạm vào số 3 nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.NREC.01"],
      learning_objective_codes: ["LO-C1.NREC.01-01"],
      what_tags: ["number"],
      thinking_tags: ["observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy chạm vào số 3 nhé!",
      target_item: {
        item_id: "opt-1",
        asset: {
          kind: "emoji",
          ref: "EMJ-three",
        },
      },
      options: [
        {
          item_id: "opt-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-three",
          },
          is_correct: true,
        },
        {
          item_id: "opt-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-eight",
          },
          is_correct: false,
        },
        {
          item_id: "opt-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-five",
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
      code: "GL-C1-NREC-CARD-0102",
      content_version: 1,
      template_code: "GT-001",
      title: "Tìm thẻ số 5",
      instruction: "Bé chọn thẻ số 5 giúp bạn gấu nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.NREC.02"],
      learning_objective_codes: ["LO-C1.NREC.02-01"],
      what_tags: ["number"],
      thinking_tags: ["observe"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chọn thẻ số 5 giúp bạn gấu nhé!",
      target_item: {
        item_id: "opt-2",
        asset: {
          kind: "emoji",
          ref: "EMJ-five",
        },
      },
      options: [
        {
          item_id: "opt-1",
          asset: {
            kind: "emoji",
            ref: "EMJ-two",
          },
          is_correct: false,
        },
        {
          item_id: "opt-2",
          asset: {
            kind: "emoji",
            ref: "EMJ-five",
          },
          is_correct: true,
        },
        {
          item_id: "opt-3",
          asset: {
            kind: "emoji",
            ref: "EMJ-six",
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
      code: "GL-C1-OTO-CARD-0103",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm số chú vịt vàng",
      instruction: "Có mấy chú vịt đang bơi, bé chọn số đúng nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.OTO.01"],
      learning_objective_codes: ["LO-C1.OTO.01-01"],
      what_tags: ["category", "number"],
      thinking_tags: ["count", "match"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Có mấy chú vịt đang bơi, bé chọn số đúng nhé!",
      flash_items: [
        {
          item_id: "d1",
          asset: {
            kind: "emoji",
            ref: "EMJ-duck",
          },
        },
        {
          item_id: "d2",
          asset: {
            kind: "emoji",
            ref: "EMJ-duck",
          },
        },
        {
          item_id: "d3",
          asset: {
            kind: "emoji",
            ref: "EMJ-duck",
          },
        },
      ],
      arrangement: "line",
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
      flash_ms: 3000,
      item_count: 3,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-OTO-CARD-0104",
      content_version: 1,
      template_code: "GT-012",
      title: "Đếm chú thỏ trắng",
      instruction: "Bé hãy đếm xem có bao nhiêu chú thỏ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.OTO.04"],
      learning_objective_codes: ["LO-C1.OTO.04-01"],
      what_tags: ["category", "number"],
      thinking_tags: ["count", "match"],
      theme_tag: "nature",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy đếm xem có bao nhiêu chú thỏ nhé!",
      flash_items: [
        {
          item_id: "r1",
          asset: {
            kind: "emoji",
            ref: "EMJ-rabbit-face",
          },
        },
        {
          item_id: "r2",
          asset: {
            kind: "emoji",
            ref: "EMJ-rabbit-face",
          },
        },
        {
          item_id: "r3",
          asset: {
            kind: "emoji",
            ref: "EMJ-rabbit-face",
          },
        },
        {
          item_id: "r4",
          asset: {
            kind: "emoji",
            ref: "EMJ-rabbit-face",
          },
        },
      ],
      arrangement: "line",
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
      flash_ms: 3000,
      item_count: 4,
      distractor_count: 2,
      allow_replay: true,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C1-CNT-CONT-0105",
      content_version: 2,
      template_code: "GT-003",
      title: "Hái 2 quả táo vào giỏ",
      instruction: "Bé hãy kéo đúng 2 quả táo vào giỏ nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C1.CNT.01"],
      learning_objective_codes: ["LO-C1.CNT.01-01"],
      what_tags: ["category"],
      thinking_tags: ["count", "sort"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy kéo đúng 2 quả táo vào giỏ nhé!",
      container: {
        container_id: "basket",
        label: "Giỏ số 2",
        accepts_attribute: "target",
      },
      items: [
        {
          item_id: "a1",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
          is_correct: true,
        },
        {
          item_id: "a2",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
          },
          is_correct: true,
        },
        {
          item_id: "a3",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-red-apple",
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
      code: "GL-C1-CNT-CONT-0106",
      content_version: 1,
      template_code: "GT-003",
      title: "Thu hoạch 3 củ cà rốt",
      instruction: "Bé hãy thu hoạch 3 củ cà rốt vào sọt nhé!",
      age_min: 3,
      age_max: 4,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C1.CNT.03"],
      learning_objective_codes: ["LO-C1.CNT.03-01"],
      what_tags: ["category"],
      thinking_tags: ["count", "sort"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé hãy thu hoạch 3 củ cà rốt vào sọt nhé!",
      container: {
        container_id: "box",
        label: "Sọt số 3",
        accepts_attribute: "target",
      },
      items: [
        {
          item_id: "c1",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "c2",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "c3",
          attribute: "target",
          asset: {
            kind: "emoji",
            ref: "EMJ-carrot",
          },
          is_correct: true,
        },
        {
          item_id: "c4",
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
];
