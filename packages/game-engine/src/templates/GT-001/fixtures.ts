import type {
  GT001Content,
  GT001Difficulty,
} from "../../contracts/templates/gt001";

export const GT001_FIXTURES: {
  content: GT001Content;
  difficulty: GT001Difficulty;
}[] = [
  {
    content: {
      prompt_vi: "Tìm quả táo màu đỏ",
      target_item: {
        item_id: "apple_target",
        asset: { kind: "emoji", ref: "🍎" },
      },
      options: [
        {
          item_id: "apple_opt",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "banana_opt",
          asset: { kind: "emoji", ref: "🍌" },
          is_correct: false,
        },
        {
          item_id: "orange_opt",
          asset: { kind: "emoji", ref: "🍊" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      distractor_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    content: {
      prompt_vi: "Chọn thỏ con đáng yêu",
      target_item: {
        item_id: "rabbit_target",
        asset: { kind: "emoji", ref: "🐰" },
      },
      options: [
        {
          item_id: "bear_opt",
          asset: { kind: "emoji", ref: "🐻" },
          is_correct: false,
        },
        {
          item_id: "rabbit_opt",
          asset: { kind: "emoji", ref: "🐰" },
          is_correct: true,
        },
        {
          item_id: "cat_opt",
          asset: { kind: "emoji", ref: "🐱" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: false,
    },
  },
  {
    content: {
      prompt_vi: "Chọn hình tròn màu đỏ",
      target_item: {
        item_id: "red_circle_target",
        asset: { kind: "emoji", ref: "🔴" },
      },
      options: [
        {
          item_id: "blue_square_opt",
          asset: { kind: "emoji", ref: "🟦" },
          is_correct: false,
        },
        {
          item_id: "yellow_triangle_opt",
          asset: { kind: "emoji", ref: "🔺" },
          is_correct: false,
        },
        {
          item_id: "red_circle_opt",
          asset: { kind: "emoji", ref: "🔴" },
          is_correct: true,
        },
      ],
    },
    difficulty: {
      distractor_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
];
