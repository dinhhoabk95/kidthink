import type { GT026Content, GT026Difficulty } from "./template.js";

export const GT026_FIXTURES: {
  content: GT026Content;
  difficulty: GT026Difficulty;
}[] = [
  {
    content: {
      prompt:
        "Bé chỉ chạm khi thấy chú thỏ xanh nhé, thấy cáo đỏ thì đứng yên!",
      go_stimulus: {
        label: "Thỏ xanh",
        asset: { kind: "emoji", ref: "🐰" },
      },
      nogo_stimulus: {
        label: "Cáo đỏ",
        asset: { kind: "emoji", ref: "🦊" },
      },
      trials: [
        { id: "tr-1", kind: "go" },
        { id: "tr-2", kind: "go" },
        { id: "tr-3", kind: "nogo" },
        { id: "tr-4", kind: "go" },
        { id: "tr-5", kind: "nogo" },
        { id: "tr-6", kind: "go" },
      ],
    },
    difficulty: {
      stimulus_window_ms: 2000,
      isi_ms: 500,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Chạm vào ngôi sao vàng, gặp đám mây xám thì đừng chạm nhé!",
      go_stimulus: {
        label: "Ngôi sao vàng",
        asset: { kind: "emoji", ref: "⭐" },
      },
      nogo_stimulus: {
        label: "Đám mây xám",
        asset: { kind: "emoji", ref: "☁️" },
      },
      trials: [
        { id: "t1", kind: "go" },
        { id: "t2", kind: "nogo" },
        { id: "t3", kind: "go" },
        { id: "t4", kind: "go" },
        { id: "t5", kind: "nogo" },
      ],
    },
    difficulty: {
      stimulus_window_ms: 1800,
      isi_ms: 400,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt:
        "Thấy quả táo đỏ thì hái (chạm), thấy quả chanh vàng thì giữ tay nhé!",
      go_stimulus: {
        label: "Táo đỏ",
        asset: { kind: "emoji", ref: "🍎" },
      },
      nogo_stimulus: {
        label: "Chanh vàng",
        asset: { kind: "emoji", ref: "🍋" },
      },
      trials: [
        { id: "tr1", kind: "go" },
        { id: "tr2", kind: "go" },
        { id: "tr3", kind: "nogo" },
        { id: "tr4", kind: "go" },
        { id: "tr5", kind: "nogo" },
        { id: "tr6", kind: "go" },
        { id: "tr7", kind: "go" },
      ],
    },
    difficulty: {
      stimulus_window_ms: 1600,
      isi_ms: 500,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
];

export default GT026_FIXTURES;
