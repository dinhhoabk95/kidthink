import type { GT014Content, GT014Difficulty } from "./template.js";

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
 * Ba level mẫu cho `GT-014` (BR-TAK-09, BR-MTB-06).
 * Ánh xạ đúng dạng bài nguồn từ Workbook 16 (Bài toán Cân thăng bằng & So sánh khối lượng).
 * Level mẫu nằm trong fixtures.ts và KHÔNG tiêu hạn ngạch nội dung.
 */
export const SAMPLE_LEVEL_1: GameLevelFixture<GT014Content, GT014Difficulty> = {
  id: "SAMPLE-GT014-01",
  template_code: "GT-014",
  title_vi: "So sánh nặng nhẹ giữa Dưa hấu và Táo",
  age_band: "5-6",
  difficulty: 1,
  access_tier: "free",
  layout: "split-columns",
  content_pack: {
    prompt: "Bé hãy chạm vào đĩa cân của loại quả NẶNG HƠN nhé!",
    goal: "pick_heavier",
    left_pan: [
      { item_id: "watermelon", asset: { kind: "emoji", ref: "🍉" }, weight: 5 },
    ],
    right_pan: [
      { item_id: "apple", asset: { kind: "emoji", ref: "🍎" }, weight: 1 },
    ],
    tray: [
      { item_id: "w1", asset: { kind: "emoji", ref: "1️⃣" }, weight: 1 },
      { item_id: "w2", asset: { kind: "emoji", ref: "2️⃣" }, weight: 2 },
    ],
  },
  difficulty_params: {
    tray_count: 2,
    weight_span: 5,
    hint_after_ms: 8000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_2: GameLevelFixture<GT014Content, GT014Difficulty> = {
  id: "SAMPLE-GT014-02",
  template_code: "GT-014",
  title_vi: "Đặt quả cân để tạo thăng bằng",
  age_band: "5-6",
  difficulty: 2,
  access_tier: "login",
  layout: "split-columns",
  content_pack: {
    prompt:
      "Bé hãy kéo quả cân thích hợp vào đĩa phải để chiếc cân thăng bằng nhé!",
    goal: "balance",
    left_pan: [
      { item_id: "weight_8", asset: { kind: "emoji", ref: "8️⃣" }, weight: 8 },
    ],
    right_pan: [
      { item_id: "weight_5", asset: { kind: "emoji", ref: "5️⃣" }, weight: 5 },
    ],
    tray: [
      { item_id: "opt_2", asset: { kind: "emoji", ref: "2️⃣" }, weight: 2 },
      { item_id: "opt_3", asset: { kind: "emoji", ref: "3️⃣" }, weight: 3 },
      { item_id: "opt_4", asset: { kind: "emoji", ref: "4️⃣" }, weight: 4 },
    ],
  },
  difficulty_params: {
    tray_count: 3,
    weight_span: 8,
    hint_after_ms: 10_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVEL_3: GameLevelFixture<GT014Content, GT014Difficulty> = {
  id: "SAMPLE-GT014-03",
  template_code: "GT-014",
  title_vi: "Cân thăng bằng các bạn muông thú",
  age_band: "5-6",
  difficulty: 3,
  access_tier: "standard",
  layout: "split-columns",
  content_pack: {
    prompt: "Bé hãy giúp các bạn động vật ngồi cân bằng hai bên đĩa cân nhé!",
    goal: "balance",
    left_pan: [
      { item_id: "fox", asset: { kind: "emoji", ref: "🦊" }, weight: 3 },
      { item_id: "rabbit", asset: { kind: "emoji", ref: "🐰" }, weight: 2 },
    ],
    right_pan: [
      { item_id: "apple", asset: { kind: "emoji", ref: "🍎" }, weight: 1 },
    ],
    tray: [
      { item_id: "bear", asset: { kind: "emoji", ref: "🐻" }, weight: 4 },
      { item_id: "cat", asset: { kind: "emoji", ref: "🐱" }, weight: 2 },
      { item_id: "dog", asset: { kind: "emoji", ref: "🐶" }, weight: 3 },
    ],
  },
  difficulty_params: {
    tray_count: 3,
    weight_span: 5,
    hint_after_ms: 12_000,
    allow_retry: true,
  },
};

export const SAMPLE_LEVELS = [
  SAMPLE_LEVEL_1,
  SAMPLE_LEVEL_2,
  SAMPLE_LEVEL_3,
] as const;

export const GT014_FIXTURES = SAMPLE_LEVELS.map((s) => ({
  content: s.content_pack,
  difficulty: s.difficulty_params,
}));
