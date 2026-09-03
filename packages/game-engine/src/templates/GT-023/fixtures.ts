import type { GT023Content, GT023Difficulty } from "./template.js";

export const GT023_FIXTURES: {
  content: GT023Content;
  difficulty: GT023Difficulty;
}[] = [
  // Level 1: C2-02 — Lắp ráp ngôi nhà từ 2 hình cơ bản (mái tam giác + thân vuông)
  {
    content: {
      prompt: "Bé hãy ghép mái nhà và thân nhà để tạo thành ngôi nhà nhé!",
      target_model: {
        name: "Ngôi nhà",
        asset: { kind: "emoji", ref: "🏠" },
      },
      anchors: [
        {
          anchor_id: "anchor-roof",
          x: 480,
          y: 180,
          accepted_part_id: "part-roof",
          label: "Mái nhà",
        },
        {
          anchor_id: "anchor-wall",
          x: 480,
          y: 320,
          accepted_part_id: "part-wall",
          label: "Thân nhà",
        },
      ],
      parts: [
        {
          part_id: "part-roof",
          target_anchor_id: "anchor-roof",
          asset: { kind: "emoji", ref: "🔺" },
          name: "Mái tam giác",
        },
        {
          part_id: "part-wall",
          target_anchor_id: "anchor-wall",
          asset: { kind: "emoji", ref: "🟦" },
          name: "Tường vuông",
        },
      ],
    },
    difficulty: {
      snap_radius_px: 60,
      show_anchor_outline: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 2: C2-02 — Lắp ráp xe ô tô từ 3 bộ phận (thân xe + 2 bánh)
  {
    content: {
      prompt: "Bé hãy lắp 2 bánh xe vào thân xe ô tô nhé!",
      target_model: {
        name: "Xe ô tô",
        asset: { kind: "emoji", ref: "🚗" },
      },
      anchors: [
        {
          anchor_id: "anchor-chassis",
          x: 480,
          y: 240,
          accepted_part_id: "part-chassis",
          label: "Khung xe",
        },
        {
          anchor_id: "anchor-wheel-left",
          x: 400,
          y: 340,
          accepted_part_id: "part-wheel-1",
          label: "Bánh trước",
        },
        {
          anchor_id: "anchor-wheel-right",
          x: 560,
          y: 340,
          accepted_part_id: "part-wheel-2",
          label: "Bánh sau",
        },
      ],
      parts: [
        {
          part_id: "part-chassis",
          target_anchor_id: "anchor-chassis",
          asset: { kind: "emoji", ref: "🚙" },
          name: "Thân xe",
        },
        {
          part_id: "part-wheel-1",
          target_anchor_id: "anchor-wheel-left",
          asset: { kind: "emoji", ref: "⚫" },
          name: "Bánh xe 1",
        },
        {
          part_id: "part-wheel-2",
          target_anchor_id: "anchor-wheel-right",
          asset: { kind: "emoji", ref: "⚫" },
          name: "Bánh xe 2",
        },
      ],
    },
    difficulty: {
      snap_radius_px: 60,
      show_anchor_outline: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 3: C2-07 — Lắp ráp người tuyết từ 3 khối cầu xếp chồng
  {
    content: {
      prompt: "Bé hãy xếp các khối cầu để tạo thành người tuyết nhé!",
      target_model: {
        name: "Người tuyết",
        asset: { kind: "emoji", ref: "⛄" },
      },
      anchors: [
        {
          anchor_id: "anchor-head",
          x: 480,
          y: 160,
          accepted_part_id: "part-head",
          label: "Đầu",
        },
        {
          anchor_id: "anchor-torso",
          x: 480,
          y: 280,
          accepted_part_id: "part-torso",
          label: "Thân",
        },
        {
          anchor_id: "anchor-base",
          x: 480,
          y: 400,
          accepted_part_id: "part-base",
          label: "Đế",
        },
      ],
      parts: [
        {
          part_id: "part-head",
          target_anchor_id: "anchor-head",
          asset: { kind: "emoji", ref: "⚪" },
          name: "Khối nhỏ",
        },
        {
          part_id: "part-torso",
          target_anchor_id: "anchor-torso",
          asset: { kind: "emoji", ref: "⚪" },
          name: "Khối vừa",
        },
        {
          part_id: "part-base",
          target_anchor_id: "anchor-base",
          asset: { kind: "emoji", ref: "⚪" },
          name: "Khối lớn",
        },
      ],
    },
    difficulty: {
      snap_radius_px: 70,
      show_anchor_outline: true,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
];
