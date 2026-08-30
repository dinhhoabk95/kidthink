import type { GT027Content, GT027Difficulty } from "./template.js";

export const GT027_FIXTURES: {
  content: GT027Content;
  difficulty: GT027Difficulty;
}[] = [
  {
    content: {
      prompt: "Bé nghe kỹ luật chơi và chọn đúng hình nhé!",
      rules: [
        {
          id: "rule-red",
          name: "Chọn màu đỏ",
          description: "Tìm các hình có màu đỏ",
          dimension: "color",
          target_value: "red",
          signal_text: "Luật 1: Bé hãy chọn tất cả các hình màu đỏ!",
          signal_audio_text: "Chọn hình màu đỏ",
        },
        {
          id: "rule-star",
          name: "Chọn hình sao",
          description: "Đổi luật: Tìm tất cả hình ngôi sao",
          dimension: "shape",
          target_value: "star",
          signal_text: "Đổi luật rồi: Giờ bé hãy chọn hình ngôi sao nhé!",
          signal_audio_text: "Đổi luật, chọn hình ngôi sao",
        },
      ],
      items: [
        {
          id: "it-1",
          asset: { kind: "emoji", ref: "EMJ-red-circle" },
          color: "red",
          shape: "circle",
        },
        {
          id: "it-2",
          asset: { kind: "emoji", ref: "EMJ-red-square" },
          color: "red",
          shape: "square",
        },
        {
          id: "it-3",
          asset: { kind: "emoji", ref: "EMJ-star" },
          color: "yellow",
          shape: "star",
        },
        {
          id: "it-4",
          asset: { kind: "emoji", ref: "EMJ-glowing-star" },
          color: "blue",
          shape: "star",
        },
        {
          id: "it-5",
          asset: { kind: "emoji", ref: "EMJ-green-circle" },
          color: "green",
          shape: "circle",
        },
        {
          id: "it-6",
          asset: { kind: "emoji", ref: "EMJ-blue-square" },
          color: "blue",
          shape: "square",
        },
      ],
      switch_after_trials: 2,
    },
    difficulty: {
      signal_duration_ms: 2000,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Trò chơi đổi luật nhanh mắt nhanh tai!",
      rules: [
        {
          id: "rule-square",
          name: "Chọn hình vuông",
          description: "Tìm các hình vuông",
          dimension: "shape",
          target_value: "square",
          signal_text: "Luật: Tìm tất cả các khối vuông!",
          signal_audio_text: "Chọn hình vuông",
        },
        {
          id: "rule-blue",
          name: "Chọn màu xanh",
          description: "Đổi luật: Tìm các hình màu xanh biển",
          dimension: "color",
          target_value: "blue",
          signal_text: "Luật mới: Chọn tất cả hình màu xanh biển!",
          signal_audio_text: "Đổi luật, chọn màu xanh",
        },
      ],
      items: [
        {
          id: "sq-1",
          asset: { kind: "emoji", ref: "EMJ-orange-square" },
          color: "orange",
          shape: "square",
        },
        {
          id: "sq-2",
          asset: { kind: "emoji", ref: "EMJ-green-square" },
          color: "green",
          shape: "square",
        },
        {
          id: "bl-1",
          asset: { kind: "emoji", ref: "EMJ-blue-circle" },
          color: "blue",
          shape: "circle",
        },
        {
          id: "bl-2",
          asset: { kind: "emoji", ref: "EMJ-blue-diamond" },
          color: "blue",
          shape: "diamond",
        },
        {
          id: "ot-1",
          asset: { kind: "emoji", ref: "EMJ-yellow-circle" },
          color: "yellow",
          shape: "circle",
        },
      ],
      switch_after_trials: 2,
    },
    difficulty: {
      signal_duration_ms: 1800,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Quan sát thật kỹ khi luật thay đổi nhé!",
      rules: [
        {
          id: "rule-circle",
          name: "Chọn hình tròn",
          description: "Tìm các hình tròn",
          dimension: "shape",
          target_value: "circle",
          signal_text: "Luật 1: Hãy chạm vào các hình tròn!",
          signal_audio_text: "Chọn hình tròn",
        },
        {
          id: "rule-yellow",
          name: "Chọn màu vàng",
          description: "Đổi luật: Tìm các hình màu vàng",
          dimension: "color",
          target_value: "yellow",
          signal_text: "Đổi luật: Giờ hãy chọn các hình màu vàng!",
          signal_audio_text: "Đổi luật, chọn màu vàng",
        },
      ],
      items: [
        {
          id: "c-1",
          asset: { kind: "emoji", ref: "EMJ-red-circle" },
          color: "red",
          shape: "circle",
        },
        {
          id: "c-2",
          asset: { kind: "emoji", ref: "EMJ-green-circle" },
          color: "green",
          shape: "circle",
        },
        {
          id: "y-1",
          asset: { kind: "emoji", ref: "EMJ-star" },
          color: "yellow",
          shape: "star",
        },
        {
          id: "y-2",
          asset: { kind: "emoji", ref: "EMJ-cheese" },
          color: "yellow",
          shape: "triangle",
        },
        {
          id: "d-1",
          asset: { kind: "emoji", ref: "EMJ-black-square" },
          color: "black",
          shape: "square",
        },
      ],
      switch_after_trials: 2,
    },
    difficulty: {
      signal_duration_ms: 2000,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
];

export default GT027_FIXTURES;
