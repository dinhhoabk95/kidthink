/**
 * Kho giá trị 6 cặp chiều đo đối lập (Task #265 / BR-SVI-06, BR-SVI-11).
 *
 * Mọi mục bắt buộc mang cả hai cực (pole_more và pole_less).
 * Dataset của C1.MEAS và C1.CMP bắt buộc lấy cả hai cực của một cặp.
 */

export interface MeasureDimensionInventoryItem {
  readonly id: string;
  readonly label: string;
  readonly pole_more: string;
  readonly pole_less: string;
  readonly unit_kind: string;
  readonly group: string;
}

export const C1_MEASURE_DIMENSION_INVENTORY: readonly MeasureDimensionInventoryItem[] =
  [
    {
      id: "dim_length",
      label: "chiều dài (dài – ngắn)",
      pole_more: "dài",
      pole_less: "ngắn",
      unit_kind: "length",
      group: "C1.MEAS.01",
    },
    {
      id: "dim_height",
      label: "chiều cao (cao – thấp)",
      pole_more: "cao",
      pole_less: "thấp",
      unit_kind: "height",
      group: "C1.MEAS.02",
    },
    {
      id: "dim_weight",
      label: "khối lượng (nặng – nhẹ)",
      pole_more: "nặng",
      pole_less: "nhẹ",
      unit_kind: "weight",
      group: "C1.MEAS.03",
    },
    {
      id: "dim_size",
      label: "kích thước (to – nhỏ)",
      pole_more: "to",
      pole_less: "nhỏ",
      unit_kind: "size",
      group: "C1.CMP.01",
    },
    {
      id: "dim_quantity",
      label: "lượng (nhiều – ít)",
      pole_more: "nhiều",
      pole_less: "ít",
      unit_kind: "quantity",
      group: "C1.CMP.04",
    },
    {
      id: "dim_capacity",
      label: "dung tích (đầy – vơi)",
      pole_more: "đầy",
      pole_less: "vơi",
      unit_kind: "capacity",
      group: "C1.MEAS.05",
    },
  ] as const;
