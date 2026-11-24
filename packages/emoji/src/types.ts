/**
 * @mindkid/emoji — Type definitions
 * Hệ sinh thái emoji & SVG minh hoạ thực tế cho giáo dục mầm non Việt Nam.
 */

// ── 36 emoji categories ──────────────────────────────────────────
export type EmojiCategory =
  // Nhóm 1: Bản thân & Xã hội
  | "body"
  | "face-emotion"
  | "family"
  | "profession"
  | "school"
  | "science-lab"
  // Nhóm 2: Thế giới Động vật
  | "animal-farm"
  | "animal-wild"
  | "animal-water"
  | "animal-bird"
  | "animal-insect"
  | "animal-prehistoric"
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
  | "vn-culture"
  // Nhóm 8: Thể chất, Trò chơi & Vận động
  | "sport-game"
  | "toy"
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
  /** Minimum recommended age (3–6) */
  age_min: number;
  /** Categories this emoji belongs to (1..N of 36 categories) */
  categories: EmojiCategory[];
  /** Mapped curriculum themes */
  curriculum_themes: CurriculumTheme[];
  /** The emoji character itself (primary key, NFC, unique), e.g. '🍎' */
  emoji: string;
  /** Optional 360x360 Hero WebP path for Tier-3 hero assets */
  hero_webp_path?: string;
  /** Search keywords, English + Vietnamese merged, deduped (≥ 2) */
  keywords: string[];
  /** Display name */
  name: string;
  /** Sprite kebab-case slug, e.g. 'backpack' */
  slug?: string;
  /** Custom 2.5D realistic SVG sprite path, e.g. '/sprites/emoji/backpack.svg' */
  svg_path?: string;
}

// ── Custom SVG / Hero WebP Sprite Metadata ───────────────────────
export type CustomSpriteTier = "vector_craft" | "hero_webp";

export interface EmojiSpriteMeta {
  readonly emoji: string;
  readonly heroWebpPath?: string;
  readonly nameVi: string;
  readonly slug: string;
  readonly svgPath: string;
  readonly tier: CustomSpriteTier;
}
