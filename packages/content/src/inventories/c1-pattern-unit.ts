/**
 * Kho giá trị 6 đơn vị lặp quy luật (Task #265 / BR-SVI-06).
 *
 * AB · AAB · ABB · ABC · ABBA · AABB.
 * signature là chuỗi ký hiệu cấu trúc, period là độ dài chu kỳ lặp.
 */

export interface PatternUnitInventoryItem {
  readonly id: string;
  readonly label: string;
  readonly signature: string;
  readonly period: number;
  readonly group: string;
}

export const C1_PATTERN_UNIT_INVENTORY: readonly PatternUnitInventoryItem[] = [
  {
    id: "pat_ab",
    label: "quy luật AB",
    signature: "AB",
    period: 2,
    group: "C1.PAT.01",
  },
  {
    id: "pat_aab",
    label: "quy luật AAB",
    signature: "AAB",
    period: 3,
    group: "C1.PAT.03",
  },
  {
    id: "pat_abb",
    label: "quy luật ABB",
    signature: "ABB",
    period: 3,
    group: "C1.PAT.02",
  },
  {
    id: "pat_abc",
    label: "quy luật ABC",
    signature: "ABC",
    period: 3,
    group: "C1.PAT.04",
  },
  {
    id: "pat_abba",
    label: "quy luật ABBA",
    signature: "ABBA",
    period: 4,
    group: "C1.PAT.05",
  },
  {
    id: "pat_aabb",
    label: "quy luật AABB",
    signature: "AABB",
    period: 4,
    group: "C1.PAT.05",
  },
] as const;
