import type { GT004Content, GT004Difficulty } from "./template.js";

export const GT004_FIXTURES: {
  content: GT004Content;
  difficulty: GT004Difficulty;
}[] = [
  {
    content: {
      prompt: "Phân loại động vật trên cạn và dưới nước",
      groups: [
        {
          group_id: "g1",
          label: "Trên cạn",
          label_emoji: "🌳",
        },
        {
          group_id: "g2",
          label: "Dưới nước",
          label_emoji: "🌊",
        },
      ],
      items: [
        {
          item_id: "cat",
          asset: { kind: "emoji", ref: "🐱" },
          correct_group_id: "g1",
        },
        {
          item_id: "dog",
          asset: { kind: "emoji", ref: "🐶" },
          correct_group_id: "g1",
        },
        {
          item_id: "fish",
          asset: { kind: "emoji", ref: "🐟" },
          correct_group_id: "g2",
        },
        {
          item_id: "whale",
          asset: { kind: "emoji", ref: "🐋" },
          correct_group_id: "g2",
        },
      ],
    },
    difficulty: {
      distractor_count: 0,
      hint_after_ms: 8000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    content: {
      prompt: "Phân loại rau củ và hoa quả",
      groups: [
        {
          group_id: "g1",
          label: "Rau củ",
          label_emoji: "🥕",
        },
        {
          group_id: "g2",
          label: "Hoa quả",
          label_emoji: "🍎",
        },
      ],
      items: [
        {
          item_id: "carrot",
          asset: { kind: "emoji", ref: "🥕" },
          correct_group_id: "g1",
        },
        {
          item_id: "broccoli",
          asset: { kind: "emoji", ref: "🥦" },
          correct_group_id: "g1",
        },
        {
          item_id: "apple",
          asset: { kind: "emoji", ref: "🍎" },
          correct_group_id: "g2",
        },
        {
          item_id: "banana",
          asset: { kind: "emoji", ref: "🍌" },
          correct_group_id: "g2",
        },
      ],
    },
    difficulty: {
      distractor_count: 0,
      hint_after_ms: 10_000,
      allow_retry: true,
      shuffle_items: true,
    },
  },
  {
    content: {
      prompt: "Phân loại phương tiện giao thông",
      groups: [
        {
          group_id: "g1",
          label: "Đường bộ",
          label_emoji: "🚗",
        },
        {
          group_id: "g2",
          label: "Đường hàng không",
          label_emoji: "✈️",
        },
      ],
      items: [
        {
          item_id: "car",
          asset: { kind: "emoji", ref: "🚗" },
          correct_group_id: "g1",
        },
        {
          item_id: "bus",
          asset: { kind: "emoji", ref: "🚌" },
          correct_group_id: "g1",
        },
        {
          item_id: "airplane",
          asset: { kind: "emoji", ref: "✈️" },
          correct_group_id: "g2",
        },
        {
          item_id: "helicopter",
          asset: { kind: "emoji", ref: "🚁" },
          correct_group_id: "g2",
        },
      ],
    },
    difficulty: {
      distractor_count: 0,
      hint_after_ms: 9000,
      allow_retry: true,
      shuffle_items: false,
    },
  },
];
