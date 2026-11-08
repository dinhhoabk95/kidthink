import type { GT035Content, GT035Difficulty } from "./template";

interface GT035Fixture {
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
        asset: { kind: "emoji", ref: "⭐" },
      },
      obstacles: [],
      collectibles: [],
      allowed_commands: ["forward", "turn_left", "turn_right"],
    },
    difficulty: {
      item_count: 2,
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
    name_vi: "Tránh vật cản & nhặt quà (4x3)",
    content: {
      prompt: "Bé lập trình robot tránh đá và nhặt viên kim cương về đích nhé!",
      grid: { rows: 3, cols: 4 },
      start: { col: 0, row: 0, facing: "right" },
      goal: {
        col: 3,
        row: 0,
        asset: { kind: "emoji", ref: "🏠" },
      },
      obstacles: [{ col: 2, row: 0 }],
      collectibles: [
        {
          col: 1,
          row: 1,
          id: "gem_1",
          asset: { kind: "emoji", ref: "💎" },
        },
      ],
      allowed_commands: ["forward", "turn_left", "turn_right"],
    },
    difficulty: {
      item_count: 3,
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
    name_vi: "Dùng lệnh lặp tiến nhanh (4x3)",
    content: {
      prompt: "Bé dùng lệnh lặp để robot đi nhanh hơn về đích nhé!",
      grid: { rows: 3, cols: 4 },
      start: { col: 0, row: 2, facing: "up" },
      goal: {
        col: 2,
        row: 0,
        asset: { kind: "emoji", ref: "🏆" },
      },
      obstacles: [{ col: 3, row: 2 }],
      collectibles: [],
      allowed_commands: ["forward", "turn_left", "turn_right", "loop"],
    },
    difficulty: {
      item_count: 2,
      max_commands: 6,
      obstacle_count: 1,
      collectible_count: 0,
      allow_loop: true,
      allow_retry: true,
      hint_after_ms: 10_000,
    },
  },
  {
    id: "gt035-f04-absolute-arrows",
    name_vi: "Mũi tên lên xuống trái phải (3x3)",
    content: {
      prompt: "Bé bấm mũi tên để robot đi về ngôi sao nhé!",
      grid: { rows: 3, cols: 3 },
      start: { col: 0, row: 0, facing: "down" },
      goal: {
        col: 2,
        row: 2,
        asset: { kind: "emoji", ref: "⭐" },
      },
      obstacles: [],
      collectibles: [],
      allowed_commands: ["go_up", "go_right", "go_down", "go_left"],
    },
    difficulty: {
      item_count: 2,
      max_commands: 5,
      obstacle_count: 0,
      collectible_count: 0,
      allow_loop: false,
      allow_retry: true,
      hint_after_ms: 10_000,
    },
  },
  {
    id: "gt035-f05-absolute-gem",
    name_vi: "Mũi tên tránh đá, nhặt kim cương (4x3)",
    content: {
      prompt: "Bé bấm mũi tên cho robot nhặt kim cương rồi về nhà nhé!",
      grid: { rows: 3, cols: 4 },
      start: { col: 0, row: 0, facing: "up" },
      goal: {
        col: 3,
        row: 1,
        asset: { kind: "emoji", ref: "🏠" },
      },
      obstacles: [{ col: 2, row: 1 }],
      collectibles: [
        {
          col: 1,
          row: 1,
          id: "gem_1",
          asset: { kind: "emoji", ref: "💎" },
        },
      ],
      allowed_commands: ["go_up", "go_right", "go_down", "go_left"],
    },
    difficulty: {
      item_count: 3,
      max_commands: 8,
      obstacle_count: 1,
      collectible_count: 1,
      allow_loop: false,
      allow_retry: true,
      hint_after_ms: 10_000,
    },
  },
];
