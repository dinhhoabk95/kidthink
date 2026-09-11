/**
 * Kho giá trị 10 số thứ tự tiếng Việt từ thứ nhất đến thứ mười (Task #265 / BR-SVI-06..09).
 */

export interface OrdinalInventoryItem {
  readonly id: string;
  readonly glyph: string;
  readonly label: string;
  readonly position: number;
  readonly group: "C1.ORD.01" | "C1.ORD.03" | "C1.ORD.04";
  readonly audio_path?: string;
}

export const C1_ORDINAL_INVENTORY: readonly OrdinalInventoryItem[] = [
  // C1.ORD.01: Thứ nhất · thứ hai · thứ ba
  {
    id: "ord_1",
    glyph: "1.",
    label: "thứ nhất",
    position: 1,
    group: "C1.ORD.01",
  },
  {
    id: "ord_2",
    glyph: "2.",
    label: "thứ hai",
    position: 2,
    group: "C1.ORD.01",
  },
  {
    id: "ord_3",
    glyph: "3.",
    label: "thứ ba",
    position: 3,
    group: "C1.ORD.01",
  },

  // C1.ORD.03: Thứ tự đến thứ năm
  {
    id: "ord_4",
    glyph: "4.",
    label: "thứ tư",
    position: 4,
    group: "C1.ORD.03",
  },
  {
    id: "ord_5",
    glyph: "5.",
    label: "thứ năm",
    position: 5,
    group: "C1.ORD.03",
  },

  // C1.ORD.04: Thứ tự đến thứ mười
  {
    id: "ord_6",
    glyph: "6.",
    label: "thứ sáu",
    position: 6,
    group: "C1.ORD.04",
  },
  {
    id: "ord_7",
    glyph: "7.",
    label: "thứ bảy",
    position: 7,
    group: "C1.ORD.04",
  },
  {
    id: "ord_8",
    glyph: "8.",
    label: "thứ tám",
    position: 8,
    group: "C1.ORD.04",
  },
  {
    id: "ord_9",
    glyph: "9.",
    label: "thứ chín",
    position: 9,
    group: "C1.ORD.04",
  },
  {
    id: "ord_10",
    glyph: "10.",
    label: "thứ mười",
    position: 10,
    group: "C1.ORD.04",
  },
] as const;
