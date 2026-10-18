import type { GT037Content, GT037Difficulty } from "./template.js";

interface GT037Fixture {
  readonly id: string;
  readonly name_vi: string;
  readonly content: GT037Content;
  readonly difficulty: GT037Difficulty;
}

export const GT037_FIXTURES: GT037Fixture[] = [
  {
    id: "gt037-f01-minimal-shapes",
    name_vi: "Tìm hình tròn trong các hình học cơ bản (Minimal)",
    content: {
      prompt: "Bé tìm tất cả hình tròn màu đỏ nhé!",
      target_ids: ["circle"],
      item_count: 12,
      target_copies: 3,
      symbols: [
        {
          id: "circle",
          label: "hình tròn",
          asset: { kind: "emoji", ref: "🔴" },
          orientation_free: true,
        },
        {
          id: "square",
          label: "hình vuông",
          asset: { kind: "emoji", ref: "🟦" },
          orientation_free: true,
        },
        {
          id: "triangle",
          label: "hình tam giác",
          asset: { kind: "emoji", ref: "🔺" },
          orientation_free: true,
        },
        {
          id: "star",
          label: "ngôi sao",
          asset: { kind: "emoji", ref: "⭐" },
          orientation_free: true,
        },
      ],
      confusable_ids: [],
    },
    difficulty: {
      item_count: 12,
      target_copies: 3,
      rotation_jitter: false,
      allow_retry: true,
      hint_after_ms: 10_000,
      finish_mode: "auto",
    },
  },
  {
    id: "gt037-f02-confusable-letters",
    name_vi: "Tìm chữ 'b' phân biệt với 'd', 'p', 'q' (Confusables)",
    content: {
      prompt: "Bé tinh mắt tìm tất cả chữ b nhé!",
      target_ids: ["letter_b"],
      item_count: 16,
      target_copies: 4,
      symbols: [
        {
          id: "letter_b",
          label: "chữ b",
          asset: { kind: "text", text: "b" },
          orientation_free: false,
        },
        {
          id: "letter_d",
          label: "chữ d",
          asset: { kind: "text", text: "d" },
          orientation_free: false,
        },
        {
          id: "letter_p",
          label: "chữ p",
          asset: { kind: "text", text: "p" },
          orientation_free: false,
        },
        {
          id: "letter_q",
          label: "chữ q",
          asset: { kind: "text", text: "q" },
          orientation_free: false,
        },
      ],
      confusable_ids: ["letter_d", "letter_p", "letter_q"],
    },
    difficulty: {
      item_count: 16,
      target_copies: 4,
      rotation_jitter: false,
      allow_retry: true,
      hint_after_ms: 10_000,
      finish_mode: "auto",
    },
  },
  {
    id: "gt037-f03-declare-rotational",
    name_vi: "Tìm ký hiệu xoay tự do và bấm Con Xong Rồi (Declare mode)",
    content: {
      prompt: "Bé tìm hết các bạn cá vàng rồi bấm Con xong rồi nhé!",
      target_ids: ["goldfish"],
      item_count: 20,
      target_copies: 5,
      symbols: [
        {
          id: "goldfish",
          label: "cá vàng",
          asset: { kind: "emoji", ref: "🐠" },
          orientation_free: true,
        },
        {
          id: "clownfish",
          label: "cá hề",
          asset: { kind: "emoji", ref: "🐡" },
          orientation_free: true,
        },
        {
          id: "dolphin",
          label: "cá heo",
          asset: { kind: "emoji", ref: "🐬" },
          orientation_free: true,
        },
        {
          id: "turtle",
          label: "rùa biển",
          asset: { kind: "emoji", ref: "🐢" },
          orientation_free: true,
        },
      ],
      confusable_ids: ["clownfish"],
    },
    difficulty: {
      item_count: 20,
      target_copies: 5,
      rotation_jitter: true,
      allow_retry: true,
      hint_after_ms: 12_000,
      finish_mode: "declare",
    },
  },
];
