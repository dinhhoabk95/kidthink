import type { GT035Content, GT035Difficulty } from "./template";

export interface GT035Fixture {
  readonly id: string;
  readonly name_vi: string;
  readonly content: GT035Content;
  readonly difficulty: GT035Difficulty;
}

export const GT035_FIXTURES: GT035Fixture[] = [
  {
    id: "gt035-f01-straight-turn",
    name_vi: "Lệnh thẳng và rẽ (3x3)",
    content: {
      prompt: "Bé xếp các lệnh mũi tên để dẫn robot về ngôi sao nhé!",
      grid: { rows: 3, cols: 3 },
      start: { col: 0, row: 0, facing: "right" },
      goal: {
        col: 2,
        row: 2,
        asset: { kind: "emoji", ref: "EMJ-star" },
      },
      obstacles: [],
      collectibles: [],
      allowed_commands: ["forward", "turn_left", "turn_right"],
    },
    difficulty: {
      max_commands: 6,
      obstacle_count: 0,
      collectible_count: 0,
      allow_loop: false,
      allow_retry: true,
      hint_after_ms: 10_000,
    },
  },
  {
    id: "gt035-f02-with-obstacle",
    name_vi: "Tránh vật cản & nhặt quà (4x4)",
    content: {
      prompt: "Bé lập trình robot tránh đá và nhặt viên kim cương về đích nhé!",
      grid: { rows: 4, cols: 4 },
      start: { col: 0, row: 0, facing: "right" },
      goal: {
        col: 3,
        row: 0,
        asset: { kind: "emoji", ref: "EMJ-house" },
      },
      obstacles: [{ col: 2, row: 0 }],
      collectibles: [
        {
          col: 1,
          row: 1,
          id: "gem_1",
          asset: { kind: "emoji", ref: "EMJ-gem" },
        },
      ],
      allowed_commands: ["forward", "turn_left", "turn_right"],
    },
    difficulty: {
      max_commands: 8,
      obstacle_count: 1,
      collectible_count: 1,
      allow_loop: false,
      allow_retry: true,
      hint_after_ms: 10_000,
    },
  },
  {
    id: "gt035-f03-with-loop",
    name_vi: "Dùng lệnh lặp tiến nhanh (4x4)",
    content: {
      prompt: "Bé dùng lệnh lặp để robot đi nhanh hơn về đích nhé!",
      grid: { rows: 4, cols: 4 },
      start: { col: 0, row: 2, facing: "up" },
      goal: {
        col: 2,
        row: 0,
        asset: { kind: "emoji", ref: "EMJ-trophy" },
      },
      obstacles: [{ col: 0, row: 3 }],
      collectibles: [],
      allowed_commands: ["forward", "turn_left", "turn_right", "loop"],
    },
    difficulty: {
      max_commands: 6,
      obstacle_count: 1,
      collectible_count: 0,
      allow_loop: true,
      allow_retry: true,
      hint_after_ms: 10_000,
    },
  },
];
