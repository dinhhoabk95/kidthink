import type { GT010Content, GT010Difficulty } from "./template.js";

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
 * Ba level mẫu cho `GT-010` (BR-TAK-09, BR-MTB-06).
 * Ánh xạ đúng dạng bài nguồn từ Workbook 12 và Workbook 20 (Hệ phương trình hình ảnh).
 * Level mẫu nằm trong fixtures.ts và KHÔNG tiêu hạn ngạch nội dung.
 */
export const SAMPLE_LEVEL_1: GameLevelFixture<GT010Content, GT010Difficulty> = {
  id: "SAMPLE-GT010-01",
  template_code: "GT-010",
  title_vi: "Hệ phương trình trái cây 2 bước",
  age_band: "4-5",
  difficulty: 1,
  access_tier: "free",
  layout: "equation-rows",
  content_pack: {
    prompt: "Bé hãy suy nghĩ xem Quả chuối có giá trị bằng mấy nhé!",
    symbols: [
      { symbol_id: "apple", asset: { kind: "emoji", ref: "EMJ-red-apple" } },
      { symbol_id: "banana", asset: { kind: "emoji", ref: "EMJ-banana" } },
    ],
    // Dòng 1: 🍎 + 🍎 = 10 -> 🍎 = 5
    // Dòng 2: 🍎 + 🍌 = 8  -> 🍌 = 3
    equations: [
      { equation_id: "eq_1", left: ["apple", "apple"], right_value: 10 },
      { equation_id: "eq_2", left: ["apple", "banana"], right_value: 8 },
    ],
    question: { kind: "value", symbol_id: "banana" },
    options: [
      { value: 2, is_correct: false },
      { value: 3, is_correct: true },
      { value: 5, is_correct: false },
      { value: 8, is_correct: false },
    ],
  },
  difficulty_params: {
    equation_count: 2,
    step_count: 2,
    distractor_count: 3,
    hint_after_ms: 8000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_2: GameLevelFixture<GT010Content, GT010Difficulty> = {
  id: "SAMPLE-GT010-02",
  template_code: "GT-010",
  title_vi: "Tính tổng hoa và cỏ may mắn",
  age_band: "5-6",
  difficulty: 2,
  access_tier: "login",
  layout: "equation-rows",
  content_pack: {
    prompt: "Bé hãy tính xem Hoa cộng Cỏ bằng bao nhiêu nhé!",
    symbols: [
      {
        symbol_id: "flower",
        asset: { kind: "emoji", ref: "EMJ-cherry-blossom" },
      },
      {
        symbol_id: "clover",
        asset: { kind: "emoji", ref: "EMJ-four-leaf-clover" },
      },
    ],
    // Dòng 1: 🌸 + 🌸 + 🌸 = 9 -> 🌸 = 3
    // Dòng 2: 🌸 + 🍀 + 🍀 = 11 -> 2 * 🍀 = 8 -> 🍀 = 4
    equations: [
      {
        equation_id: "eq_1",
        left: ["flower", "flower", "flower"],
        right_value: 9,
      },
      {
        equation_id: "eq_2",
        left: ["flower", "clover", "clover"],
        right_value: 11,
      },
    ],
    // Hỏi: 🌸 + 🍀 = 3 + 4 = 7
    question: { kind: "sum", symbol_ids: ["flower", "clover"] },
    options: [
      { value: 6, is_correct: false },
      { value: 7, is_correct: true },
      { value: 8, is_correct: false },
      { value: 9, is_correct: false },
    ],
  },
  difficulty_params: {
    equation_count: 2,
    step_count: 2,
    distractor_count: 3,
    hint_after_ms: 10_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_3: GameLevelFixture<GT010Content, GT010Difficulty> = {
  id: "SAMPLE-GT010-03",
  template_code: "GT-010",
  title_vi: "Hệ ba ẩn muông thú",
  age_band: "5-6",
  difficulty: 3,
  access_tier: "standard",
  layout: "equation-rows",
  content_pack: {
    prompt: "Bé hãy tìm giá trị của Bạn Khỉ thông thái nhé!",
    symbols: [
      { symbol_id: "cat", asset: { kind: "emoji", ref: "EMJ-cat" } },
      { symbol_id: "dog", asset: { kind: "emoji", ref: "EMJ-dog" } },
      { symbol_id: "monkey", asset: { kind: "emoji", ref: "EMJ-monkey" } },
    ],
    // Dòng 1: 🐱 + 🐱 = 4 -> 🐱 = 2
    // Dòng 2: 🐱 + 🐶 = 7 -> 🐶 = 5
    // Dòng 3: 🐶 + 🐵 = 11 -> 🐵 = 6
    equations: [
      { equation_id: "eq_1", left: ["cat", "cat"], right_value: 4 },
      { equation_id: "eq_2", left: ["cat", "dog"], right_value: 7 },
      { equation_id: "eq_3", left: ["dog", "monkey"], right_value: 11 },
    ],
    question: { kind: "value", symbol_id: "monkey" },
    options: [
      { value: 4, is_correct: false },
      { value: 5, is_correct: false },
      { value: 6, is_correct: true },
      { value: 7, is_correct: false },
    ],
  },
  difficulty_params: {
    equation_count: 3,
    step_count: 3,
    distractor_count: 3,
    hint_after_ms: 12_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVELS = [
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
] as const;

export const GT010_FIXTURES = SAMPLE_LEVELS.map((s) => ({
  content: s.content_pack,
  difficulty: s.difficulty_params,
}));
