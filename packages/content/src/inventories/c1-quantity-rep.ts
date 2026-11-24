/**
 * Kho giá trị 8 lối biểu diễn lượng (Task #265 / BR-SVI-06..07).
 *
 * Sắp xếp theo thang bậc cụ thể → trừu tượng (CPA / Montessori).
 * Chữ số (numeral) không thuộc kho này vì thuộc tầng abstract riêng (c1-numeral.ts).
 */
import type { QuantityRepKind } from "@mindkid/shared/skill-dataset-types";

export type { QuantityRepKind } from "@mindkid/shared/skill-dataset-types";

export type ConcretenessLevel = "concrete" | "semi-concrete" | "semi-abstract";

export interface QuantityRepInventoryItem {
  readonly id: string;
  readonly kind: QuantityRepKind;
  readonly label: string;
  readonly concreteness: ConcretenessLevel;
  readonly min_value: number;
  readonly max_value: number;
  readonly group: string;
  readonly vn_manipulative_cue?: string;
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
    vn_manipulative_cue: "Hạt đậu, sỏi suối, quả xoài chín đặt trong rổ mây",
  },
  {
    id: "rep_finger",
    kind: "finger",
    label: "ngón tay",
    concreteness: "concrete",
    min_value: 1,
    max_value: 10,
    group: "C1.CNT",
    vn_manipulative_cue: "Bàn tay xinh xòe ngón đếm một đối một",
  },
  {
    id: "rep_number_rod",
    kind: "number-rod",
    label: "thanh số Montessori",
    concreteness: "concrete",
    min_value: 1,
    max_value: 10,
    group: "C1.CNT",
    vn_manipulative_cue: "Thanh gỗ và đốt tre nối dài cảm nhận độ lớn",
  },
  {
    id: "rep_rekenrek",
    kind: "rekenrek",
    label: "bàn tính rekenrek",
    concreteness: "semi-concrete",
    min_value: 1,
    max_value: 20,
    group: "C1.CNT",
    vn_manipulative_cue: "Khung hạt gỗ hai màu tách nhóm 5 và 10",
  },
  {
    id: "rep_ten_frame",
    kind: "ten-frame",
    label: "khung mười",
    concreteness: "semi-concrete",
    min_value: 1,
    max_value: 20,
    group: "C1.CNT",
    vn_manipulative_cue: "Khay tre mười ô xếp hạt sen tròn trịa",
  },
  {
    id: "rep_dot_pattern",
    kind: "dot-pattern",
    label: "chấm xúc xắc",
    concreteness: "semi-concrete",
    min_value: 1,
    max_value: 6,
    group: "C1.CNT",
    vn_manipulative_cue: "Mặt chấm xúc xắc nhìn thoáng nhận ngay lượng",
  },
  {
    id: "rep_tally",
    kind: "tally",
    label: "dấu gạch tally",
    concreteness: "semi-abstract",
    min_value: 1,
    max_value: 20,
    group: "C1.DAT",
    vn_manipulative_cue: "Que tính tre bó thành từng chùm năm que",
  },
  {
    id: "rep_number_line",
    kind: "number-line",
    label: "trục số",
    concreteness: "semi-abstract",
    min_value: 0,
    max_value: 20,
    group: "C1.CNT",
    vn_manipulative_cue: "Hàng gạch sân trường bước nhảy tiến lùi đều nhau",
  },
] as const;
