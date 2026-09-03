import type { GT017Content, GT017Difficulty } from "./template.js";

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
 * Ba level mẫu cho `GT-017` (BR-TAK-09, BR-MTB-06).
 * Ánh xạ đúng dạng bài nguồn từ Workbook 21 (Xếp khối lập phương, Phối cảnh & Khối bị che khuất).
 * Level mẫu nằm trong fixtures.ts và KHÔNG tiêu hạn ngạch nội dung.
 */
export const SAMPLE_LEVEL_1: GameLevelFixture<GT017Content, GT017Difficulty> = {
  id: "SAMPLE-GT017-01",
  template_code: "GT-017",
  title_vi: "Đếm số khối lập phương đơn giản",
  age_band: "5-6",
  difficulty: 1,
  access_tier: "free",
  layout: "grid",
  content_pack: {
    prompt: "Bé hãy đếm xem có tất cả bao nhiêu khối lập phương nhé!",
    question: "count_cubes",
    model: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ],
    options: [
      {
        option_id: "opt_3",
        asset: { kind: "emoji", ref: "3️⃣" },
        is_correct: false,
      },
      {
        option_id: "opt_4",
        asset: { kind: "emoji", ref: "4️⃣" },
        is_correct: true,
      },
      {
        option_id: "opt_5",
        asset: { kind: "emoji", ref: "5️⃣" },
        is_correct: false,
      },
    ],
  },
  difficulty_params: {
    hidden_cube_count: 0,
    allow_rotate: true,
    distractor_count: 2,
    hint_after_ms: 8000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_2: GameLevelFixture<GT017Content, GT017Difficulty> = {
  id: "SAMPLE-GT017-02",
  template_code: "GT-017",
  title_vi: "Hình nhìn từ trên xuống (Top View)",
  age_band: "5-6",
  difficulty: 2,
  access_tier: "login",
  layout: "grid",
  content_pack: {
    prompt: "Nếu nhìn từ trên cao xuống, bé sẽ thấy hình nào sau đây?",
    question: "top_view",
    model: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 }, // Tháp cao 2 tại (0,0)
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
    ],
    options: [
      {
        option_id: "opt_l_shape",
        asset: { kind: "emoji", ref: "🟦" },
        is_correct: true,
      },
      {
        option_id: "opt_line",
        asset: { kind: "emoji", ref: "➖" },
        is_correct: false,
      },
      {
        option_id: "opt_square",
        asset: { kind: "emoji", ref: "⬛" },
        is_correct: false,
      },
    ],
  },
  difficulty_params: {
    hidden_cube_count: 0,
    allow_rotate: true,
    distractor_count: 2,
    hint_after_ms: 10_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_3: GameLevelFixture<GT017Content, GT017Difficulty> = {
  id: "SAMPLE-GT017-03",
  template_code: "GT-017",
  title_vi: "Tìm số khối bị che khuất (Hidden Cubes)",
  age_band: "5-6",
  difficulty: 3,
  access_tier: "standard",
  layout: "grid",
  content_pack: {
    prompt:
      "Bé hãy xoay hình để đếm xem có bao nhiêu khối đang bị che khuất nhé!",
    question: "count_cubes",
    model: [
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 1, y: 0, z: 1 },
      { x: 0, y: 1, z: 1 },
      { x: 1, y: 1, z: 1 },
    ],
    options: [
      {
        option_id: "opt_0",
        asset: { kind: "emoji", ref: "0️⃣" },
        is_correct: false,
      },
      {
        option_id: "opt_1",
        asset: { kind: "emoji", ref: "1️⃣" },
        is_correct: true,
      },
      {
        option_id: "opt_2",
        asset: { kind: "emoji", ref: "2️⃣" },
        is_correct: false,
      },
    ],
  },
  difficulty_params: {
    hidden_cube_count: 1,
    allow_rotate: true,
    distractor_count: 2,
    hint_after_ms: 12_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVELS = [
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
] as const;

export const GT017_FIXTURES = SAMPLE_LEVELS.map((s) => ({
  content: s.content_pack,
  difficulty: s.difficulty_params,
}));
