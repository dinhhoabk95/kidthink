/**
 * @kidthink/emoji — Type definitions
 * Hệ sinh thái emoji curated cho giáo dục mầm non Việt Nam.
 */

// ── 32 emoji categories ──────────────────────────────────────────
export type EmojiCategory =
  // Nhóm 1: Bản thân & Xã hội
  | "body"
  | "face-emotion"
  | "family"
  | "profession"
  | "school"
  // Nhóm 2: Thế giới Động vật
  | "animal-farm"
  | "animal-wild"
  | "animal-water"
  | "animal-bird"
  | "animal-insect"
  // Nhóm 3: Thực vật & Thực phẩm
  | "fruit"
  | "vegetable"
  | "flower-tree"
  | "food"
  // Nhóm 4: Phương tiện Giao thông
  | "vehicle-road"
  | "vehicle-rail"
  | "vehicle-water"
  | "vehicle-air"
  // Nhóm 5: Thiên nhiên & Môi trường
  | "weather-season"
  | "nature-landscape"
  | "sky-space"
  // Nhóm 6: Toán & Hình học
  | "shape-color"
  | "number-symbol"
  // Nhóm 7: Văn hóa & Lễ hội
  | "festival"
  | "music-art"
  // Nhóm 8: Thể chất & Vận động
  | "sport-game"
  | "hand-gesture"
  // Nhóm 9: Đời sống & Đồ vật
  | "household"
  | "clothing"
  | "tool"
  | "time"
  | "flag-symbol";

// ── 9 emoji groups ───────────────────────────────────────────────
export type EmojiGroup =
  | "ban_than_xa_hoi"
  | "dong_vat"
  | "thuc_vat_thuc_pham"
  | "phuong_tien"
  | "thien_nhien"
  | "toan_hinh_hoc"
  | "van_hoa_le_hoi"
  | "the_chat"
  | "doi_song";

// ── 12 curriculum themes (chương trình mầm non VN) ──────────────
export type CurriculumTheme =
  | "ban_than"
  | "gia_dinh"
  | "truong_mam_non"
  | "dong_vat"
  | "thuc_vat"
  | "phuong_tien"
  | "nghe_nghiep"
  | "thoi_tiet_mua"
  | "nuoc_hien_tuong_tu_nhien"
  | "que_huong_dat_nuoc"
  | "the_gioi_dong_vat"
  | "dinh_duong_suc_khoe";

// ── Emoji entry ──────────────────────────────────────────────────
export interface EmojiEntry {
  /** Optional EMJ-<slug> code */
  code?: string;
  /** Minimum recommended age (3–6) */
  age_min: number;
  /** Category this emoji belongs to */
  category: EmojiCategory;
  /** Mapped curriculum themes */
  curriculum_themes: CurriculumTheme[];
  /** The emoji character itself, e.g. '🍎' */
  emoji: string;
  /** Search keywords, English + Vietnamese merged, deduped (≥ 2) */
  keywords: string[];
  /** Display name */
  name: string;
}
