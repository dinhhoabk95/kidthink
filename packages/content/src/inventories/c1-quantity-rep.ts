/**
 * Kho giá trị 8 lối biểu diễn lượng (Task #265 / BR-SVI-06..07).
 *
 * Sắp xếp theo thang bậc cụ thể → trừu tượng (CPA / Montessori).
 * Chữ số (numeral) không thuộc kho này vì thuộc tầng abstract riêng (c1-numeral.ts).
 */
export type QuantityRepKind =
  | "discrete-object"
  | "finger"
  | "number-rod"
  | "rekenrek"
  | "ten-frame"
  | "dot-pattern"
  | "tally"
  | "number-line";

export type ConcretenessLevel = "concrete" | "semi-concrete" | "semi-abstract";

export interface QuantityRepInventoryItem {
  readonly id: string;
  readonly kind: QuantityRepKind;
  readonly label: string;
  readonly concreteness: ConcretenessLevel;
  readonly min_value: number;
  readonly max_value: number;
  readonly group: string;
}

export const C1_QUANTITY_REP_INVENTORY: readonly QuantityRepInventoryItem[] = [
  {
    id: "rep_discrete_object",
    kind: "discrete-object",
    label: "vật rời đếm được",
    concreteness: "concrete",
    min_value: 1,
    max_value: 10,
    group: "C1.CNT",
  },
  {
    id: "rep_finger",
    kind: "finger",
    label: "ngón tay",
    concreteness: "concrete",
    min_value: 1,
    max_value: 10,
    group: "C1.CNT",
  },
  {
    id: "rep_number_rod",
    kind: "number-rod",
    label: "thanh số Montessori",
    concreteness: "concrete",
    min_value: 1,
    max_value: 10,
    group: "C1.CNT",
  },
  {
    id: "rep_rekenrek",
    kind: "rekenrek",
    label: "bàn tính rekenrek",
    concreteness: "semi-concrete",
    min_value: 1,
    max_value: 20,
    group: "C1.CNT",
  },
  {
    id: "rep_ten_frame",
    kind: "ten-frame",
    label: "khung mười",
    concreteness: "semi-concrete",
    min_value: 1,
    max_value: 20,
    group: "C1.CNT",
  },
  {
    id: "rep_dot_pattern",
    kind: "dot-pattern",
    label: "chấm xúc xắc",
    concreteness: "semi-concrete",
    min_value: 1,
    max_value: 6,
    group: "C1.CNT",
  },
  {
    id: "rep_tally",
    kind: "tally",
    label: "dấu gạch tally",
    concreteness: "semi-abstract",
    min_value: 1,
    max_value: 20,
    group: "C1.DAT",
  },
  {
    id: "rep_number_line",
    kind: "number-line",
    label: "trục số",
    concreteness: "semi-abstract",
    min_value: 0,
    max_value: 20,
    group: "C1.CNT",
  },
] as const;
