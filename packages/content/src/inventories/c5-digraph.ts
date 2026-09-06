/**
 * Kho giá trị 11 chữ ghép tiếng Việt (Task #255 / BR-SVI-01..05).
 */

export interface DigraphInventoryItem {
  readonly id: string;
  readonly glyph: string;
  readonly label: string;
  readonly group: "C5.DGR.01" | "C5.DGR.02";
}

export const C5_DIGRAPH_INVENTORY: readonly DigraphInventoryItem[] = [
  // C5.DGR.01: ch · gh · gi · kh · nh · ph · th · tr · qu (9 chữ ghép hai)
  { id: "dgr_ch", glyph: "ch", label: "chữ ch", group: "C5.DGR.01" },
  { id: "dgr_gh", glyph: "gh", label: "chữ gh", group: "C5.DGR.01" },
  { id: "dgr_gi", glyph: "gi", label: "chữ gi", group: "C5.DGR.01" },
  { id: "dgr_kh", glyph: "kh", label: "chữ kh", group: "C5.DGR.01" },
  { id: "dgr_nh", glyph: "nh", label: "chữ nh", group: "C5.DGR.01" },
  { id: "dgr_ph", glyph: "ph", label: "chữ ph", group: "C5.DGR.01" },
  { id: "dgr_th", glyph: "th", label: "chữ th", group: "C5.DGR.01" },
  { id: "dgr_tr", glyph: "tr", label: "chữ tr", group: "C5.DGR.01" },
  { id: "dgr_qu", glyph: "qu", label: "chữ qu", group: "C5.DGR.01" },

  // C5.DGR.02: ng · ngh (2 chữ ghép có ng)
  { id: "dgr_ng", glyph: "ng", label: "chữ ng", group: "C5.DGR.02" },
  { id: "dgr_ngh", glyph: "ngh", label: "chữ ngh", group: "C5.DGR.02" },
] as const;
