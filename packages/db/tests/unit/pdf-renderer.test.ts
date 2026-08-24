import { describe, expect, it } from "vitest";
import {
  assertNoChildDataInExport,
  type LessonPlanExportDTO,
  renderLessonPlanPdf,
  toUtf16BeHex,
} from "#src/services/pdf-renderer";

const PAGE_LIMIT_EXCEEDED_REGEX =
  /BR-PDF-05 Violation: Vượt quá giới hạn tối đa 20 trang/;
const BR_PDF_06_VIOLATION_REGEX = /BR-PDF-06 Violation/;

describe("PDF Renderer Unit Tests (BR-PDF-04, 05, 06, 07)", () => {
  const samplePlan: LessonPlanExportDTO = {
    uuid: "11111111-1111-4111-8111-111111111111",
    title: "Bé đếm quả táo và phân loại hình học",
    target_age: 4,
    estimated_minutes: 35,
    notes:
      "Chuẩn bị các thẻ hình quả táo đỏ, xanh và rổ phân loại. Khuyến khích trẻ gọi tên màu sắc.",
    version: 1,
    items: [
      {
        position: 0,
        item_type: "activity",
        item_code: "ACT-COUNT-01",
        custom_instruction: "Cho trẻ đếm lần lượt từng quả táo trên bàn.",
        snapshot: {
          title: "Đếm số lượng quả táo",
          duration_minutes: 15,
          description:
            "Hoạt động khởi động giúp trẻ nhận biết số lượng từ 1 đến 5.",
          instructions:
            "Bước 1: Người dạy đặt 5 quả táo.\nBước 2: Hướng dẫn trẻ chạm tay và đếm 1, 2, 3, 4, 5.\nBước 3: Cho trẻ nhắc lại số lượng tổng.",
          child_prompts: [
            "Con thấy có bao nhiêu quả táo trên bàn?",
            "Nếu cô lấy bớt 1 quả thì còn lại mấy quả nhỉ?",
          ],
          materials: ["5 quả táo nhựa", "Rổ nhựa màu xanh"],
        },
      },
      {
        position: 1,
        item_type: "game_level",
        item_code: "GL-C1-001",
        snapshot: {
          title: "Trò chơi: Thu hoạch táo chín",
          duration_minutes: 10,
          description: "Trẻ thu thập số lượng táo theo yêu cầu của bài toán.",
        },
      },
      {
        position: 2,
        item_type: "custom_note",
        snapshot: {
          title: "Ghi chú tổng kết",
          description:
            "Khen ngợi sự tập trung và khuyến khích trẻ tự dọn đồ dùng.",
        },
      },
    ],
  };

  it("[BR-PDF-07] Nhúng font và mã hóa Unicode hiển thị đúng tiếng Việt có dấu", () => {
    const result = renderLessonPlanPdf(samplePlan);
    expect(result.pdfBuffer).toBeInstanceOf(Buffer);
    expect(result.pdfBuffer.length).toBeGreaterThan(500);

    const pdfString = result.pdfBuffer.toString("binary");
    // Verify standard PDF structure
    expect(pdfString.startsWith("%PDF-1.4")).toBe(true);
    expect(pdfString).toContain("%%EOF");
    expect(pdfString).toContain("/Type /Catalog");
    expect(pdfString).toContain("/Type /Pages");
    expect(pdfString).toContain("/Identity-H");
    expect(pdfString).toContain("ToUnicode");

    // Verify Vietnamese text UTF-16BE hex encoding presence ("Bé đếm quả táo")
    const titleUtf16Hex = toUtf16BeHex("KẾ HOẠCH BÀI DẠY:");
    expect(pdfString).toContain(titleUtf16Hex);
  });

  it("[BR-PDF-04] Watermark chỉ nằm ở chân trang, không che nội dung", () => {
    const result = renderLessonPlanPdf(samplePlan);
    const pdfString = result.pdfBuffer.toString("binary");

    // Check footer watermark coordinates (y = 32..45 pt, strictly at bottom of A4)
    expect(pdfString).toContain("40 45 m 555 45 l S");
    expect(pdfString).toContain("40 32 Td");

    const watermarkHex = toUtf16BeHex(
      "TiniMath — Thư viện tư duy qua trò chơi cho trẻ mầm non"
    );
    expect(pdfString).toContain(watermarkHex);
  });

  it("[BR-PDF-05] Tuân thủ trần số trang (<= 20 trang)", () => {
    const result = renderLessonPlanPdf(samplePlan);
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.pageCount).toBeLessThanOrEqual(20);
  });

  it("[BR-PDF-05] Từ chối và ném lỗi khi tài liệu vượt quá 20 trang", () => {
    // Generate a huge lesson plan with 150 items that exceed 20 pages
    const hugeItems = Array.from({ length: 120 }, (_, i) => ({
      position: i,
      item_type: "activity" as const,
      item_code: `ACT-HUGE-${i}`,
      snapshot: {
        title: `Hoạt động mở rộng số ${i + 1} - Luyện tập tư duy chuyên sâu`,
        duration_minutes: 20,
        description:
          "Hoạt động này yêu cầu nhiều bước thực hiện chi tiết nhằm kéo dài văn bản trang.".repeat(
            5
          ),
        instructions:
          "Bước A: Giới thiệu chi tiết bài học.\nBước B: Thực hành chuyên sâu theo nhóm.\nBước C: Đánh giá và thảo luận mở rộng.\nBước D: Ghi nhận kết quả thực hành.".repeat(
            4
          ),
        child_prompts: [
          "Câu hỏi gợi ý 1 cho trẻ trả lời mở rộng",
          "Câu hỏi gợi ý 2 kiểm tra tư duy phản biện",
        ],
      },
    }));

    const hugePlan: LessonPlanExportDTO = {
      ...samplePlan,
      title: "Giáo án siêu dài kiểm tra trần trang",
      items: hugeItems,
    };

    expect(() => renderLessonPlanPdf(hugePlan, { maxPages: 20 })).toThrow(
      PAGE_LIMIT_EXCEEDED_REGEX
    );
  });

  it("[BR-PDF-06] Kiểm tra chống rò rỉ dữ liệu trẻ (PII & Mastery progress)", () => {
    // Valid clean plan passes
    expect(() =>
      assertNoChildDataInExport(
        samplePlan as unknown as Record<string, unknown>
      )
    ).not.toThrow();

    // Plan containing child_id or child_name must throw
    const dirtyPlanWithChildId = {
      ...samplePlan,
      child_id: 12_345,
    };
    expect(() =>
      assertNoChildDataInExport(
        dirtyPlanWithChildId as unknown as Record<string, unknown>
      )
    ).toThrow(BR_PDF_06_VIOLATION_REGEX);

    const dirtyPlanWithChildProfile = {
      ...samplePlan,
      items: [
        {
          position: 0,
          item_type: "activity" as const,
          snapshot: {
            title: "Hoạt động",
            child_name: "Bé An",
          },
        },
      ],
    };
    expect(() =>
      assertNoChildDataInExport(
        dirtyPlanWithChildProfile as unknown as Record<string, unknown>
      )
    ).toThrow(BR_PDF_06_VIOLATION_REGEX);

    const dirtyPlanWithMasteryState = {
      ...samplePlan,
      snapshot: {
        p_learn: 0.85,
      },
    };
    expect(() =>
      assertNoChildDataInExport(
        dirtyPlanWithMasteryState as unknown as Record<string, unknown>
      )
    ).toThrow(BR_PDF_06_VIOLATION_REGEX);
  });
});
