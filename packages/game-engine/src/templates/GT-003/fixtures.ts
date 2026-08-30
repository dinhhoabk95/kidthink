import type { GT003Content, GT003Difficulty } from "./template.js";

export const GT003_FIXTURES: {
  content: GT003Content;
  difficulty: GT003Difficulty;
}[] = [
  {
    content: {
      prompt: "Kéo rác vào thùng rác",
      container: {
        container_id: "bin_1",
        label: "Thùng rác",
        accepts_attribute: "trash",
      },
      items: [
        {
          item_id: "paper",
          attribute: "trash",
          asset: { kind: "emoji", ref: "EMJ-page" },
          is_correct: true,
        },
        {
          item_id: "apple_core",
          attribute: "trash",
          asset: { kind: "emoji", ref: "EMJ-green-apple" },
          is_correct: true,
        },
        {
          item_id: "book",
          attribute: "study",
          asset: { kind: "emoji", ref: "EMJ-open-book" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      distractor_count: 1,
      target_count: 2,
      hint_after_ms: 6000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Cho đồ chơi vào hộp",
      container: {
        container_id: "toy_box",
        label: "Hộp đồ chơi",
        accepts_attribute: "toy",
      },
      items: [
        {
          item_id: "car",
          attribute: "toy",
          asset: { kind: "emoji", ref: "EMJ-car" },
          is_correct: true,
        },
        {
          item_id: "doll",
          attribute: "toy",
          asset: { kind: "emoji", ref: "EMJ-teddy-bear" },
          is_correct: true,
        },
        {
          item_id: "shoe",
          attribute: "clothing",
          asset: { kind: "emoji", ref: "EMJ-sneaker" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      distractor_count: 1,
      target_count: 2,
      hint_after_ms: 7000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Xếp trái cây vào đĩa",
      container: {
        container_id: "plate",
        label: "Đĩa hoa quả",
        accepts_attribute: "fruit",
      },
      items: [
        {
          item_id: "banana",
          attribute: "fruit",
          asset: { kind: "emoji", ref: "EMJ-banana" },
          is_correct: true,
        },
        {
          item_id: "orange",
          attribute: "fruit",
          asset: { kind: "emoji", ref: "EMJ-orange" },
          is_correct: true,
        },
        {
          item_id: "chair",
          attribute: "furniture",
          asset: { kind: "emoji", ref: "EMJ-chair" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      distractor_count: 1,
      target_count: 2,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
];
