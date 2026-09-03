import type { GT031Content, GT031Difficulty } from "./template.js";

export interface GT031Fixture {
  name: string;
  band?: string;
  content: GT031Content;
  difficulty: GT031Difficulty;
}

export const GT031_FIXTURES: GT031Fixture[] = [
  {
    name: "Mua quả táo giá 3 đồng",
    band: "5-6",
    content: {
      prompt: "Bé hãy chọn các đồng xu để trả đúng 3 đồng mua quả táo nhé!",
      target_amount: 3,
      item_to_buy: {
        label: "Quả táo",
        asset: { kind: "emoji", ref: "🍎" },
      },
      coins: [
        {
          coin_id: "c1_1",
          asset: { kind: "emoji", ref: "🪙" },
          value: 1,
        },
        {
          coin_id: "c1_2",
          asset: { kind: "emoji", ref: "🪙" },
          value: 1,
        },
        {
          coin_id: "c2_1",
          asset: { kind: "emoji", ref: "🪙" },
          value: 2,
        },
      ],
    },
    difficulty: {
      coin_kind_count: 2,
      target_amount: 3,
      exact_change: true,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
  {
    name: "Mua cây kem giá 5 đồng",
    band: "5-6",
    content: {
      prompt: "Bé hãy chọn các đồng xu để trả đúng 5 đồng mua cây kem nhé!",
      target_amount: 5,
      item_to_buy: {
        label: "Cây kem",
        asset: { kind: "emoji", ref: "🍦" },
      },
      coins: [
        {
          coin_id: "c1_1",
          asset: { kind: "emoji", ref: "🪙" },
          value: 1,
        },
        {
          coin_id: "c2_1",
          asset: { kind: "emoji", ref: "🪙" },
          value: 2,
        },
        {
          coin_id: "c2_2",
          asset: { kind: "emoji", ref: "🪙" },
          value: 2,
        },
        {
          coin_id: "c5_1",
          asset: { kind: "emoji", ref: "🪙" },
          value: 5,
        },
      ],
    },
    difficulty: {
      coin_kind_count: 3,
      target_amount: 5,
      exact_change: true,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
  {
    name: "Mua ô tô đồ chơi giá 7 đồng",
    band: "5-6",
    content: {
      prompt: "Bé hãy chọn các đồng xu để trả đúng 7 đồng mua ô tô nhé!",
      target_amount: 7,
      item_to_buy: {
        label: "Ô tô",
        asset: { kind: "emoji", ref: "🚗" },
      },
      coins: [
        {
          coin_id: "c1_1",
          asset: { kind: "emoji", ref: "🪙" },
          value: 1,
        },
        {
          coin_id: "c2_1",
          asset: { kind: "emoji", ref: "🪙" },
          value: 2,
        },
        {
          coin_id: "c5_1",
          asset: { kind: "emoji", ref: "🪙" },
          value: 5,
        },
        {
          coin_id: "c2_2",
          asset: { kind: "emoji", ref: "🪙" },
          value: 2,
        },
        {
          coin_id: "c1_2",
          asset: { kind: "emoji", ref: "🪙" },
          value: 1,
        },
      ],
    },
    difficulty: {
      coin_kind_count: 3,
      target_amount: 7,
      exact_change: true,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
];
