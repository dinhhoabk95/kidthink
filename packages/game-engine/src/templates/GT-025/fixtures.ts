import type { GT025Content, GT025Difficulty } from "./template.js";

export const GT025_FIXTURES: {
  content: GT025Content;
  difficulty: GT025Difficulty;
}[] = [
  {
    content: {
      prompt: "Bé tìm 1 điểm khác nhau giữa hai bức tranh nhé.",
      target_count: 1,
      left_objects: [
        {
          id: "left-sun",
          asset: { kind: "emoji", ref: "☀️" },
          x: 100,
          y: 100,
        },
        {
          id: "left-cat",
          asset: { kind: "emoji", ref: "🐱" },
          x: 200,
          y: 300,
        },
        {
          id: "left-tree",
          asset: { kind: "emoji", ref: "🌳" },
          x: 300,
          y: 250,
        },
      ],
      right_objects: [
        {
          id: "right-sun",
          asset: { kind: "emoji", ref: "☀️" },
          x: 100,
          y: 100,
        },
        {
          id: "right-dog",
          asset: { kind: "emoji", ref: "🐶" },
          x: 200,
          y: 300,
        },
        {
          id: "right-tree",
          asset: { kind: "emoji", ref: "🌳" },
          x: 300,
          y: 250,
        },
      ],
      differences: [
        {
          id: "diff-1",
          left_id: "left-cat",
          right_id: "right-dog",
          description: "Mèo và chó",
        },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
      show_counter: true,
    },
  },
  {
    content: {
      prompt: "Bé tìm 2 điểm khác biệt giữa hai khu vườn.",
      target_count: 2,
      left_objects: [
        {
          id: "l-flower-1",
          asset: { kind: "emoji", ref: "🌹" },
          x: 120,
          y: 200,
        },
        {
          id: "l-flower-2",
          asset: { kind: "emoji", ref: "🌻" },
          x: 220,
          y: 200,
        },
        {
          id: "l-bird",
          asset: { kind: "emoji", ref: "🐦" },
          x: 150,
          y: 100,
        },
        {
          id: "l-butterfly",
          asset: { kind: "emoji", ref: "🦋" },
          x: 250,
          y: 100,
        },
      ],
      right_objects: [
        {
          id: "r-flower-1",
          asset: { kind: "emoji", ref: "🌹" },
          x: 120,
          y: 200,
        },
        {
          id: "r-flower-2",
          asset: { kind: "emoji", ref: "🌷" },
          x: 220,
          y: 200,
        },
        {
          id: "r-bird",
          asset: { kind: "emoji", ref: "🐥" },
          x: 150,
          y: 100,
        },
        {
          id: "r-butterfly",
          asset: { kind: "emoji", ref: "🦋" },
          x: 250,
          y: 100,
        },
      ],
      differences: [
        { id: "diff-1", left_id: "l-flower-2", right_id: "r-flower-2" },
        { id: "diff-2", left_id: "l-bird", right_id: "r-bird" },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
      show_counter: true,
    },
  },
  {
    content: {
      prompt: "Bé tìm 3 điểm khác nhau giữa hai căn phòng.",
      target_count: 3,
      left_objects: [
        {
          id: "l-bed",
          asset: { kind: "emoji", ref: "🛏️" },
          x: 100,
          y: 300,
        },
        {
          id: "l-lamp",
          asset: { kind: "emoji", ref: "💡" },
          x: 100,
          y: 120,
        },
        {
          id: "l-clock",
          asset: { kind: "emoji", ref: "⏰" },
          x: 220,
          y: 120,
        },
        {
          id: "l-book",
          asset: { kind: "emoji", ref: "📕" },
          x: 220,
          y: 250,
        },
      ],
      right_objects: [
        {
          id: "r-bed",
          asset: { kind: "emoji", ref: "🛋️" },
          x: 100,
          y: 300,
        },
        {
          id: "r-lamp",
          asset: { kind: "emoji", ref: "💡" },
          x: 100,
          y: 120,
        },
        {
          id: "r-clock",
          asset: { kind: "emoji", ref: "🕰️" },
          x: 220,
          y: 120,
        },
        {
          id: "r-book",
          asset: { kind: "emoji", ref: "📗" },
          x: 220,
          y: 250,
        },
      ],
      differences: [
        { id: "diff-1", left_id: "l-bed", right_id: "r-bed" },
        { id: "diff-2", left_id: "l-clock", right_id: "r-clock" },
        { id: "diff-3", left_id: "l-book", right_id: "r-book" },
      ],
    },
    difficulty: {
      hint_after_ms: 9000,
      allow_retry: true,
      show_counter: true,
    },
  },
];

export default GT025_FIXTURES;
