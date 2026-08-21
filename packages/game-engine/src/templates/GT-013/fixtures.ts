import type { GT013Content, GT013Difficulty } from "./template.js";

/**
 * Ba level mẫu ánh xạ tới ba dạng bài của workbook 09:
 * `WB09-D1` mê cung đường đơn · `WB09-D2` ngã ba có bẫy · `WB09-D3` thu thập vật phẩm.
 *
 * Chúng sống ở đây, **không** đi qua `seed-content`, nên không tiêu hạn ngạch
 * competency (mục 3 của plan T99).
 *
 * Tường khai một phía là đủ — `mazeSystem` coi tường đối xứng, nên
 * `{ row: 0, col: 0, side: "e" }` chặn cả chiều ngược lại.
 */
export const GT013_FIXTURES: {
  content: GT013Content;
  difficulty: GT013Difficulty;
}[] = [
  {
    content: {
      prompt: "Bé đưa bạn thỏ theo lối duy nhất về tới cà rốt nhé.",
      grid: {
        rows: 3,
        cols: 3,
        walls: [
          { row: 0, col: 0, side: "e" },
          { row: 1, col: 0, side: "e" },
          { row: 2, col: 1, side: "n" },
          { row: 2, col: 2, side: "n" },
        ],
        start: { row: 0, col: 0 },
        goal: { row: 2, col: 2 },
      },
      required_cells: [],
      input_mode: "draw",
    },
    difficulty: {
      dead_end_count: 0,
      required_cell_count: 0,
      hint_after_ms: 8000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Có hai lối rẽ. Bé chọn lối dẫn tới ngôi nhà.",
      grid: {
        rows: 3,
        cols: 3,
        walls: [
          { row: 0, col: 0, side: "s" },
          { row: 0, col: 2, side: "s" },
          { row: 1, col: 0, side: "e" },
          { row: 1, col: 1, side: "e" },
          { row: 2, col: 0, side: "e" },
          { row: 2, col: 1, side: "e" },
          { row: 1, col: 0, side: "s" },
          { row: 1, col: 2, side: "s" },
        ],
        start: { row: 0, col: 0 },
        goal: { row: 0, col: 2 },
      },
      required_cells: [],
      input_mode: "draw",
    },
    difficulty: {
      dead_end_count: 1,
      required_cell_count: 0,
      hint_after_ms: 9000,
      allow_retry: true,
    },
  },
  {
    content: {
      prompt: "Bé nhặt đủ hai quả trên đường rồi mới ra cổng nhé.",
      grid: {
        rows: 4,
        cols: 4,
        walls: [
          { row: 1, col: 0, side: "e" },
          { row: 1, col: 1, side: "e" },
          { row: 0, col: 0, side: "s" },
          { row: 0, col: 3, side: "s" },
          { row: 1, col: 2, side: "s" },
          { row: 1, col: 3, side: "s" },
          { row: 2, col: 0, side: "s" },
          { row: 2, col: 1, side: "s" },
          { row: 2, col: 3, side: "s" },
        ],
        start: { row: 0, col: 0 },
        goal: { row: 3, col: 3 },
      },
      required_cells: [
        { row: 1, col: 1 },
        { row: 2, col: 2 },
      ],
      input_mode: "arrows",
    },
    difficulty: {
      dead_end_count: 5,
      required_cell_count: 2,
      hint_after_ms: 12_000,
      allow_retry: true,
    },
  },
];

export default GT013_FIXTURES;
