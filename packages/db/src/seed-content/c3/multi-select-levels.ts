import type { ContentSeed } from "#src/seed-content/types";

/**
 * Ba level cho engine `GT-002` — "Chọn nhiều đáp án".
 *
 * Trước task 162, `GT-002` mang 27 level nhưng **không level nào parse được**
 * `content_contract`: chúng viết theo khuôn `{containers, drag_items}` của thế
 * hệ template cũ, tức là 27 trò chơi không dựng được. Codemod chuyển chúng
 * sang `GT-003`/`GT-004` theo cơ chế thật (kéo vào đích / phân nhóm), và
 * `GT-002` còn 0 — sàn `BR-ECD-01` đòi 3.
 *
 * Ba level dưới đây soạn đúng cơ chế của engine: một tiêu chí, nhiều vật, trẻ
 * chạm **mọi** vật hợp tiêu chí. Band 4-5 và 5-6 vì `GT-002` cấm band 3-4.
 */
export const C3_MULTI_SELECT_LEVELS: ContentSeed<unknown, unknown>[] = [
  {
    header: {
      code: "GL-C3-CLS-MULTI-0201",
      content_version: 1,
      template_code: "GT-002",
      title: "Chọn tất cả quả màu đỏ",
      instruction: "Bé chạm vào tất cả những quả màu đỏ nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 1,
      access_tier: "free",
      skill_codes: ["C3.CLS.01"],
      learning_objective_codes: ["LO-C3.CLS.01-01"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "food",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chạm vào tất cả những quả màu đỏ nhé!",
      target_criterion: "Quả màu đỏ",
      items: [
        {
          item_id: "apple",
          asset: { kind: "emoji", ref: "EMJ-red-apple" },
          is_correct: true,
        },
        {
          item_id: "strawberry",
          asset: { kind: "emoji", ref: "EMJ-strawberry" },
          is_correct: true,
        },
        {
          item_id: "banana",
          asset: { kind: "emoji", ref: "EMJ-banana" },
          is_correct: false,
        },
        {
          item_id: "lemon",
          asset: { kind: "emoji", ref: "EMJ-lemon" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-CLS-MULTI-0202",
      content_version: 1,
      template_code: "GT-002",
      title: "Chọn tất cả con vật nuôi trong nhà",
      instruction: "Bé chạm vào tất cả những con vật nuôi trong nhà nhé!",
      age_min: 4,
      age_max: 5,
      difficulty: 2,
      access_tier: "login",
      skill_codes: ["C3.CLS.04"],
      learning_objective_codes: ["LO-C3.CLS.04-01"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "farm",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chạm vào tất cả những con vật nuôi trong nhà nhé!",
      target_criterion: "Con vật nuôi trong nhà",
      items: [
        {
          item_id: "dog",
          asset: { kind: "emoji", ref: "EMJ-dog" },
          is_correct: true,
        },
        {
          item_id: "cat",
          asset: { kind: "emoji", ref: "EMJ-cat" },
          is_correct: true,
        },
        {
          item_id: "fish",
          asset: { kind: "emoji", ref: "EMJ-fish" },
          is_correct: false,
        },
        {
          item_id: "car",
          asset: { kind: "emoji", ref: "EMJ-car" },
          is_correct: false,
        },
        {
          item_id: "bus",
          asset: { kind: "emoji", ref: "EMJ-bus" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 3,
      target_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    header: {
      code: "GL-C3-CLS-MULTI-0203",
      content_version: 1,
      template_code: "GT-002",
      title: "Chọn tất cả hình tròn",
      instruction: "Bé chạm vào tất cả những hình tròn nhé!",
      age_min: 5,
      age_max: 6,
      difficulty: 3,
      access_tier: "standard",
      skill_codes: ["C3.CLS.02"],
      learning_objective_codes: ["LO-C3.CLS.02-01"],
      what_tags: ["cls"],
      thinking_tags: ["sort"],
      theme_tag: "school",
      origin: "human",
      authored_in: "repo_seed",
    },
    content_pack: {
      prompt: "Bé chạm vào tất cả những hình tròn nhé!",
      target_criterion: "Hình tròn",
      items: [
        {
          item_id: "red-circle",
          asset: { kind: "emoji", ref: "EMJ-red-circle" },
          is_correct: true,
        },
        {
          item_id: "blue-circle",
          asset: { kind: "emoji", ref: "EMJ-blue-circle" },
          is_correct: true,
        },
        {
          item_id: "green-circle",
          asset: { kind: "emoji", ref: "EMJ-green-circle" },
          is_correct: true,
        },
        {
          item_id: "red-square",
          asset: { kind: "emoji", ref: "EMJ-red-square" },
          is_correct: false,
        },
        {
          item_id: "blue-square",
          asset: { kind: "emoji", ref: "EMJ-blue-square" },
          is_correct: false,
        },
        {
          item_id: "star",
          asset: { kind: "emoji", ref: "EMJ-star" },
          is_correct: false,
        },
      ],
    },
    difficulty_params: {
      distractor_count: 3,
      target_count: 3,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
];
