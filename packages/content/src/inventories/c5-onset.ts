/**
 * Kho giá trị 22 âm đầu tiếng Việt (Task #255 / BR-SVI-01..05).
 * Lưu ý: ONS dạy bằng tai (âm vị học), các dạng chữ viết tương ứng được nhóm chung.
 */

export interface OnsetInventoryItem {
  readonly id: string;
  readonly glyph: string;
  readonly label: string;
  readonly group: "C5.ONS.01" | "C5.ONS.02" | "C5.ONS.03" | "C5.ONS.04";
}

export const C5_ONSET_INVENTORY: readonly OnsetInventoryItem[] = [
  // C5.ONS.01: Tách tiếng thành âm đầu và vần (khái niệm cơ bản)
  { id: "ons_part_dau", glyph: "âm đầu", label: "âm đầu", group: "C5.ONS.01" },
  { id: "ons_part_van", glyph: "vần", label: "vần", group: "C5.ONS.01" },

  // C5.ONS.02: Âm đầu nhóm 1 (6 âm)
  { id: "ons_b", glyph: "b", label: "âm b", group: "C5.ONS.02" },
  {
    id: "ons_c_k_q",
    glyph: "c/k/q",
    label: "âm c (c, k, q)",
    group: "C5.ONS.02",
  },
  { id: "ons_d_gi", glyph: "d/gi", label: "âm d (d, gi)", group: "C5.ONS.02" },
  { id: "ons_đ", glyph: "đ", label: "âm đ", group: "C5.ONS.02" },
  { id: "ons_g_gh", glyph: "g/gh", label: "âm g (g, gh)", group: "C5.ONS.02" },
  { id: "ons_h", glyph: "h", label: "âm h", group: "C5.ONS.02" },

  // C5.ONS.03: Âm đầu nhóm 2 (6 âm)
  { id: "ons_l", glyph: "l", label: "âm l", group: "C5.ONS.03" },
  { id: "ons_m", glyph: "m", label: "âm m", group: "C5.ONS.03" },
  { id: "ons_n", glyph: "n", label: "âm n", group: "C5.ONS.03" },
  {
    id: "ons_ng_ngh",
    glyph: "ng/ngh",
    label: "âm ng (ng, ngh)",
    group: "C5.ONS.03",
  },
  { id: "ons_nh", glyph: "nh", label: "âm nh", group: "C5.ONS.03" },
  { id: "ons_p", glyph: "p", label: "âm p", group: "C5.ONS.03" },

  // C5.ONS.04: Âm đầu nhóm 3 (10 âm)
  { id: "ons_ph", glyph: "ph", label: "âm ph", group: "C5.ONS.04" },
  { id: "ons_r", glyph: "r", label: "âm r", group: "C5.ONS.04" },
  { id: "ons_s", glyph: "s", label: "âm s", group: "C5.ONS.04" },
  { id: "ons_t", glyph: "t", label: "âm t", group: "C5.ONS.04" },
  { id: "ons_th", glyph: "th", label: "âm th", group: "C5.ONS.04" },
  { id: "ons_tr", glyph: "tr", label: "âm tr", group: "C5.ONS.04" },
  { id: "ons_v", glyph: "v", label: "âm v", group: "C5.ONS.04" },
  { id: "ons_x", glyph: "x", label: "âm x", group: "C5.ONS.04" },
  { id: "ons_ch", glyph: "ch", label: "âm ch", group: "C5.ONS.04" },
  { id: "ons_kh", glyph: "kh", label: "âm kh", group: "C5.ONS.04" },
] as const;
