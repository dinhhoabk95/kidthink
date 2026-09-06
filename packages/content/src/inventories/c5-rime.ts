/**
 * Kho giá trị 53 vần tiếng Việt (Task #255 / BR-SVI-01..05).
 */

export interface RimeInventoryItem {
  readonly id: string;
  readonly glyph: string;
  readonly label: string;
  readonly group:
    | "C5.RIM.01"
    | "C5.RIM.02"
    | "C5.RIM.03"
    | "C5.RIM.04"
    | "C5.RIM.05"
    | "C5.RIM.06";
}

export const C5_RIME_INVENTORY: readonly RimeInventoryItem[] = [
  // C5.RIM.01: Vần một âm (12 nguyên âm)
  { id: "rim_a", glyph: "a", label: "vần a", group: "C5.RIM.01" },
  { id: "rim_ă", glyph: "ă", label: "vần ă", group: "C5.RIM.01" },
  { id: "rim_â", glyph: "â", label: "vần â", group: "C5.RIM.01" },
  { id: "rim_e", glyph: "e", label: "vần e", group: "C5.RIM.01" },
  { id: "rim_ê", glyph: "ê", label: "vần ê", group: "C5.RIM.01" },
  { id: "rim_i", glyph: "i", label: "vần i", group: "C5.RIM.01" },
  { id: "rim_o", glyph: "o", label: "vần o", group: "C5.RIM.01" },
  { id: "rim_ô", glyph: "ô", label: "vần ô", group: "C5.RIM.01" },
  { id: "rim_ơ", glyph: "ơ", label: "vần ơ", group: "C5.RIM.01" },
  { id: "rim_u", glyph: "u", label: "vần u", group: "C5.RIM.01" },
  { id: "rim_ư", glyph: "ư", label: "vần ư", group: "C5.RIM.01" },
  { id: "rim_y", glyph: "y", label: "vần y", group: "C5.RIM.01" },

  // C5.RIM.02: Vần đóng bằng n (11 vần)
  { id: "rim_an", glyph: "an", label: "vần an", group: "C5.RIM.02" },
  { id: "rim_ăn", glyph: "ăn", label: "vần ăn", group: "C5.RIM.02" },
  { id: "rim_ân", glyph: "ân", label: "vần ân", group: "C5.RIM.02" },
  { id: "rim_en", glyph: "en", label: "vần en", group: "C5.RIM.02" },
  { id: "rim_ên", glyph: "ên", label: "vần ên", group: "C5.RIM.02" },
  { id: "rim_in", glyph: "in", label: "vần in", group: "C5.RIM.02" },
  { id: "rim_on", glyph: "on", label: "vần on", group: "C5.RIM.02" },
  { id: "rim_ôn", glyph: "ôn", label: "vần ôn", group: "C5.RIM.02" },
  { id: "rim_ơn", glyph: "ơn", label: "vần ơn", group: "C5.RIM.02" },
  { id: "rim_un", glyph: "un", label: "vần un", group: "C5.RIM.02" },
  { id: "rim_ưn", glyph: "ưn", label: "vần ưn", group: "C5.RIM.02" },

  // C5.RIM.03: Vần đóng bằng m · ng (10 vần)
  { id: "rim_am", glyph: "am", label: "vần am", group: "C5.RIM.03" },
  { id: "rim_ăm", glyph: "ăm", label: "vần ăm", group: "C5.RIM.03" },
  { id: "rim_âm", glyph: "âm", label: "vần âm", group: "C5.RIM.03" },
  { id: "rim_ang", glyph: "ang", label: "vần ang", group: "C5.RIM.03" },
  { id: "rim_ăng", glyph: "ăng", label: "vần ăng", group: "C5.RIM.03" },
  { id: "rim_âng", glyph: "âng", label: "vần âng", group: "C5.RIM.03" },
  { id: "rim_ong", glyph: "ong", label: "vần ong", group: "C5.RIM.03" },
  { id: "rim_ông", glyph: "ông", label: "vần ông", group: "C5.RIM.03" },
  { id: "rim_ung", glyph: "ung", label: "vần ung", group: "C5.RIM.03" },
  { id: "rim_ưng", glyph: "ưng", label: "vần ưng", group: "C5.RIM.03" },

  // C5.RIM.04: Vần đóng bằng c · t · p (9 vần)
  { id: "rim_ac", glyph: "ac", label: "vần ac", group: "C5.RIM.04" },
  { id: "rim_ăc", glyph: "ăc", label: "vần ăc", group: "C5.RIM.04" },
  { id: "rim_âc", glyph: "âc", label: "vần âc", group: "C5.RIM.04" },
  { id: "rim_at", glyph: "at", label: "vần at", group: "C5.RIM.04" },
  { id: "rim_ăt", glyph: "ăt", label: "vần ăt", group: "C5.RIM.04" },
  { id: "rim_ât", glyph: "ât", label: "vần ât", group: "C5.RIM.04" },
  { id: "rim_ap", glyph: "ap", label: "vần ap", group: "C5.RIM.04" },
  { id: "rim_ăp", glyph: "ăp", label: "vần ăp", group: "C5.RIM.04" },
  { id: "rim_âp", glyph: "âp", label: "vần âp", group: "C5.RIM.04" },

  // C5.RIM.05: Vần có âm đệm (5 vần)
  { id: "rim_oa", glyph: "oa", label: "vần oa", group: "C5.RIM.05" },
  { id: "rim_oe", glyph: "oe", label: "vần oe", group: "C5.RIM.05" },
  { id: "rim_uy", glyph: "uy", label: "vần uy", group: "C5.RIM.05" },
  { id: "rim_uê", glyph: "uê", label: "vần uê", group: "C5.RIM.05" },
  { id: "rim_uơ", glyph: "uơ", label: "vần uơ", group: "C5.RIM.05" },

  // C5.RIM.06: Vần nguyên âm đôi (6 vần)
  { id: "rim_ia", glyph: "ia", label: "vần ia", group: "C5.RIM.06" },
  { id: "rim_iê", glyph: "iê", label: "vần iê", group: "C5.RIM.06" },
  { id: "rim_ua", glyph: "ua", label: "vần ua", group: "C5.RIM.06" },
  { id: "rim_uô", glyph: "uô", label: "vần uô", group: "C5.RIM.06" },
  { id: "rim_ưa", glyph: "ưa", label: "vần ưa", group: "C5.RIM.06" },
  { id: "rim_ươ", glyph: "ươ", label: "vần ươ", group: "C5.RIM.06" },
] as const;
