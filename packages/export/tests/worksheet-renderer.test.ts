import { describe, expect, it } from "vitest";
import {
  computeWorksheetRenderHash,
  inspectWorksheetPdf,
  renderWorksheetPdf,
} from "../src/index.js";

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

describe("Pure TypeScript Vector Worksheet PDF Renderer (BR-WSM-01..08)", () => {
  const sampleBlocks = {
    pattern_coloring: {
      template: "pattern_coloring",
      rule_sequence: ["circle", "triangle"],
      rows: [
        {
          row_id: "r1",
          items: [
            { id: "1", shape: "circle", is_blank: false, size_mm: 25 },
            { id: "2", shape: "triangle", is_blank: false, size_mm: 25 },
            { id: "3", shape: "circle", is_blank: true, size_mm: 25 },
            { id: "4", shape: "triangle", is_blank: true, size_mm: 25 },
          ],
        },
      ],
      stroke_pt: 2.5,
    },
    pair_matching: {
      template: "pair_matching",
      left_column: [
        { id: "L1", shape: "circle", size_mm: 25 },
        { id: "L2", shape: "square", size_mm: 25 },
      ],
      right_column: [
        { id: "R1", shape: "circle", size_mm: 25 },
        { id: "R2", shape: "square", size_mm: 25 },
      ],
      correct_pairs: [
        { left_id: "L1", right_id: "R1" },
        { left_id: "L2", right_id: "R2" },
      ],
      stroke_pt: 2.0,
    },
    group_circling: {
      template: "group_circling",
      visual_target_symbol: "star",
      items: [
        {
          id: "1",
          item_type: "star",
          is_target: true,
          pos_x_pct: 20,
          pos_y_pct: 30,
          size_mm: 22,
        },
        {
          id: "2",
          item_type: "circle",
          is_target: false,
          pos_x_pct: 60,
          pos_y_pct: 40,
          size_mm: 22,
        },
        {
          id: "3",
          item_type: "star",
          is_target: true,
          pos_x_pct: 80,
          pos_y_pct: 70,
          size_mm: 22,
        },
      ],
      target_count: 2,
      stroke_pt: 2.0,
    },
    shape_completion: {
      template: "shape_completion",
      items: [
        {
          id: "1",
          base_shape: "circle",
          missing_part: "half",
          dash_stroke_pt: 2.0,
          size_mm: 35,
        },
        {
          id: "2",
          base_shape: "square",
          missing_part: "outline_dash",
          dash_stroke_pt: 2.0,
          size_mm: 35,
        },
      ],
      stroke_pt: 2.0,
    },
    count_and_color: {
      template: "count_and_color",
      groups: [
        {
          id: "g1",
          item_symbol: "star",
          item_count: 4,
          max_boxes: 5,
          box_size_mm: 20,
        },
      ],
      stroke_pt: 2.0,
    },
    spot_differences: {
      template: "spot_differences",
      scene_theme: "farm",
      differences_count: 3,
      spots: [
        {
          spot_id: "s1",
          x_pct: 25,
          y_pct: 30,
          radius_mm: 12,
          description_adult: "Thiếu mào gà",
        },
        {
          spot_id: "s2",
          x_pct: 70,
          y_pct: 50,
          radius_mm: 12,
          description_adult: "Ngôi sao trên mái",
        },
        {
          spot_id: "s3",
          x_pct: 45,
          y_pct: 80,
          radius_mm: 12,
          description_adult: "Bụi cỏ",
        },
      ],
      stroke_pt: 2.0,
    },
  };

  const adultInstructions =
    "Hướng dẫn người lớn: Cho trẻ quan sát kỹ hình mẫu và dùng bút sáp tô màu theo đúng quy luật hình tròn - hình tam giác.";

  it("D-P4J: computeWorksheetRenderHash tính hash thuần nhất và nhạy bén với thay đổi", () => {
    const hash1 = computeWorksheetRenderHash(
      sampleBlocks.pattern_coloring,
      adultInstructions
    );
    const hash2 = computeWorksheetRenderHash(
      sampleBlocks.pattern_coloring,
      adultInstructions
    );
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(SHA256_HEX_REGEX);

    const hashDiff = computeWorksheetRenderHash(
      sampleBlocks.pattern_coloring,
      "Hướng dẫn người lớn đã bị sửa đổi"
    );
    expect(hashDiff).not.toBe(hash1);
  });

  it("render thành công cả 6 layout template thành vector PDF 1 trang A4 in đen trắng", () => {
    const templates = Object.keys(
      sampleBlocks
    ) as (keyof typeof sampleBlocks)[];

    for (const tmpl of templates) {
      const result = renderWorksheetPdf({
        code: `WS-000${templates.indexOf(tmpl) + 1}`,
        version: 1,
        title: `Phiếu bài tập ${tmpl}`,
        layout_template: tmpl,
        content_blocks: sampleBlocks[tmpl],
        instructions: adultInstructions,
      });

      expect(result.pdfBuffer).toBeInstanceOf(Buffer);
      expect(result.pageCount).toBe(1);
      expect(result.grayscalePassed).toBe(true);
      expect(result.minStrokePt).toBeGreaterThanOrEqual(2.0);
      expect(result.minAreaMm).toBeGreaterThanOrEqual(20.0);

      // Inspect physical artifact
      const inspection = inspectWorksheetPdf(result.pdfBuffer);
      expect(inspection.valid).toBe(true);
      expect(inspection.isSinglePageA4).toBe(true);
      expect(inspection.isGrayscale).toBe(true);
      expect(inspection.hasAdultGuidanceFooter).toBe(true);
      expect(inspection.watermarkInFooterOnly).toBe(true);
      expect(inspection.errors).toEqual([]);
    }
  });

  it("BR-WSM-03: inspectWorksheetPdf phát hiện vi phạm nếu PDF nhiều hơn 1 trang", () => {
    const multiPagePdfBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Pages /Count 2 /MediaBox [0 0 595.28 841.89] >>\nendobj\n",
      "binary"
    );
    const inspection = inspectWorksheetPdf(multiPagePdfBuffer);
    expect(inspection.valid).toBe(false);
    expect(inspection.isSinglePageA4).toBe(false);
    expect(inspection.errors.some((e: string) => e.includes("BR-WSM-03"))).toBe(
      true
    );
  });

  it("BR-WSM-01: inspectWorksheetPdf phát hiện vi phạm nếu PDF chứa màu sắc chói (RGB chromatic)", () => {
    const coloredPdfBuffer = Buffer.from(
      "%PDF-1.4\n1 0 obj\n<< /Type /Pages /Count 1 /MediaBox [0 0 595.28 841.89] >>\nendobj\nstream\n1 0 0 rg\nendstream\n",
      "binary"
    );
    const inspection = inspectWorksheetPdf(coloredPdfBuffer);
    expect(inspection.valid).toBe(false);
    expect(inspection.isGrayscale).toBe(false);
    expect(inspection.errors.some((e: string) => e.includes("BR-WSM-01"))).toBe(
      true
    );
  });
});
