import type { GT029Content, GT029Difficulty } from "./template";

export interface GT029Fixture {
  name: string;
  content: GT029Content;
  difficulty: GT029Difficulty;
}

export const GT029_FIXTURES: GT029Fixture[] = [
  {
    name: "Bớt 2 quả táo trong nhóm 5 quả",
    content: {
      prompt: "Bé hãy bớt 2 quả táo ra khỏi rổ rồi xem còn lại mấy quả nhé!",
      initial_items: [
        { item_id: "apple_1", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
        { item_id: "apple_2", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
        { item_id: "apple_3", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
        { item_id: "apple_4", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
        { item_id: "apple_5", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
      ],
      remove_count: 2,
      answer_options: [
        { option_id: "opt_2", value: 2, is_correct: false },
        { option_id: "opt_3", value: 3, is_correct: true },
        { option_id: "opt_4", value: 4, is_correct: false },
      ],
    },
    difficulty: {
      initial_count: 5,
      remove_count: 2,
      allow_retry: true,
      hint_after_ms: 8000,
      shuffle_items: false,
    },
  },
  {
    name: "Bớt 3 chú cá bơi trong đàn 7 chú cá",
    content: {
      prompt: "Bé hãy bớt 3 chú cá ra nhé, hỏi còn lại mấy chú cá?",
      initial_items: [
        {
          item_id: "fish_1",
          asset: { kind: "emoji", ref: "EMJ-tropical-fish" },
        },
        {
          item_id: "fish_2",
          asset: { kind: "emoji", ref: "EMJ-tropical-fish" },
        },
        {
          item_id: "fish_3",
          asset: { kind: "emoji", ref: "EMJ-tropical-fish" },
        },
        {
          item_id: "fish_4",
          asset: { kind: "emoji", ref: "EMJ-tropical-fish" },
        },
        {
          item_id: "fish_5",
          asset: { kind: "emoji", ref: "EMJ-tropical-fish" },
        },
        {
          item_id: "fish_6",
          asset: { kind: "emoji", ref: "EMJ-tropical-fish" },
        },
        {
          item_id: "fish_7",
          asset: { kind: "emoji", ref: "EMJ-tropical-fish" },
        },
      ],
      remove_count: 3,
      answer_options: [
        { option_id: "opt_3", value: 3, is_correct: false },
        { option_id: "opt_4", value: 4, is_correct: true },
        { option_id: "opt_5", value: 5, is_correct: false },
      ],
    },
    difficulty: {
      initial_count: 7,
      remove_count: 3,
      allow_retry: true,
      hint_after_ms: 8000,
      shuffle_items: true,
    },
  },
  {
    name: "Bớt 4 ngôi sao trong nhóm 8 ngôi sao",
    content: {
      prompt:
        "Bé hãy bớt 4 ngôi sao ra rồi đếm xem còn lại bao nhiêu ngôi sao nhé!",
      initial_items: [
        { item_id: "star_1", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_2", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_3", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_4", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_5", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_6", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_7", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_8", asset: { kind: "emoji", ref: "EMJ-star" } },
      ],
      remove_count: 4,
      answer_options: [
        { option_id: "opt_2", value: 2, is_correct: false },
        { option_id: "opt_4", value: 4, is_correct: true },
        { option_id: "opt_6", value: 6, is_correct: false },
        { option_id: "opt_8", value: 8, is_correct: false },
      ],
    },
    difficulty: {
      initial_count: 8,
      remove_count: 4,
      allow_retry: true,
      hint_after_ms: 8000,
      shuffle_items: true,
    },
  },
];
