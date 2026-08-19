import type { GT002Content, GT002Difficulty } from "./template.js";

export const GT002_FIXTURES: {
  content: GT002Content;
  difficulty: GT002Difficulty;
}[] = [
  {
    content: {
      prompt: "Chọn tất cả các loại quả màu đỏ",
      target_criterion: "Màu đỏ",
      items: [
        {
          item_id: "apple",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: true,
        },
        {
          item_id: "strawberry",
          asset: { kind: "emoji", ref: "🍓" },
          is_correct: true,
        },
        {
          item_id: "banana",
          asset: { kind: "emoji", ref: "🍌" },
          is_correct: false,
        },
        {
          item_id: "grape",
          asset: { kind: "emoji", ref: "🍇" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Chọn các con vật nuôi trong nhà",
      target_criterion: "Vật nuôi",
      items: [
        {
          item_id: "dog",
          asset: { kind: "emoji", ref: "🐶" },
          is_correct: true,
        },
        {
          item_id: "cat",
          asset: { kind: "emoji", ref: "🐱" },
          is_correct: true,
        },
        {
          item_id: "lion",
          asset: { kind: "emoji", ref: "🦁" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      distractor_count: 1,
      target_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Chọn các hình có 4 cạnh",
      target_criterion: "4 cạnh",
      items: [
        {
          item_id: "square",
          asset: { kind: "emoji", ref: "⬛" },
          is_correct: true,
        },
        {
          item_id: "rect",
          asset: { kind: "emoji", ref: "🟧" },
          is_correct: true,
        },
        {
          item_id: "triangle",
          asset: { kind: "emoji", ref: "🔺" },
          is_correct: false,
        },
        {
          item_id: "circle",
          asset: { kind: "emoji", ref: "🔴" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      distractor_count: 2,
      target_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
];
