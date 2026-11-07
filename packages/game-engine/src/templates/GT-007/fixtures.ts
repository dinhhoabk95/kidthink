import type { GT007Content, GT007Difficulty } from "./template.js";

export const GT007_FIXTURES: {
  content: GT007Content;
  difficulty: GT007Difficulty;
}[] = [
  {
    content: {
      prompt: "Tách số 5 thành 3 và mấy?",
      whole: { id: "w5", value: 5, label: "5" },
      parts: [
        { id: "p1", value: 3, is_target: false, label: "3" },
        { id: "p2", value: 2, is_target: true, label: "?" },
      ],
      options: [
        { id: "o1", value: 1, is_correct: false },
        { id: "o2", value: 2, is_correct: true },
        { id: "o3", value: 4, is_correct: false },
      ],
    },
    difficulty: {
      item_count: 5,
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 6000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Tách số 10 thành 6 và mấy?",
      whole: { id: "w10", value: 10, label: "10" },
      parts: [
        { id: "p1", value: 6, is_target: false, label: "6" },
        { id: "p2", value: 4, is_target: true, label: "?" },
      ],
      options: [
        { id: "o1", value: 3, is_correct: false },
        { id: "o2", value: 4, is_correct: true },
        { id: "o3", value: 5, is_correct: false },
      ],
    },
    difficulty: {
      item_count: 6,
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 7000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Tách số 4 thành 1 và mấy?",
      whole: { id: "w4", value: 4, label: "4" },
      parts: [
        { id: "p1", value: 1, is_target: false, label: "1" },
        { id: "p2", value: 3, is_target: true, label: "?" },
      ],
      options: [
        { id: "o1", value: 2, is_correct: false },
        { id: "o2", value: 3, is_correct: true },
        { id: "o3", value: 4, is_correct: false },
      ],
    },
    difficulty: {
      item_count: 4,
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 6000,
      allow_retry: true,
    },
  },
  // Vật thật (`BR-E007-06`): một khay đã cho 3 kẹo, kéo nốt 2 kẹo sang khay trống.
  {
    content: {
      prompt: "Chia 5 viên kẹo cho hai bạn nhé!",
      whole: {
        id: "w5c",
        value: 5,
        asset: { kind: "emoji", ref: "🍬" },
      },
      parts: [
        { id: "p1", value: 3, is_target: false },
        { id: "p2", value: 2, is_target: true },
      ],
      options: [
        { id: "o1", value: 2, is_correct: true },
        { id: "o2", value: 4, is_correct: false },
      ],
      representation: "discrete-object",
    },
    difficulty: {
      item_count: 5,
      part_count: 2,
      distractor_count: 1,
      hint_after_ms: 6000,
      allow_retry: true,
    },
  },
  // Vật thật, mọi khay khuyết: mọi cách chia 4 kẹo đều thắng (`BR-E007-06`).
  {
    content: {
      prompt: "Chia 4 viên kẹo cho hai bạn, chia sao cũng được!",
      whole: {
        id: "w4c",
        value: 4,
        asset: { kind: "emoji", ref: "🍬" },
      },
      parts: [
        { id: "p1", value: 2, is_target: true },
        { id: "p2", value: 2, is_target: true },
      ],
      options: [
        { id: "o1", value: 2, is_correct: true },
        { id: "o2", value: 1, is_correct: true },
      ],
      representation: "discrete-object",
    },
    difficulty: {
      item_count: 4,
      part_count: 2,
      distractor_count: 1,
      hint_after_ms: 6000,
      allow_retry: true,
    },
  },
];
