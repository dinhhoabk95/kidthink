import type { GT011Content, GT011Difficulty } from "./template.js";

/**
 * Ba level mẫu: WB21 dạng 1 (3×3) · WB15 ma trận 2×2 · biến thể xoay.
 * Sống ở đây, không đi qua `seed-content`, nên không tiêu hạn ngạch competency.
 *
 * Quy luật ở dạng dữ liệu: mỗi hàng và mỗi cột chứa cùng một tập ký hiệu. Biến thể
 * xoay là hoán vị vòng của cùng tập đó, nên nó dùng chung quy luật chứ không cần
 * nhánh riêng.
 */
const emoji = (ref: string) => ({ kind: "emoji" as const, ref });

export const GT011_FIXTURES: {
  content: GT011Content;
  difficulty: GT011Difficulty;
}[] = [
  {
    content: {
      prompt: "Ô trống thiếu hình nào để hàng và cột đủ ba hình?",
      matrix: {
        rows: 3,
        cols: 3,
        cells: [
          { row: 0, col: 0, asset: emoji("🔺") },
          { row: 0, col: 1, asset: emoji("⚫") },
          { row: 0, col: 2, asset: emoji("⭐") },
          { row: 1, col: 0, asset: emoji("⚫") },
          { row: 1, col: 1, asset: emoji("⭐") },
          { row: 1, col: 2, asset: emoji("🔺") },
          { row: 2, col: 0, asset: emoji("⭐") },
          { row: 2, col: 1, asset: emoji("🔺") },
          { row: 2, col: 2, asset: null },
        ],
      },
      options: [
        { option_id: "o1", asset: emoji("⚫"), is_correct: true },
        { option_id: "o2", asset: emoji("⭐"), is_correct: false },
        {
          option_id: "o3",
          asset: emoji("🔺"),
          is_correct: false,
        },
      ],
    },
    difficulty: {
      grid_size: 3,
      distractor_count: 2,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Bé chọn hình cho ô còn trống của bảng hai hàng.",
      matrix: {
        rows: 2,
        cols: 2,
        cells: [
          { row: 0, col: 0, asset: emoji("🍎") },
          { row: 0, col: 1, asset: emoji("🍌") },
          { row: 1, col: 0, asset: emoji("🍌") },
          { row: 1, col: 1, asset: null },
        ],
      },
      options: [
        { option_id: "o1", asset: emoji("🍎"), is_correct: true },
        { option_id: "o2", asset: emoji("🍌"), is_correct: false },
        { option_id: "o3", asset: emoji("🍇"), is_correct: false },
      ],
    },
    difficulty: {
      grid_size: 2,
      distractor_count: 2,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Mũi tên xoay dần. Ô cuối là mũi tên nào?",
      matrix: {
        rows: 3,
        cols: 3,
        cells: [
          { row: 0, col: 0, asset: emoji("⬆️") },
          { row: 0, col: 1, asset: emoji("➡️") },
          { row: 0, col: 2, asset: emoji("⬇️") },
          { row: 1, col: 0, asset: emoji("➡️") },
          { row: 1, col: 1, asset: emoji("⬇️") },
          { row: 1, col: 2, asset: emoji("⬆️") },
          { row: 2, col: 0, asset: emoji("⬇️") },
          { row: 2, col: 1, asset: emoji("⬆️") },
          { row: 2, col: 2, asset: null },
        ],
      },
      options: [
        { option_id: "o1", asset: emoji("➡️"), is_correct: true },
        { option_id: "o2", asset: emoji("⬆️"), is_correct: false },
        { option_id: "o3", asset: emoji("⬇️"), is_correct: false },
        { option_id: "o4", asset: emoji("⬅️"), is_correct: false },
      ],
    },
    difficulty: {
      grid_size: 3,
      distractor_count: 3,
      hint_after_ms: 10_000,
      allow_retry: true,
    },
  },
];

export default GT011_FIXTURES;
