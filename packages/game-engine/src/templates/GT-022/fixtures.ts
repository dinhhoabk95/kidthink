import type { GT022Content, GT022Difficulty } from "./template.js";

export const GT022_FIXTURES: {
  content: GT022Content;
  difficulty: GT022Difficulty;
}[] = [
  // Level 1: C4-01 — Tìm chú bướm trốn trong vườn hoa (1 target, 2 distractors)
  {
    content: {
      prompt: "Bé hãy tìm chú bướm đang trốn trong vườn hoa nhé!",
      target_description: "Chú bướm xinh xắn",
      scene_objects: [
        {
          id: "target-butterfly",
          asset: { kind: "emoji", ref: "EMJ-butterfly" },
          is_target: true,
          is_hidden: false,
          x: 250,
          y: 200,
        },
        {
          id: "distractor-flower1",
          asset: { kind: "emoji", ref: "EMJ-cherry-blossom" },
          is_target: false,
          is_hidden: false,
          x: 150,
          y: 300,
        },
        {
          id: "distractor-flower2",
          asset: { kind: "emoji", ref: "EMJ-sunflower" },
          is_target: false,
          is_hidden: false,
          x: 450,
          y: 250,
        },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
      show_target_counter: true,
    },
  },
  // Level 2: C4-01 — Tìm 2 chú cá vàng trốn dưới đáy biển
  {
    content: {
      prompt: "Bé hãy tìm đủ 2 chú cá vàng dưới đáy biển nhé!",
      target_description: "2 chú cá vàng",
      scene_objects: [
        {
          id: "fish-1",
          asset: { kind: "emoji", ref: "EMJ-tropical-fish" },
          is_target: true,
          is_hidden: false,
          x: 200,
          y: 180,
        },
        {
          id: "fish-2",
          asset: { kind: "emoji", ref: "EMJ-tropical-fish" },
          is_target: true,
          is_hidden: false,
          x: 600,
          y: 320,
        },
        {
          id: "seaweed",
          asset: { kind: "emoji", ref: "EMJ-herb" },
          is_target: false,
          is_hidden: false,
          x: 400,
          y: 280,
        },
        {
          id: "rock",
          asset: { kind: "emoji", ref: "EMJ-rock" },
          is_target: false,
          is_hidden: false,
          x: 300,
          y: 400,
        },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
      show_target_counter: true,
    },
  },
  // Level 3: C4-03 — Tìm đối tượng ẩn sau bụi cây (revealed before found)
  {
    content: {
      prompt: "Bé hãy chạm vào bụi cây để tìm chú thỏ con trốn sau đó nhé!",
      target_description: "Chú thỏ trắng",
      scene_objects: [
        {
          id: "target-rabbit",
          asset: { kind: "emoji", ref: "EMJ-rabbit-face" },
          is_target: true,
          is_hidden: true,
          x: 350,
          y: 220,
        },
        {
          id: "bush",
          asset: { kind: "emoji", ref: "EMJ-deciduous-tree" },
          is_target: false,
          is_hidden: false,
          x: 350,
          y: 220,
        },
        {
          id: "distractor-bird",
          asset: { kind: "emoji", ref: "EMJ-bird" },
          is_target: false,
          is_hidden: false,
          x: 650,
          y: 150,
        },
      ],
    },
    difficulty: {
      hint_after_ms: 10_000,
      allow_retry: true,
      show_target_counter: true,
    },
  },
];
