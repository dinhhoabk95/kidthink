import type { GT016Content, GT016Difficulty } from "./template.js";

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
 * Ba level mẫu cho `GT-016` (BR-TAK-09, BR-MTB-06).
 * Ánh xạ đúng dạng bài nguồn từ Workbook 18 (Xem đồng hồ & Khái niệm thời gian).
 * Level mẫu nằm trong fixtures.ts và KHÔNG tiêu hạn ngạch nội dung.
 */
export const SAMPLE_LEVEL_1: GameLevelFixture<GT016Content, GT016Difficulty> = {
  id: "SAMPLE-GT016-01",
  template_code: "GT-016",
  title_vi: "Đọc đồng hồ giờ đúng",
  age_band: "5-6",
  difficulty: 1,
  access_tier: "free",
  layout: "grid",
  content_pack: {
    prompt: "Đồng hồ đang chỉ mấy giờ vậy bé ơi?",
    mode: "read",
    target_time: { hour: 8, minute: 0 },
    options: [
      { hour: 7, minute: 0, is_correct: false },
      { hour: 8, minute: 0, is_correct: true },
      { hour: 9, minute: 0, is_correct: false },
    ],
    activity_cards: [],
  },
  difficulty_params: {
    minute_step: 60,
    distractor_count: 2,
    hint_after_ms: 8000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_2: GameLevelFixture<GT016Content, GT016Difficulty> = {
  id: "SAMPLE-GT016-02",
  template_code: "GT-016",
  title_vi: "Xoay kim đặt 4 giờ rưỡi chiều",
  age_band: "5-6",
  difficulty: 2,
  access_tier: "login",
  layout: "grid",
  content_pack: {
    prompt: "Bé hãy xoay kim đồng hồ về đúng 4 giờ 30 phút nhé!",
    mode: "set",
    target_time: { hour: 4, minute: 30 },
    initial_time: { hour: 12, minute: 0 },
    options: [],
    activity_cards: [],
  },
  difficulty_params: {
    minute_step: 30,
    distractor_count: 1,
    hint_after_ms: 10_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_3: GameLevelFixture<GT016Content, GT016Difficulty> = {
  id: "SAMPLE-GT016-03",
  template_code: "GT-016",
  title_vi: "Ghép giờ sinh hoạt trong ngày",
  age_band: "5-6",
  difficulty: 3,
  access_tier: "standard",
  layout: "grid",
  content_pack: {
    prompt: "Bé hãy nối giờ trên đồng hồ với hoạt động tương ứng nhé!",
    mode: "match",
    target_time: { hour: 7, minute: 0 },
    options: [],
    activity_cards: [
      {
        card_id: "breakfast",
        asset: { kind: "emoji", ref: "🍳" },
        hour: 7,
        minute: 0,
      },
      {
        card_id: "sleep",
        asset: { kind: "emoji", ref: "🛏️" },
        hour: 9,
        minute: 0,
      },
    ],
  },
  difficulty_params: {
    minute_step: 60,
    distractor_count: 1,
    hint_after_ms: 12_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVELS = [
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
] as const;

export const GT016_FIXTURES = SAMPLE_LEVELS.map((s) => ({
  content: s.content_pack,
  difficulty: s.difficulty_params,
}));
