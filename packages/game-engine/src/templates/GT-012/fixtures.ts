import type { GT012Content, GT012Difficulty } from "./template.js";

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
 * Ba level mẫu cho `GT-012` (BR-TAK-09, BR-MTB-06).
 * Ánh xạ đúng dạng bài nguồn từ Workbook 04 (Nhận biết nhanh & ghi nhớ chớp mắt).
 * Level mẫu nằm trong fixtures.ts và KHÔNG tiêu hạn ngạch nội dung.
 */
export const SAMPLE_LEVEL_1: GameLevelFixture<GT012Content, GT012Difficulty> = {
  id: "SAMPLE-GT012-01",
  template_code: "GT-012",
  title_vi: "Nhìn chớp xúc xắc 3 chấm",
  age_band: "3-4",
  difficulty: 1,
  access_tier: "free",
  layout: "grid",
  content_pack: {
    prompt: "Bé hãy nhìn thật nhanh xem có mấy chấm tròn nhé!",
    arrangement: "dice",
    flash_items: [
      { item_id: "dot_1", asset: { kind: "emoji", ref: "EMJ-red-circle" } },
      { item_id: "dot_2", asset: { kind: "emoji", ref: "EMJ-red-circle" } },
      { item_id: "dot_3", asset: { kind: "emoji", ref: "EMJ-red-circle" } },
    ],
    options: [
      { value: 2, is_correct: false },
      { value: 3, is_correct: true },
      { value: 4, is_correct: false },
    ],
  },
  difficulty_params: {
    flash_ms: 1500,
    item_count: 3,
    distractor_count: 2,
    allow_replay: true,
    hint_after_ms: 8000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_2: GameLevelFixture<GT012Content, GT012Difficulty> = {
  id: "SAMPLE-GT012-02",
  template_code: "GT-012",
  title_vi: "Ghi nhớ đàn gấu 4 con",
  age_band: "4-5",
  difficulty: 2,
  access_tier: "login",
  layout: "horizontal-row",
  content_pack: {
    prompt: "Vừa có mấy chú gấu xuất hiện vậy bé ơi?",
    arrangement: "line",
    flash_items: [
      { item_id: "bear_1", asset: { kind: "emoji", ref: "EMJ-bear" } },
      { item_id: "bear_2", asset: { kind: "emoji", ref: "EMJ-bear" } },
      { item_id: "bear_3", asset: { kind: "emoji", ref: "EMJ-bear" } },
      { item_id: "bear_4", asset: { kind: "emoji", ref: "EMJ-bear" } },
    ],
    options: [
      { value: 3, is_correct: false },
      { value: 4, is_correct: true },
      { value: 5, is_correct: false },
    ],
  },
  difficulty_params: {
    flash_ms: 1200,
    item_count: 4,
    distractor_count: 2,
    allow_replay: true,
    hint_after_ms: 10_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_3: GameLevelFixture<GT012Content, GT012Difficulty> = {
  id: "SAMPLE-GT012-03",
  template_code: "GT-012",
  title_vi: "Nhìn chớp 5 ngôi sao tam giác",
  age_band: "5-6",
  difficulty: 3,
  access_tier: "standard",
  layout: "grid",
  content_pack: {
    prompt: "Bé đếm xem có bao nhiêu ngôi sao vừa chớp sáng nhé!",
    arrangement: "triangle",
    flash_items: [
      { item_id: "star_1", asset: { kind: "emoji", ref: "EMJ-star" } },
      { item_id: "star_2", asset: { kind: "emoji", ref: "EMJ-star" } },
      { item_id: "star_3", asset: { kind: "emoji", ref: "EMJ-star" } },
      { item_id: "star_4", asset: { kind: "emoji", ref: "EMJ-star" } },
      { item_id: "star_5", asset: { kind: "emoji", ref: "EMJ-star" } },
    ],
    options: [
      { value: 4, is_correct: false },
      { value: 5, is_correct: true },
      { value: 6, is_correct: false },
      { value: 7, is_correct: false },
    ],
  },
  difficulty_params: {
    flash_ms: 1000,
    item_count: 5,
    distractor_count: 3,
    allow_replay: true,
    hint_after_ms: 12_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVELS = [
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
] as const;

export const GT012_FIXTURES = SAMPLE_LEVELS.map((s) => ({
  content: s.content_pack,
  difficulty: s.difficulty_params,
}));
