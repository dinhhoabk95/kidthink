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
  readonly vn_rhythm_example?: string;
}

export const C1_PATTERN_UNIT_INVENTORY: readonly PatternUnitInventoryItem[] = [
  {
    id: "pat_ab",
    label: "quy luật AB",
    signature: "AB",
    period: 2,
    group: "C1.PAT.01",
    vn_rhythm_example: "Đèn lồng đỏ – ngôi sao vàng xen kẽ",
  },
  {
    id: "pat_aab",
    label: "quy luật AAB",
    signature: "AAB",
    period: 3,
    group: "C1.PAT.03",
    vn_rhythm_example: "Tùng – tùng – cắc theo nhịp trống hội",
  },
  {
    id: "pat_abb",
    label: "quy luật ABB",
    signature: "ABB",
    period: 3,
    group: "C1.PAT.02",
    vn_rhythm_example: "Một bông sen hồng – hai chiếc lá xanh",
  },
  {
    id: "pat_abc",
    label: "quy luật ABC",
    signature: "ABC",
    period: 3,
    group: "C1.PAT.04",
    vn_rhythm_example: "Xoài chín – chuối vàng – cam tươi nối đuôi",
  },
  {
    id: "pat_abba",
    label: "quy luật ABBA",
    signature: "ABBA",
    period: 4,
    group: "C1.PAT.05",
    vn_rhythm_example: "Nan chiếu đối xứng đỏ – vàng – vàng – đỏ",
  },
  {
    id: "pat_aabb",
    label: "quy luật AABB",
    signature: "AABB",
    period: 4,
    group: "C1.PAT.05",
    vn_rhythm_example: "Hai cánh diều xanh – hai đám mây trắng",
  },
] as const;
