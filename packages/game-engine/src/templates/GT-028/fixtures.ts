import type { GT028Content, GT028Difficulty } from "./template.js";

export const GT028_FIXTURES: {
  content: GT028Content;
  difficulty: GT028Difficulty;
}[] = [
  // Fixture 1: Đếm nhảy cóc 2 (bước 2, chạm 4 lần để được 8)
  {
    content: {
      prompt: "Bé hãy chạm từng quả táo để đếm nhảy cóc 2 cho đủ 8 nhé!",
      step: 2,
      target_total: 8,
      items: [
        { item_id: "apple_1", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
        { item_id: "apple_2", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
        { item_id: "apple_3", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
        { item_id: "apple_4", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
        { item_id: "apple_5", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
        { item_id: "apple_6", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
      ],
    },
    difficulty: {
      step: 2,
      item_count: 6,
      allow_undo: true,
      hint_after_ms: 8000,
      shuffle_items: true,
    },
  },
  // Fixture 2: Đếm nhảy cóc 5 (bước 5, chạm 4 lần để được 20)
  {
    content: {
      prompt: "Bé hãy chạm các ngôi sao để đếm nhảy cóc 5 cho đủ 20 nhé!",
      step: 5,
      target_total: 20,
      items: [
        { item_id: "star_1", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_2", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_3", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_4", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_5", asset: { kind: "emoji", ref: "EMJ-star" } },
        { item_id: "star_6", asset: { kind: "emoji", ref: "EMJ-star" } },
      ],
    },
    difficulty: {
      step: 5,
      item_count: 6,
      allow_undo: true,
      hint_after_ms: 8000,
      shuffle_items: true,
    },
  },
  // Fixture 3: Đếm nhảy cóc 10 (bước 10, chạm 5 lần để được 50)
  {
    content: {
      prompt: "Bé hãy chạm các bông hoa để đếm nhảy cóc 10 cho đủ 50 nhé!",
      step: 10,
      target_total: 50,
      items: [
        { item_id: "flower_1", asset: { kind: "emoji", ref: "EMJ-sunflower" } },
        { item_id: "flower_2", asset: { kind: "emoji", ref: "EMJ-sunflower" } },
        { item_id: "flower_3", asset: { kind: "emoji", ref: "EMJ-sunflower" } },
        { item_id: "flower_4", asset: { kind: "emoji", ref: "EMJ-sunflower" } },
        { item_id: "flower_5", asset: { kind: "emoji", ref: "EMJ-sunflower" } },
        { item_id: "flower_6", asset: { kind: "emoji", ref: "EMJ-sunflower" } },
        { item_id: "flower_7", asset: { kind: "emoji", ref: "EMJ-sunflower" } },
        { item_id: "flower_8", asset: { kind: "emoji", ref: "EMJ-sunflower" } },
      ],
    },
    difficulty: {
      step: 10,
      item_count: 8,
      allow_undo: true,
      hint_after_ms: 10_000,
      shuffle_items: true,
    },
  },
];

export default GT028_FIXTURES;
