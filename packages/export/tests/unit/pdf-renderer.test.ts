import { describe, expect, it } from "vitest";
import {
  buildCidWidthArray,
  buildEmbeddedTrueTypeSubsetFont,
  buildVietnameseToUnicodeCMap,
  extractTextFromPdf,
  renderLessonPlanPdf,
} from "#src/index";

describe("PDF Vietnamese TrueType Subset Font & ToUnicode CMap (BR-PDF-07)", () => {
  it("buildEmbeddedTrueTypeSubsetFont tạo bảng sfnt TrueType hợp lệ dưới 2MB", () => {
    const regularFont = buildEmbeddedTrueTypeSubsetFont(false);
    const boldFont = buildEmbeddedTrueTypeSubsetFont(true);

    expect(regularFont.readUInt32BE(0)).toBe(0x00_01_00_00);
    expect(boldFont.readUInt32BE(0)).toBe(0x00_01_00_00);
    expect(regularFont.length).toBeLessThan(512 * 1024);

    const ascii = regularFont.toString("latin1");
    expect(ascii).toContain("OS/2");
    expect(ascii).toContain("cmap");
    expect(ascii).toContain("glyf");
    expect(ascii).toContain("head");
    expect(ascii).toContain("hhea");
    expect(ascii).toContain("hmtx");
    expect(ascii).toContain("loca");
    expect(ascii).toContain("maxp");
    expect(ascii).toContain("name");
    expect(ascii).toContain("post");
  });

  it("buildCidWidthArray và buildVietnameseToUnicodeCMap ánh xạ đầy đủ dấu tiếng Việt", () => {
    const widths = buildCidWidthArray(false);
    expect(widths).toContain("7840 7929");

    const cmap = buildVietnameseToUnicodeCMap(["Bé học đếm quả táo"]);
    expect(cmap).toContain("<1EA0> <1EF9> <1EA0>");
    expect(cmap).toContain("beginbfchar");
    expect(cmap).toContain("<0111> <0111>");
    expect(cmap).toContain("<1EBF> <1EBF>");
  });

  it("extractTextFromPdf trích xuất chính xác chuỗi 'Bé học đếm' và 'Bé đếm quả táo'", () => {
    const rendered = renderLessonPlanPdf({
      title: "Bé học đếm",
      items: [
        {
          position: 0,
          item_type: "game_level",
          snapshot: {
            title: "Bé đếm quả táo",
            description: "Hoạt động đếm từ 1 đến 5 cùng cô giáo.",
          },
        },
      ],
    });

    const text = extractTextFromPdf(rendered.pdfBuffer);
    expect(text).toContain("BÉ HỌC ĐẾM");
    expect(text).toContain("Bé đếm quả táo");
    expect(text).toContain("Hoạt động đếm từ 1 đến 5 cùng cô giáo.");
  });
});
