/**
 * Kho giá trị 29 chữ cái tiếng Việt (Task #255 / BR-SVI-01..05).
 */

export interface LetterInventoryItem {
  readonly id: string;
  readonly glyph: string;
  readonly label: string;
  readonly group:
    | "C5.LET.01"
    | "C5.LET.02"
    | "C5.LET.03"
    | "C5.LET.04"
    | "C5.LET.05";
}

export const C5_LETTER_INVENTORY: readonly LetterInventoryItem[] = [
  // C5.LET.01: a · e · i · o · u · y (6 nguyên âm cơ bản)
  { id: "let_a", glyph: "a", label: "chữ a", group: "C5.LET.01" },
  { id: "let_e", glyph: "e", label: "chữ e", group: "C5.LET.01" },
  { id: "let_i", glyph: "i", label: "chữ i", group: "C5.LET.01" },
  { id: "let_o", glyph: "o", label: "chữ o", group: "C5.LET.01" },
  { id: "let_u", glyph: "u", label: "chữ u", group: "C5.LET.01" },
  { id: "let_y", glyph: "y", label: "chữ y", group: "C5.LET.01" },

  // C5.LET.02: ă · â · ê · ô · ơ · ư (6 nguyên âm có dấu)
  { id: "let_ă", glyph: "ă", label: "chữ ă", group: "C5.LET.02" },
  { id: "let_â", glyph: "â", label: "chữ â", group: "C5.LET.02" },
  { id: "let_ê", glyph: "ê", label: "chữ ê", group: "C5.LET.02" },
  { id: "let_ô", glyph: "ô", label: "chữ ô", group: "C5.LET.02" },
  { id: "let_ơ", glyph: "ơ", label: "chữ ơ", group: "C5.LET.02" },
  { id: "let_ư", glyph: "ư", label: "chữ ư", group: "C5.LET.02" },

  // C5.LET.03: b · c · d · đ · g · h (6 phụ âm đơn 1)
  { id: "let_b", glyph: "b", label: "chữ b", group: "C5.LET.03" },
  { id: "let_c", glyph: "c", label: "chữ c", group: "C5.LET.03" },
  { id: "let_d", glyph: "d", label: "chữ d", group: "C5.LET.03" },
  { id: "let_đ", glyph: "đ", label: "chữ đ", group: "C5.LET.03" },
  { id: "let_g", glyph: "g", label: "chữ g", group: "C5.LET.03" },
  { id: "let_h", glyph: "h", label: "chữ h", group: "C5.LET.03" },

  // C5.LET.04: k · l · m · n · p · q (6 phụ âm đơn 2)
  { id: "let_k", glyph: "k", label: "chữ k", group: "C5.LET.04" },
  { id: "let_l", glyph: "l", label: "chữ l", group: "C5.LET.04" },
  { id: "let_m", glyph: "m", label: "chữ m", group: "C5.LET.04" },
  { id: "let_n", glyph: "n", label: "chữ n", group: "C5.LET.04" },
  { id: "let_p", glyph: "p", label: "chữ p", group: "C5.LET.04" },
  { id: "let_q", glyph: "q", label: "chữ q", group: "C5.LET.04" },

  // C5.LET.05: r · s · t · v · x (5 phụ âm đơn 3)
  { id: "let_r", glyph: "r", label: "chữ r", group: "C5.LET.05" },
  { id: "let_s", glyph: "s", label: "chữ s", group: "C5.LET.05" },
  { id: "let_t", glyph: "t", label: "chữ t", group: "C5.LET.05" },
  { id: "let_v", glyph: "v", label: "chữ v", group: "C5.LET.05" },
  { id: "let_x", glyph: "x", label: "chữ x", group: "C5.LET.05" },
] as const;
