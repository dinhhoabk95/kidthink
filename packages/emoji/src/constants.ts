/**
 * @mindkid/emoji — Constants
 * Mapping groups → categories và curriculum themes → categories (36 nhóm).
 */

import type { CurriculumTheme, EmojiCategory, EmojiGroup } from "#src/types";

export const EMOJI_GROUPS: Record<EmojiGroup, EmojiCategory[]> = {
  ban_than_xa_hoi: [
    "body",
    "face-emotion",
    "family",
    "profession",
    "school",
    "science-lab",
  ],
  doi_song: ["household", "clothing", "tool", "time", "flag-symbol"],
  dong_vat: [
    "animal-farm",
    "animal-wild",
    "animal-water",
    "animal-bird",
    "animal-insect",
    "animal-prehistoric",
  ],
  phuong_tien: ["vehicle-road", "vehicle-rail", "vehicle-water", "vehicle-air"],
  the_chat: ["sport-game", "toy", "hand-gesture"],
  thien_nhien: ["weather-season", "nature-landscape", "sky-space"],
  thuc_vat_thuc_pham: ["fruit", "vegetable", "flower-tree", "food"],
  toan_hinh_hoc: ["shape-color", "number-symbol"],
  van_hoa_le_hoi: ["festival", "music-art", "vn-culture"],
};

export const CURRICULUM_THEME_CATEGORIES: Record<
  CurriculumTheme,
  EmojiCategory[]
> = {
  ban_than: ["body", "face-emotion", "hand-gesture"],
  dinh_duong_suc_khoe: ["fruit", "vegetable", "food", "vn-culture", "body"],
  dong_vat: [
    "animal-farm",
    "animal-wild",
    "animal-water",
    "animal-bird",
    "animal-insect",
    "animal-prehistoric",
  ],
  gia_dinh: ["family", "household", "toy"],
  nghe_nghiep: ["profession", "tool", "science-lab"],
  nuoc_hien_tuong_tu_nhien: [
    "nature-landscape",
    "weather-season",
    "sky-space",
    "science-lab",
  ],
  phuong_tien: ["vehicle-road", "vehicle-rail", "vehicle-water", "vehicle-air"],
  que_huong_dat_nuoc: [
    "vn-culture",
    "flag-symbol",
    "festival",
    "nature-landscape",
  ],
  the_gioi_dong_vat: [
    "animal-farm",
    "animal-wild",
    "animal-water",
    "animal-bird",
    "animal-insect",
    "animal-prehistoric",
  ],
  thoi_tiet_mua: ["weather-season", "sky-space"],
  thuc_vat: ["fruit", "vegetable", "flower-tree"],
  truong_mam_non: ["school", "science-lab", "sport-game", "toy"],
};

export const ALL_CATEGORIES: EmojiCategory[] = [
  "body",
  "face-emotion",
  "family",
  "profession",
  "school",
  "science-lab",
  "animal-farm",
  "animal-wild",
  "animal-water",
  "animal-bird",
  "animal-insect",
  "animal-prehistoric",
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
  "vn-culture",
  "sport-game",
  "toy",
  "hand-gesture",
  "household",
  "clothing",
  "tool",
  "time",
  "flag-symbol",
];
