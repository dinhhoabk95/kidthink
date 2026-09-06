/**
 * Kho giá trị 6 dấu thanh tiếng Việt (Task #255 / BR-SVI-01..05).
 */

export interface ToneMarkInventoryItem {
  readonly id: string;
  readonly glyph: string;
  readonly label: string;
  readonly group: "C5.TMK.01" | "C5.TMK.02" | "C5.TMK.03";
}

export const C5_TONE_MARK_INVENTORY: readonly ToneMarkInventoryItem[] = [
  // C5.TMK.01: Dấu ngang và dấu huyền
  { id: "tmk_ngang", glyph: "—", label: "thanh ngang", group: "C5.TMK.01" },
  { id: "tmk_huyen", glyph: "ˋ", label: "dấu huyền", group: "C5.TMK.01" },

  // C5.TMK.02: Dấu sắc và dấu nặng
  { id: "tmk_sac", glyph: "ˊ", label: "dấu sắc", group: "C5.TMK.02" },
  { id: "tmk_nang", glyph: "﹒", label: "dấu nặng", group: "C5.TMK.02" },

  // C5.TMK.03: Dấu hỏi và dấu ngã
  { id: "tmk_hoi", glyph: "̉", label: "dấu hỏi", group: "C5.TMK.03" },
  { id: "tmk_nga", glyph: "˜", label: "dấu ngã", group: "C5.TMK.03" },
] as const;
