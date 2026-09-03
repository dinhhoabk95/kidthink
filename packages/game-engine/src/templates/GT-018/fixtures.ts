import type { GT018Content, GT018Difficulty } from "./template.js";

export const GT018_FIXTURES: {
  content: GT018Content;
  difficulty: GT018Difficulty;
}[] = [
  // Level 1: C5-01 — Nghe từ ngữ chọn đối tượng tương ứng
  {
    content: {
      prompt: "Bé hãy nghe và chọn hình con mèo nhé!",
      audio_prompt: {
        text: "Con mèo",
      },
      response_mode: "select",
      options: [
        {
          item_id: "cat",
          asset: { kind: "emoji", ref: "🐱" },
          is_correct: true,
        },
        {
          item_id: "dog",
          asset: { kind: "emoji", ref: "🐶" },
          is_correct: false,
        },
        {
          item_id: "bird",
          asset: { kind: "emoji", ref: "🐦" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
  // Level 2: C3-08 — Nghe chỉ dẫn chọn đối tượng theo quy luật
  {
    content: {
      prompt: "Bé hãy nghe quy luật và chọn quả tiếp theo nhé!",
      audio_prompt: {
        text: "Táo đỏ, chuối vàng, táo đỏ, tiếp theo là quả gì?",
      },
      response_mode: "select",
      options: [
        {
          item_id: "banana",
          asset: { kind: "emoji", ref: "🍌" },
          is_correct: true,
        },
        {
          item_id: "apple",
          asset: { kind: "emoji", ref: "🍎" },
          is_correct: false,
        },
        {
          item_id: "grape",
          asset: { kind: "emoji", ref: "🍇" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      hint_after_ms: 8000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
  // Level 3: C3-04 — Nghe chỉ dẫn sắp xếp theo thứ tự
  {
    content: {
      prompt:
        "Bé hãy nghe và sắp xếp các con vật theo đúng thứ tự từ nhỏ đến lớn nhé!",
      audio_prompt: {
        text: "Sắp xếp theo thứ tự: kiến, thỏ, voi",
      },
      response_mode: "sequence",
      target_sequence: ["ant", "rabbit", "elephant"],
      options: [
        {
          item_id: "rabbit",
          asset: { kind: "emoji", ref: "🐰" },
          is_correct: false,
        },
        {
          item_id: "ant",
          asset: { kind: "emoji", ref: "🐜" },
          is_correct: false,
        },
        {
          item_id: "elephant",
          asset: { kind: "emoji", ref: "🐘" },
          is_correct: false,
        },
      ],
    },
    difficulty: {
      hint_after_ms: 10_000,
      allow_retry: true,
      auto_play_audio: true,
    },
  },
];
