import type { GT033Content, GT033Difficulty } from "./template.js";

export interface GT033Fixture {
  name: string;
  band?: string;
  content: GT033Content;
  difficulty: GT033Difficulty;
}

export const GT033_FIXTURES: GT033Fixture[] = [
  {
    name: "Dệt hoa văn lưới 2x2 đơn giản",
    band: "5-6",
    content: {
      prompt: "Bé chọn sợi len màu phù hợp để dệt vào ô trống nhé!",
      grid: { rows: 2, cols: 2 },
      palette: [
        {
          color_id: "red",
          asset: { kind: "emoji", ref: "EMJ-yarn" },
          name_vi: "Đỏ",
        },
        {
          color_id: "blue",
          asset: { kind: "emoji", ref: "EMJ-yarn" },
          name_vi: "Xanh dương",
        },
      ],
      cells: ["red", "blue", "blue", null],
      solution: ["red", "blue", "blue", "red"],
      row_rule: "Đỏ xen kẽ Xanh",
      col_rule: "Đỏ xen kẽ Xanh",
    },
    difficulty: {
      grid_size: 2,
      color_count: 2,
      blank_count: 1,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
  {
    name: "Dệt hoa văn lưới 3x3 dịch chuyển 3 màu",
    band: "5-6",
    content: {
      prompt: "Bé hãy dệt hoàn thiện tấm thảm hoa văn 3x3 nhé!",
      grid: { rows: 3, cols: 3 },
      palette: [
        {
          color_id: "red",
          asset: { kind: "emoji", ref: "EMJ-yarn" },
          name_vi: "Đỏ",
        },
        {
          color_id: "yellow",
          asset: { kind: "emoji", ref: "EMJ-yarn" },
          name_vi: "Vàng",
        },
        {
          color_id: "blue",
          asset: { kind: "emoji", ref: "EMJ-yarn" },
          name_vi: "Xanh",
        },
      ],
      // Row 1: R Y B, Row 2: Y B R, Row 3: B R Y (Latin square / shift pattern)
      cells: [
        "red",
        "yellow",
        "blue",
        "yellow",
        null,
        "red",
        "blue",
        "red",
        null,
      ],
      solution: [
        "red",
        "yellow",
        "blue",
        "yellow",
        "blue",
        "red",
        "blue",
        "red",
        "yellow",
      ],
      row_rule: "Dịch chuyển tuần hoàn 3 màu",
      col_rule: "Dịch chuyển tuần hoàn 3 màu",
    },
    difficulty: {
      grid_size: 3,
      color_count: 3,
      blank_count: 2,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
  {
    name: "Dệt hoa văn lưới 3x3 ca rô",
    band: "5-6",
    content: {
      prompt: "Bé chọn màu sắc đúng để hoàn thành tấm vải dệt nhé!",
      grid: { rows: 3, cols: 3 },
      palette: [
        {
          color_id: "mint",
          asset: { kind: "emoji", ref: "EMJ-yarn" },
          name_vi: "Xanh ngọc",
        },
        {
          color_id: "berry",
          asset: { kind: "emoji", ref: "EMJ-yarn" },
          name_vi: "Hồng đào",
        },
      ],
      // Checkerboard 3x3: M B M / B M B / M B M
      cells: [
        "mint",
        "berry",
        null,
        null,
        "mint",
        "berry",
        "mint",
        null,
        "mint",
      ],
      solution: [
        "mint",
        "berry",
        "mint",
        "berry",
        "mint",
        "berry",
        "mint",
        "berry",
        "mint",
      ],
      row_rule: "Xen kẽ 2 màu",
      col_rule: "Xen kẽ 2 màu",
    },
    difficulty: {
      grid_size: 3,
      color_count: 2,
      blank_count: 3,
      allow_retry: true,
      hint_after_ms: 8000,
    },
  },
];
