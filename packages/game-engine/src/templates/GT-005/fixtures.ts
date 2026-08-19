import type { GT005Content, GT005Difficulty } from "./template.js";

export const GT005_FIXTURES: {
  content: GT005Content;
  difficulty: GT005Difficulty;
}[] = [
  {
    content: {
      prompt: "Ghép các con vật với thức ăn yêu thích",
      pairs: [
        {
          pair_id: "pair_1",
          left: {
            item_id: "monkey",
            asset: { kind: "emoji", ref: "🐒" },
          },
          right: {
            item_id: "banana",
            asset: { kind: "emoji", ref: "🍌" },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "rabbit",
            asset: { kind: "emoji", ref: "🐰" },
          },
          right: {
            item_id: "carrot",
            asset: { kind: "emoji", ref: "🥕" },
          },
        },
      ],
    },
    difficulty: {
      hint_after_ms: 6000,
      allow_retry: true,
      shuffle_sides: true,
    },
  },
  {
    content: {
      prompt: "Ghép chữ số với số lượng chấm tròn",
      pairs: [
        {
          pair_id: "pair_1",
          left: {
            item_id: "num_1",
            asset: { kind: "emoji", ref: "1️⃣" },
          },
          right: {
            item_id: "dot_1",
            asset: { kind: "emoji", ref: "🔴" },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "num_2",
            asset: { kind: "emoji", ref: "2️⃣" },
          },
          right: {
            item_id: "dot_2",
            asset: { kind: "emoji", ref: "🍒" },
          },
        },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
      shuffle_sides: false,
    },
  },
  {
    content: {
      prompt: "Ghép màu sắc tương ứng",
      pairs: [
        {
          pair_id: "pair_1",
          left: {
            item_id: "red_heart",
            asset: { kind: "emoji", ref: "❤️" },
          },
          right: {
            item_id: "red_circle",
            asset: { kind: "emoji", ref: "🔴" },
          },
        },
        {
          pair_id: "pair_2",
          left: {
            item_id: "blue_heart",
            asset: { kind: "emoji", ref: "💙" },
          },
          right: {
            item_id: "blue_circle",
            asset: { kind: "emoji", ref: "🔵" },
          },
        },
      ],
    },
    difficulty: {
      hint_after_ms: 7000,
      allow_retry: true,
      shuffle_sides: true,
    },
  },
];
