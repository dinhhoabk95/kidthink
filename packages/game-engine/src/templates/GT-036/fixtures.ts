import type { GT036Content, GT036Difficulty } from "./template.js";

export interface GT036Fixture {
  readonly id: string;
  readonly name_vi: string;
  readonly content: GT036Content;
  readonly difficulty: GT036Difficulty;
}

export const GT036_FIXTURES: GT036Fixture[] = [
  {
    id: "gt036-f01-relaxed-2elem",
    name_vi: "Tự tạo quy luật 2 phần tử (Relaxed)",
    content: {
      prompt: "Bé tự xếp một quy luật lặp lại bằng ngôi sao và mặt trăng nhé!",
      palette: [
        { id: "star", asset: { kind: "emoji", ref: "⭐" } },
        { id: "moon", asset: { kind: "emoji", ref: "🌙" } },
      ],
      track_length: 6,
      min_repetitions: 3,
    },
    difficulty: {
      palette_size: 2,
      track_length: 6,
      min_repetitions: 3,
      strictness: "relaxed",
      allow_retry: true,
      hint_after_ms: 10_000,
    },
  },
  {
    id: "gt036-f02-nature-3elem",
    name_vi: "Tự tạo quy luật hoa quả thiên nhiên (3 phần tử)",
    content: {
      prompt: "Bé chọn hoa, cây, nấm và tự tạo quy luật riêng nhé!",
      palette: [
        { id: "flower", asset: { kind: "emoji", ref: "🌸" } },
        { id: "tree", asset: { kind: "emoji", ref: "🌳" } },
        { id: "mushroom", asset: { kind: "emoji", ref: "🍄" } },
      ],
      track_length: 8,
      min_repetitions: 2,
    },
    difficulty: {
      palette_size: 3,
      track_length: 8,
      min_repetitions: 2,
      strictness: "relaxed",
      allow_retry: true,
      hint_after_ms: 10_000,
    },
  },
  {
    id: "gt036-f03-strict-complex",
    name_vi: "Tự tạo quy luật chặt chẽ (Strict Mode)",
    content: {
      prompt:
        "Bé xếp dải ô hoàn chỉnh theo đúng quy luật không thừa thiếu nhé!",
      palette: [
        {
          id: "red_heart",
          asset: { kind: "emoji", ref: "💖" },
        },
        { id: "blue_heart", asset: { kind: "emoji", ref: "🔵" } },
      ],
      track_length: 8,
      min_repetitions: 2,
    },
    difficulty: {
      palette_size: 2,
      track_length: 8,
      min_repetitions: 2,
      strictness: "strict",
      allow_retry: true,
      hint_after_ms: 10_000,
    },
  },
];

export const GT036Fixtures = GT036_FIXTURES;
