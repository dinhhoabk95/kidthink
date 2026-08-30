import type { GT024Content, GT024Difficulty } from "./template.js";

export const GT024_FIXTURES: {
  content: GT024Content;
  difficulty: GT024Difficulty;
}[] = [
  // Level 1: C2-08 — Vẽ theo nét hình tam giác (3 điểm nối vòng về đỉnh)
  {
    content: {
      prompt: "Bé hãy nối các điểm theo thứ tự 1-2-3 để vẽ hình tam giác nhé!",
      shape_name: "Hình tam giác",
      guide_asset: { kind: "emoji", ref: "EMJ-red-triangle-up" },
      waypoints: [
        { id: "wp-top", x: 480, y: 150, order: 0, label: "1" },
        { id: "wp-right", x: 650, y: 380, order: 1, label: "2" },
        { id: "wp-left", x: 310, y: 380, order: 2, label: "3" },
        { id: "wp-top-close", x: 480, y: 150, order: 3, label: "1" },
      ],
    },
    difficulty: {
      tolerance_px: 50,
      show_numbered_dots: true,
      show_guide_lines: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 2: C2-08 — Vẽ theo nét hình vuông (4 điểm)
  {
    content: {
      prompt: "Bé hãy nối 4 điểm theo thứ tự để tạo thành hình vuông nhé!",
      shape_name: "Hình vuông",
      guide_asset: { kind: "emoji", ref: "EMJ-blue-square" },
      waypoints: [
        { id: "wp-tl", x: 340, y: 180, order: 0, label: "1" },
        { id: "wp-tr", x: 620, y: 180, order: 1, label: "2" },
        { id: "wp-br", x: 620, y: 420, order: 2, label: "3" },
        { id: "wp-bl", x: 340, y: 420, order: 3, label: "4" },
        { id: "wp-tl-close", x: 340, y: 180, order: 4, label: "1" },
      ],
    },
    difficulty: {
      tolerance_px: 50,
      show_numbered_dots: true,
      show_guide_lines: true,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  // Level 3: C2-08 — Nối điểm ngôi sao 5 cánh
  {
    content: {
      prompt:
        "Bé hãy nối các điểm theo thứ tự từ 1 đến 5 để vẽ ngôi sao sáng nhé!",
      shape_name: "Ngôi sao",
      guide_asset: { kind: "emoji", ref: "EMJ-star" },
      waypoints: [
        { id: "wp-1", x: 480, y: 120, order: 0, label: "1" },
        { id: "wp-2", x: 530, y: 270, order: 1, label: "2" },
        { id: "wp-3", x: 680, y: 270, order: 2, label: "3" },
        { id: "wp-4", x: 560, y: 360, order: 3, label: "4" },
        { id: "wp-5", x: 600, y: 490, order: 4, label: "5" },
        { id: "wp-6", x: 480, y: 410, order: 5, label: "6" },
        { id: "wp-7", x: 360, y: 490, order: 6, label: "7" },
        { id: "wp-8", x: 400, y: 360, order: 7, label: "8" },
        { id: "wp-9", x: 280, y: 270, order: 8, label: "9" },
        { id: "wp-10", x: 430, y: 270, order: 9, label: "10" },
        { id: "wp-11", x: 480, y: 120, order: 10, label: "1" },
      ],
    },
    difficulty: {
      tolerance_px: 45,
      show_numbered_dots: true,
      show_guide_lines: true,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
];
