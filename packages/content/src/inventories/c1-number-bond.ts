/**
 * Kho giá trị 65 phân tách số có thứ tự cho các số từ 1 đến 10 (Task #265 / BR-SVI-06, BR-SVI-10).
 *
 * Cấm — NEVER sinh phân tách tại chỗ trong dataset.
 * Với mỗi whole 1–10, part_a chạy từ 0 đến whole (whole + 1 mục). Tổng: 2+3+...+11 = 65 mục.
 */

export type NumberBondGroup =
  | "C1.NCOMP.01"
  | "C1.NCOMP.02"
  | "C1.NCOMP.03"
  | "C1.NCOMP.04"
  | "C1.NCOMP.05"
  | "C1.NCOMP.06"
  | "C1.NCOMP.07"
  | "C1.NCOMP.08"
  | "C1.NCOMP.09";

export interface NumberBondInventoryItem {
  readonly id: string;
  readonly label: string;
  readonly whole: number;
  readonly part_a: number;
  readonly part_b: number;
  readonly group: NumberBondGroup;
}

export const C1_NUMBER_BOND_INVENTORY: readonly NumberBondInventoryItem[] = [
  // whole = 1 (2 mục) — C1.NCOMP.01
  {
    id: "bond_1_0_1",
    label: "1 = 0 + 1",
    whole: 1,
    part_a: 0,
    part_b: 1,
    group: "C1.NCOMP.01",
  },
  {
    id: "bond_1_1_0",
    label: "1 = 1 + 0",
    whole: 1,
    part_a: 1,
    part_b: 0,
    group: "C1.NCOMP.01",
  },

  // whole = 2 (3 mục) — C1.NCOMP.01
  {
    id: "bond_2_0_2",
    label: "2 = 0 + 2",
    whole: 2,
    part_a: 0,
    part_b: 2,
    group: "C1.NCOMP.01",
  },
  {
    id: "bond_2_1_1",
    label: "2 = 1 + 1",
    whole: 2,
    part_a: 1,
    part_b: 1,
    group: "C1.NCOMP.01",
  },
  {
    id: "bond_2_2_0",
    label: "2 = 2 + 0",
    whole: 2,
    part_a: 2,
    part_b: 0,
    group: "C1.NCOMP.01",
  },

  // whole = 3 (4 mục) — C1.NCOMP.02
  {
    id: "bond_3_0_3",
    label: "3 = 0 + 3",
    whole: 3,
    part_a: 0,
    part_b: 3,
    group: "C1.NCOMP.02",
  },
  {
    id: "bond_3_1_2",
    label: "3 = 1 + 2",
    whole: 3,
    part_a: 1,
    part_b: 2,
    group: "C1.NCOMP.02",
  },
  {
    id: "bond_3_2_1",
    label: "3 = 2 + 1",
    whole: 3,
    part_a: 2,
    part_b: 1,
    group: "C1.NCOMP.02",
  },
  {
    id: "bond_3_3_0",
    label: "3 = 3 + 0",
    whole: 3,
    part_a: 3,
    part_b: 0,
    group: "C1.NCOMP.02",
  },

  // whole = 4 (5 mục) — C1.NCOMP.03
  {
    id: "bond_4_0_4",
    label: "4 = 0 + 4",
    whole: 4,
    part_a: 0,
    part_b: 4,
    group: "C1.NCOMP.03",
  },
  {
    id: "bond_4_1_3",
    label: "4 = 1 + 3",
    whole: 4,
    part_a: 1,
    part_b: 3,
    group: "C1.NCOMP.03",
  },
  {
    id: "bond_4_2_2",
    label: "4 = 2 + 2",
    whole: 4,
    part_a: 2,
    part_b: 2,
    group: "C1.NCOMP.03",
  },
  {
    id: "bond_4_3_1",
    label: "4 = 3 + 1",
    whole: 4,
    part_a: 3,
    part_b: 1,
    group: "C1.NCOMP.03",
  },
  {
    id: "bond_4_4_0",
    label: "4 = 4 + 0",
    whole: 4,
    part_a: 4,
    part_b: 0,
    group: "C1.NCOMP.03",
  },

  // whole = 5 (6 mục) — C1.NCOMP.04
  {
    id: "bond_5_0_5",
    label: "5 = 0 + 5",
    whole: 5,
    part_a: 0,
    part_b: 5,
    group: "C1.NCOMP.04",
  },
  {
    id: "bond_5_1_4",
    label: "5 = 1 + 4",
    whole: 5,
    part_a: 1,
    part_b: 4,
    group: "C1.NCOMP.04",
  },
  {
    id: "bond_5_2_3",
    label: "5 = 2 + 3",
    whole: 5,
    part_a: 2,
    part_b: 3,
    group: "C1.NCOMP.04",
  },
  {
    id: "bond_5_3_2",
    label: "5 = 3 + 2",
    whole: 5,
    part_a: 3,
    part_b: 2,
    group: "C1.NCOMP.04",
  },
  {
    id: "bond_5_4_1",
    label: "5 = 4 + 1",
    whole: 5,
    part_a: 4,
    part_b: 1,
    group: "C1.NCOMP.04",
  },
  {
    id: "bond_5_5_0",
    label: "5 = 5 + 0",
    whole: 5,
    part_a: 5,
    part_b: 0,
    group: "C1.NCOMP.04",
  },

  // whole = 6 (7 mục) — C1.NCOMP.05
  {
    id: "bond_6_0_6",
    label: "6 = 0 + 6",
    whole: 6,
    part_a: 0,
    part_b: 6,
    group: "C1.NCOMP.05",
  },
  {
    id: "bond_6_1_5",
    label: "6 = 1 + 5",
    whole: 6,
    part_a: 1,
    part_b: 5,
    group: "C1.NCOMP.05",
  },
  {
    id: "bond_6_2_4",
    label: "6 = 2 + 4",
    whole: 6,
    part_a: 2,
    part_b: 4,
    group: "C1.NCOMP.05",
  },
  {
    id: "bond_6_3_3",
    label: "6 = 3 + 3",
    whole: 6,
    part_a: 3,
    part_b: 3,
    group: "C1.NCOMP.05",
  },
  {
    id: "bond_6_4_2",
    label: "6 = 4 + 2",
    whole: 6,
    part_a: 4,
    part_b: 2,
    group: "C1.NCOMP.05",
  },
  {
    id: "bond_6_5_1",
    label: "6 = 5 + 1",
    whole: 6,
    part_a: 5,
    part_b: 1,
    group: "C1.NCOMP.05",
  },
  {
    id: "bond_6_6_0",
    label: "6 = 6 + 0",
    whole: 6,
    part_a: 6,
    part_b: 0,
    group: "C1.NCOMP.05",
  },

  // whole = 7 (8 mục) — C1.NCOMP.06
  {
    id: "bond_7_0_7",
    label: "7 = 0 + 7",
    whole: 7,
    part_a: 0,
    part_b: 7,
    group: "C1.NCOMP.06",
  },
  {
    id: "bond_7_1_6",
    label: "7 = 1 + 6",
    whole: 7,
    part_a: 1,
    part_b: 6,
    group: "C1.NCOMP.06",
  },
  {
    id: "bond_7_2_5",
    label: "7 = 2 + 5",
    whole: 7,
    part_a: 2,
    part_b: 5,
    group: "C1.NCOMP.06",
  },
  {
    id: "bond_7_3_4",
    label: "7 = 3 + 4",
    whole: 7,
    part_a: 3,
    part_b: 4,
    group: "C1.NCOMP.06",
  },
  {
    id: "bond_7_4_3",
    label: "7 = 4 + 3",
    whole: 7,
    part_a: 4,
    part_b: 3,
    group: "C1.NCOMP.06",
  },
  {
    id: "bond_7_5_2",
    label: "7 = 5 + 2",
    whole: 7,
    part_a: 5,
    part_b: 2,
    group: "C1.NCOMP.06",
  },
  {
    id: "bond_7_6_1",
    label: "7 = 6 + 1",
    whole: 7,
    part_a: 6,
    part_b: 1,
    group: "C1.NCOMP.06",
  },
  {
    id: "bond_7_7_0",
    label: "7 = 7 + 0",
    whole: 7,
    part_a: 7,
    part_b: 0,
    group: "C1.NCOMP.06",
  },

  // whole = 8 (9 mục) — C1.NCOMP.07
  {
    id: "bond_8_0_8",
    label: "8 = 0 + 8",
    whole: 8,
    part_a: 0,
    part_b: 8,
    group: "C1.NCOMP.07",
  },
  {
    id: "bond_8_1_7",
    label: "8 = 1 + 7",
    whole: 8,
    part_a: 1,
    part_b: 7,
    group: "C1.NCOMP.07",
  },
  {
    id: "bond_8_2_6",
    label: "8 = 2 + 6",
    whole: 8,
    part_a: 2,
    part_b: 6,
    group: "C1.NCOMP.07",
  },
  {
    id: "bond_8_3_5",
    label: "8 = 3 + 5",
    whole: 8,
    part_a: 3,
    part_b: 5,
    group: "C1.NCOMP.07",
  },
  {
    id: "bond_8_4_4",
    label: "8 = 4 + 4",
    whole: 8,
    part_a: 4,
    part_b: 4,
    group: "C1.NCOMP.07",
  },
  {
    id: "bond_8_5_3",
    label: "8 = 5 + 3",
    whole: 8,
    part_a: 5,
    part_b: 3,
    group: "C1.NCOMP.07",
  },
  {
    id: "bond_8_6_2",
    label: "8 = 6 + 2",
    whole: 8,
    part_a: 6,
    part_b: 2,
    group: "C1.NCOMP.07",
  },
  {
    id: "bond_8_7_1",
    label: "8 = 7 + 1",
    whole: 8,
    part_a: 7,
    part_b: 1,
    group: "C1.NCOMP.07",
  },
  {
    id: "bond_8_8_0",
    label: "8 = 8 + 0",
    whole: 8,
    part_a: 8,
    part_b: 0,
    group: "C1.NCOMP.07",
  },

  // whole = 9 (10 mục) — C1.NCOMP.08
  {
    id: "bond_9_0_9",
    label: "9 = 0 + 9",
    whole: 9,
    part_a: 0,
    part_b: 9,
    group: "C1.NCOMP.08",
  },
  {
    id: "bond_9_1_8",
    label: "9 = 1 + 8",
    whole: 9,
    part_a: 1,
    part_b: 8,
    group: "C1.NCOMP.08",
  },
  {
    id: "bond_9_2_7",
    label: "9 = 2 + 7",
    whole: 9,
    part_a: 2,
    part_b: 7,
    group: "C1.NCOMP.08",
  },
  {
    id: "bond_9_3_6",
    label: "9 = 3 + 6",
    whole: 9,
    part_a: 3,
    part_b: 6,
    group: "C1.NCOMP.08",
  },
  {
    id: "bond_9_4_5",
    label: "9 = 4 + 5",
    whole: 9,
    part_a: 4,
    part_b: 5,
    group: "C1.NCOMP.08",
  },
  {
    id: "bond_9_5_4",
    label: "9 = 5 + 4",
    whole: 9,
    part_a: 5,
    part_b: 4,
    group: "C1.NCOMP.08",
  },
  {
    id: "bond_9_6_3",
    label: "9 = 6 + 3",
    whole: 9,
    part_a: 6,
    part_b: 3,
    group: "C1.NCOMP.08",
  },
  {
    id: "bond_9_7_2",
    label: "9 = 7 + 2",
    whole: 9,
    part_a: 7,
    part_b: 2,
    group: "C1.NCOMP.08",
  },
  {
    id: "bond_9_8_1",
    label: "9 = 8 + 1",
    whole: 9,
    part_a: 8,
    part_b: 1,
    group: "C1.NCOMP.08",
  },
  {
    id: "bond_9_9_0",
    label: "9 = 9 + 0",
    whole: 9,
    part_a: 9,
    part_b: 0,
    group: "C1.NCOMP.08",
  },

  // whole = 10 (11 mục) — C1.NCOMP.09
  {
    id: "bond_10_0_10",
    label: "10 = 0 + 10",
    whole: 10,
    part_a: 0,
    part_b: 10,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_1_9",
    label: "10 = 1 + 9",
    whole: 10,
    part_a: 1,
    part_b: 9,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_2_8",
    label: "10 = 2 + 8",
    whole: 10,
    part_a: 2,
    part_b: 8,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_3_7",
    label: "10 = 3 + 7",
    whole: 10,
    part_a: 3,
    part_b: 7,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_4_6",
    label: "10 = 4 + 6",
    whole: 10,
    part_a: 4,
    part_b: 6,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_5_5",
    label: "10 = 5 + 5",
    whole: 10,
    part_a: 5,
    part_b: 5,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_6_4",
    label: "10 = 6 + 4",
    whole: 10,
    part_a: 6,
    part_b: 4,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_7_3",
    label: "10 = 7 + 3",
    whole: 10,
    part_a: 7,
    part_b: 3,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_8_2",
    label: "10 = 8 + 2",
    whole: 10,
    part_a: 8,
    part_b: 2,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_9_1",
    label: "10 = 9 + 1",
    whole: 10,
    part_a: 9,
    part_b: 1,
    group: "C1.NCOMP.09",
  },
  {
    id: "bond_10_10_0",
    label: "10 = 10 + 0",
    whole: 10,
    part_a: 10,
    part_b: 0,
    group: "C1.NCOMP.09",
  },
] as const;
