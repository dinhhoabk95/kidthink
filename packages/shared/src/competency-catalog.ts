/**
 * Bảng nhãn sáu năng lực — **nguồn duy nhất** cho mọi bề mặt.
 *
 * `name` và `description` chép nguyên văn `docs/taxonomy/index.md` (tầng L1 của
 * cây taxonomy). `@mindkid/taxonomy` dẫn xuất `COMPETENCIES` từ đây và seeder
 * gieo xuống bảng `competencies`, nên mã, DB và giao diện không thể lệch nhau.
 *
 * Đặt ở `shared` chứ không ở `taxonomy` vì `taxonomy` đã phụ thuộc `shared`:
 * đi ngược chiều là chu trình, và `no-circular` của dependency-cruiser sẽ đỏ.
 * Module này Cấm — NEVER import gì ngoài type, để `@mindkid/shared/client`
 * mang được nó xuống trình duyệt.
 *
 * Trước task 165 có **bốn** bảng viết tay (public-seo, footer, danh mục game,
 * sảnh chơi) mang taxonomy toán v1 đã bỏ; hai trong bốn bảng còn lệch cả v1.
 */

import type { CompetencyCode } from "./ids.js";
import type { CompetencyTier } from "./taxonomy-types.js";

export interface CompetencyCatalogEntry {
  readonly code: CompetencyCode;
  /** Tên tiếng Việt — nguyên văn `docs/taxonomy/index.md`. */
  readonly name: string;
  /** Tên tiếng Anh — nguyên văn `docs/taxonomy/index.md`. */
  readonly description: string;
  /** Biểu tượng cho thẻ năng lực trên bề mặt công khai. */
  readonly emoji: string;
  /**
   * Một câu cho người lớn chưa biết gì.
   *
   * Tả **hoạt động** của trẻ, Cấm — NEVER hứa kết quả học tập (`BR-LND-06`).
   */
  readonly tagline: string;
  /**
   * Bốn tới sáu chữ cho bề mặt của trẻ (sảnh chơi).
   *
   * `tagline` viết cho người lớn và dài quá một thẻ mà trẻ 3 tuổi nhìn lướt.
   */
  readonly short: string;
}

export const COMPETENCY_CATALOG: readonly CompetencyCatalogEntry[] = [
  {
    code: "C1" as CompetencyCode,
    name: "Tư duy toán học",
    description: "Mathematical Thinking",
    emoji: "🔢",
    tagline:
      "Đếm, so sánh lượng, tách gộp và làm quen phép tính trong phạm vi 10.",
    short: "Đếm, so sánh và tách gộp",
  },
  {
    code: "C2" as CompetencyCode,
    name: "Tư duy không gian",
    description: "Spatial Thinking",
    emoji: "📐",
    tagline: "Nhận biết hình khối, phương hướng, lộ trình và phép xoay hình.",
    short: "Hình khối, phương hướng, vị trí",
  },
  {
    code: "C3" as CompetencyCode,
    name: "Tư duy logic",
    description: "Logical Thinking",
    emoji: "🧩",
    tagline: "Phân loại, sắp thứ tự, tìm quy luật và suy luận loại trừ.",
    short: "Tìm quy luật và suy luận",
  },
  {
    code: "C4" as CompetencyCode,
    name: "Tư duy quan sát",
    description: "Observation Thinking",
    emoji: "🔍",
    tagline: "Chú ý chi tiết, tìm điểm khác, tìm vật ẩn và ghi nhớ hình ảnh.",
    short: "Quan sát và tìm điểm khác",
  },
  {
    code: "C5" as CompetencyCode,
    name: "Tư duy ngôn ngữ",
    description: "Language Thinking",
    emoji: "💬",
    tagline:
      "Từ vựng theo chủ đề, kể lại trình tự truyện và diễn đạt cách làm.",
    short: "Từ ngữ và kể chuyện",
  },
  {
    code: "C6" as CompetencyCode,
    name: "Chức năng điều hành",
    description: "Executive Function",
    emoji: "🎯",
    tagline: "Nhớ luật chơi, kiềm chế phản xạ sai và chuyển đổi linh hoạt.",
    short: "Nhớ luật và tập trung",
  },
] as const;

/** Dạng tầng L1 cho `@mindkid/taxonomy` và seeder — bỏ phần trình bày. */
export const COMPETENCY_TIERS: readonly CompetencyTier[] =
  COMPETENCY_CATALOG.map((entry) => ({
    code: entry.code,
    description: entry.description,
    name: entry.name,
  }));

/** Tra một mục theo mã. `undefined` nếu mã không thuộc C1–C6. */
export function findCompetency(
  code: string
): CompetencyCatalogEntry | undefined {
  return COMPETENCY_CATALOG.find((entry) => entry.code === code);
}
