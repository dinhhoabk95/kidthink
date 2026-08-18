/**
 * @mindkid/emoji — Constants
 * Mapping groups → categories và curriculum themes → categories.
 */

import type { CurriculumTheme, EmojiCategory, EmojiGroup } from "./types";

// ── Groups → Categories mapping ──────────────────────────────────
export const EMOJI_GROUPS: Record<EmojiGroup, EmojiCategory[]> = {
  ban_than_xa_hoi: ["body", "face-emotion", "family", "profession", "school"],
  doi_song: ["household", "clothing", "tool", "time", "flag-symbol"],
  dong_vat: [
    "animal-farm",
    "animal-wild",
    "animal-water",
    "animal-bird",
    "animal-insect",
  ],
  phuong_tien: ["vehicle-road", "vehicle-rail", "vehicle-water", "vehicle-air"],
  the_chat: ["sport-game", "hand-gesture"],
  thien_nhien: ["weather-season", "nature-landscape", "sky-space"],
  thuc_vat_thuc_pham: ["fruit", "vegetable", "flower-tree", "food"],
  toan_hinh_hoc: ["shape-color", "number-symbol"],
  van_hoa_le_hoi: ["festival", "music-art"],
};

// ── Curriculum themes → Categories mapping ───────────────────────
export const CURRICULUM_THEME_CATEGORIES: Record<
  CurriculumTheme,
  EmojiCategory[]
> = {
  ban_than: ["body", "face-emotion", "hand-gesture"],
  dinh_duong_suc_khoe: ["fruit", "vegetable", "food", "body"],
  dong_vat: [
    "animal-farm",
    "animal-wild",
    "animal-water",
    "animal-bird",
    "animal-insect",
  ],
  gia_dinh: ["family", "household"],
  nghe_nghiep: ["profession", "tool"],
  nuoc_hien_tuong_tu_nhien: ["nature-landscape", "weather-season", "sky-space"],
  phuong_tien: ["vehicle-road", "vehicle-rail", "vehicle-water", "vehicle-air"],
  que_huong_dat_nuoc: ["flag-symbol", "festival", "nature-landscape"],
  the_gioi_dong_vat: [
    "animal-farm",
    "animal-wild",
    "animal-water",
    "animal-bird",
    "animal-insect",
  ],
  thoi_tiet_mua: ["weather-season", "sky-space"],
  thuc_vat: ["fruit", "vegetable", "flower-tree"],
  truong_mam_non: ["school", "sport-game"],
};

// ── All 32 categories (for validation) ───────────────────────────
export const ALL_CATEGORIES: EmojiCategory[] = [
  "body",
  "face-emotion",
  "family",
  "profession",
  "school",
  "animal-farm",
  "animal-wild",
  "animal-water",
  "animal-bird",
  "animal-insect",
  "fruit",
  "vegetable",
  "flower-tree",
  "food",
  "vehicle-road",
  "vehicle-rail",
  "vehicle-water",
  "vehicle-air",
  "weather-season",
  "nature-landscape",
  "sky-space",
  "shape-color",
  "number-symbol",
  "festival",
  "music-art",
  "sport-game",
  "hand-gesture",
  "household",
  "clothing",
  "tool",
  "time",
  "flag-symbol",
];
