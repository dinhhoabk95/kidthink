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
      part_count: 2,
      distractor_count: 2,
      hint_after_ms: 6000,
      allow_retry: true,
    },
  },
];
