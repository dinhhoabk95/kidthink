import type { GT020Content, GT020Difficulty } from "./template.js";

export const GT020_FIXTURES: {
  content: GT020Content;
  difficulty: GT020Difficulty;
}[] = [
  // Level 1: C6-03 — 2 cặp (4 thẻ), band 3-4
  {
    content: {
      prompt: "Bé hãy lật thẻ và tìm các cặp con vật giống nhau nhé!",
      pairs: [
        {
          pair_key: "cat",
          card_a: {
            card_id: "cat-1",
            asset: { kind: "emoji", ref: "🐱" },
          },
          card_b: {
            card_id: "cat-2",
            asset: { kind: "emoji", ref: "🐱" },
          },
        },
        {
          pair_key: "dog",
          card_a: {
            card_id: "dog-1",
            asset: { kind: "emoji", ref: "🐶" },
          },
          card_b: {
            card_id: "dog-2",
            asset: { kind: "emoji", ref: "🐶" },
          },
        },
      ],
    },
    difficulty: {
      flip_back_delay_ms: 1500,
      peek_all_initial_ms: 2000,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 2: C6-03 — 3 cặp (6 thẻ), band 4-5
  {
    content: {
      prompt: "Bé hãy lật thẻ và tìm các cặp trái cây giống nhau nhé!",
      pairs: [
        {
          pair_key: "apple",
          card_a: {
            card_id: "apple-1",
            asset: { kind: "emoji", ref: "🍎" },
          },
          card_b: {
            card_id: "apple-2",
            asset: { kind: "emoji", ref: "🍎" },
          },
        },
        {
          pair_key: "banana",
          card_a: {
            card_id: "banana-1",
            asset: { kind: "emoji", ref: "🍌" },
          },
          card_b: {
            card_id: "banana-2",
            asset: { kind: "emoji", ref: "🍌" },
          },
        },
        {
          pair_key: "grape",
          card_a: {
            card_id: "grape-1",
            asset: { kind: "emoji", ref: "🍇" },
          },
          card_b: {
            card_id: "grape-2",
            asset: { kind: "emoji", ref: "🍇" },
          },
        },
      ],
    },
    difficulty: {
      flip_back_delay_ms: 1200,
      peek_all_initial_ms: 1000,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 3: C6-03 — 4 cặp (8 thẻ), band 5-6
  {
    content: {
      prompt: "Bé hãy lật thẻ và tìm các cặp hình hình học giống nhau nhé!",
      pairs: [
        {
          pair_key: "circle",
          card_a: {
            card_id: "circle-1",
            asset: { kind: "emoji", ref: "🔴" },
          },
          card_b: {
            card_id: "circle-2",
            asset: { kind: "emoji", ref: "🔴" },
          },
        },
        {
          pair_key: "square",
          card_a: {
            card_id: "square-1",
            asset: { kind: "emoji", ref: "🟦" },
          },
          card_b: {
            card_id: "square-2",
            asset: { kind: "emoji", ref: "🟦" },
          },
        },
        {
          pair_key: "star",
          card_a: {
            card_id: "star-1",
            asset: { kind: "emoji", ref: "⭐" },
          },
          card_b: {
            card_id: "star-2",
            asset: { kind: "emoji", ref: "⭐" },
          },
        },
        {
          pair_key: "heart",
          card_a: {
            card_id: "heart-1",
            asset: { kind: "emoji", ref: "💛" },
          },
          card_b: {
            card_id: "heart-2",
            asset: { kind: "emoji", ref: "💛" },
          },
        },
      ],
    },
    difficulty: {
      flip_back_delay_ms: 1000,
      peek_all_initial_ms: 0,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
];
