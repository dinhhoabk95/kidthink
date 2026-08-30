import type { GT021Content, GT021Difficulty } from "./template.js";

export const GT021_FIXTURES: {
  content: GT021Content;
  difficulty: GT021Difficulty;
}[] = [
  // Level 1: C2-03 — Đối xứng trục dọc 1 ô (cánh bướm)
  {
    content: {
      prompt:
        "Bé hãy hoàn thiện cánh bướm bên phải cho giống cánh bên trái nhé!",
      axis: "vertical",
      reference_pattern: [
        {
          slot_id: "left-wing",
          asset: { kind: "emoji", ref: "EMJ-butterfly" },
        },
      ],
      target_slots: [
        {
          slot_id: "right-wing",
          expected_asset_ref: "butterfly-wing",
        },
      ],
      options: [
        {
          item_id: "opt-wing",
          asset: { kind: "emoji", ref: "EMJ-butterfly" },
          asset_ref: "butterfly-wing",
        },
        {
          item_id: "opt-flower",
          asset: { kind: "emoji", ref: "EMJ-cherry-blossom" },
          asset_ref: "flower",
        },
      ],
    },
    difficulty: {
      show_axis_guide: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 2: C2-03 — Đối xứng trục dọc 2 màu đối xứng
  {
    content: {
      prompt: "Bé hãy xếp các khối màu bên phải đối xứng với bên trái nhé!",
      axis: "vertical",
      reference_pattern: [
        {
          slot_id: "top-left",
          asset: { kind: "emoji", ref: "EMJ-red-circle" },
        },
        {
          slot_id: "bottom-left",
          asset: { kind: "emoji", ref: "EMJ-blue-square" },
        },
      ],
      target_slots: [
        {
          slot_id: "top-right",
          expected_asset_ref: "red-circle",
        },
        {
          slot_id: "bottom-right",
          expected_asset_ref: "blue-square",
        },
      ],
      options: [
        {
          item_id: "opt-red",
          asset: { kind: "emoji", ref: "EMJ-red-circle" },
          asset_ref: "red-circle",
        },
        {
          item_id: "opt-blue",
          asset: { kind: "emoji", ref: "EMJ-blue-square" },
          asset_ref: "blue-square",
        },
        {
          item_id: "opt-yellow",
          asset: { kind: "emoji", ref: "EMJ-star" },
          asset_ref: "yellow-star",
        },
      ],
    },
    difficulty: {
      show_axis_guide: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 3: C2-03 — Đối xứng trục ngang (phản chiếu mặt nước)
  {
    content: {
      prompt: "Bé hãy đặt bóng phản chiếu trên mặt nước bên dưới nhé!",
      axis: "horizontal",
      reference_pattern: [
        {
          slot_id: "boat",
          asset: { kind: "emoji", ref: "EMJ-sailboat" },
        },
      ],
      target_slots: [
        {
          slot_id: "boat-reflection",
          expected_asset_ref: "boat-ref",
        },
      ],
      options: [
        {
          item_id: "opt-boat",
          asset: { kind: "emoji", ref: "EMJ-sailboat" },
          asset_ref: "boat-ref",
        },
        {
          item_id: "opt-fish",
          asset: { kind: "emoji", ref: "EMJ-fish" },
          asset_ref: "fish",
        },
      ],
    },
    difficulty: {
      show_axis_guide: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
];
