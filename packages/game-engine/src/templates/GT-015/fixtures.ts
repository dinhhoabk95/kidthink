import type { GT015Content, GT015Difficulty } from "./template.js";

export interface GameLevelFixture<TContent, TDifficulty> {
  id?: string;
  template_code?: string;
  title_vi?: string;
  age_band?: string;
  difficulty?: number;
  access_tier?: string;
  layout?: string;
  content_pack: TContent;
  difficulty_params: TDifficulty;
}

/**
 * Ba level mẫu cho `GT-015` (BR-TAK-09, BR-MTB-06).
 * Ánh xạ đúng dạng bài nguồn từ Workbook 17 (Sudoku mini 2×2, 3×3, 4×4).
 * Level mẫu nằm trong fixtures.ts và KHÔNG tiêu hạn ngạch nội dung.
 */
export const SAMPLE_LEVEL_1: GameLevelFixture<GT015Content, GT015Difficulty> = {
  id: "SAMPLE-GT015-01",
  template_code: "GT-015",
  title_vi: "Sudoku mini 2x2 Động vật",
  age_band: "4-5",
  difficulty: 1,
  access_tier: "free",
  layout: "grid",
  content_pack: {
    prompt:
      "Bé hãy xếp các bạn động vật sao cho mỗi hàng và cột không bị trùng nhé!",
    grid_size: 2,
    regions: "row_col",
    symbols: [
      { symbol_id: "cat", asset: { kind: "emoji", ref: "EMJ-cat" } },
      { symbol_id: "dog", asset: { kind: "emoji", ref: "EMJ-dog" } },
    ],
    cells: [
      { row: 0, col: 0, symbol_id: "cat" },
      { row: 0, col: 1, symbol_id: null },
      { row: 1, col: 0, symbol_id: null },
      { row: 1, col: 1, symbol_id: "cat" },
    ],
  },
  difficulty_params: {
    blank_count: 2,
    hint_after_ms: 8000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_2: GameLevelFixture<GT015Content, GT015Difficulty> = {
  id: "SAMPLE-GT015-02",
  template_code: "GT-015",
  title_vi: "Sudoku mini 3x3 Trái cây",
  age_band: "5-6",
  difficulty: 2,
  access_tier: "login",
  layout: "grid",
  content_pack: {
    prompt:
      "Bé hãy điền các loại quả vào ô trống sao cho mỗi hàng và cột đều đủ 3 loại quả!",
    grid_size: 3,
    regions: "row_col",
    symbols: [
      { symbol_id: "apple", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
      { symbol_id: "banana", asset: { kind: "emoji", ref: "EMJ-banana" } },
      { symbol_id: "grapes", asset: { kind: "emoji", ref: "EMJ-grapes" } },
    ],
    cells: [
      { row: 0, col: 0, symbol_id: "apple" },
      { row: 0, col: 1, symbol_id: "banana" },
      { row: 0, col: 2, symbol_id: null }, // grapes
      { row: 1, col: 0, symbol_id: "banana" },
      { row: 1, col: 1, symbol_id: null }, // grapes
      { row: 1, col: 2, symbol_id: "apple" },
      { row: 2, col: 0, symbol_id: null }, // grapes
      { row: 2, col: 1, symbol_id: "apple" },
      { row: 2, col: 2, symbol_id: "banana" },
    ],
  },
  difficulty_params: {
    blank_count: 3,
    hint_after_ms: 10_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_3: GameLevelFixture<GT015Content, GT015Difficulty> = {
  id: "SAMPLE-GT015-03",
  template_code: "GT-015",
  title_vi: "Sudoku mini 4x4 Hình học có khối 2x2",
  age_band: "5-6",
  difficulty: 3,
  access_tier: "standard",
  layout: "grid",
  content_pack: {
    prompt: "Bé xếp các hình sao cho hàng, cột và ô 2x2 không bị trùng nhé!",
    grid_size: 4,
    regions: "row_col_box",
    symbols: [
      { symbol_id: "circle", asset: { kind: "emoji", ref: "EMJ-red-circle" } },
      { symbol_id: "square", asset: { kind: "emoji", ref: "EMJ-blue-square" } },
      {
        symbol_id: "triangle",
        asset: { kind: "emoji", ref: "EMJ-red-triangle-up" },
      },
      { symbol_id: "star", asset: { kind: "emoji", ref: "EMJ-star" } },
    ],
    cells: [
      { row: 0, col: 0, symbol_id: "circle" },
      { row: 0, col: 1, symbol_id: "square" },
      { row: 0, col: 2, symbol_id: "triangle" },
      { row: 0, col: 3, symbol_id: null }, // star

      { row: 1, col: 0, symbol_id: "triangle" },
      { row: 1, col: 1, symbol_id: null }, // star
      { row: 1, col: 2, symbol_id: "circle" },
      { row: 1, col: 3, symbol_id: "square" },

      { row: 2, col: 0, symbol_id: "square" },
      { row: 2, col: 1, symbol_id: "circle" },
      { row: 2, col: 2, symbol_id: "star" },
      { row: 2, col: 3, symbol_id: null }, // triangle

      { row: 3, col: 0, symbol_id: null }, // star
      { row: 3, col: 1, symbol_id: "triangle" },
      { row: 3, col: 2, symbol_id: "square" },
      { row: 3, col: 3, symbol_id: "circle" },
    ],
  },
  difficulty_params: {
    blank_count: 4,
    hint_after_ms: 12_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVELS = [
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
] as const;

export const GT015_FIXTURES = SAMPLE_LEVELS.map((s) => ({
  content: s.content_pack,
  difficulty: s.difficulty_params,
}));
