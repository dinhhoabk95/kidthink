import { seoPageTypeEnum } from "@mindkid/db";
import { FAQ_ITEMS } from "@mindkid/shared";
import { describe, expect, it } from "vitest";
import {
  type FaqRowStore,
  listPublishedFaqItems,
  normalizeFaqItems,
  toFaqAnchor,
} from "#server/services/faq-service";

function createFakeDb(
  rows: readonly {
    readonly faqItems: readonly Record<string, string>[];
  }[]
): FaqRowStore {
  return {
    fetchFaqRows: () => Promise.resolve(rows),
  };
}

describe("FAQ Service & Schema Invariants (BR-FAQ-01..06)", () => {
  it("BR-FAQ-04: seo_page_type enum trong schema chứa giá trị 'faq'", () => {
    expect(seoPageTypeEnum.enumValues).toContain("faq");
  });

  it("BR-FAQ-04: listPublishedFaqItems trả về nội dung từ seo_pages khi có hàng faq published", async () => {
    const fakeDb = createFakeDb([
      {
        faqItems: [
          {
            id: "faq-cms-01",
            anchor: "cau-hoi-cms-01",
            category: "product",
            question: "MindKid có hỗ trợ máy tính bảng không?",
            answer:
              "Có, MindKid tương thích tốt với máy tính bảng và điện thoại.",
          },
          {
            q: "Chính sách bảo vệ dữ liệu trẻ em ở đâu?",
            a: "Xem chi tiết tại trang chính sách bảo vệ dữ liệu trẻ em.",
            category: "privacy",
            legal_link: "/child-privacy",
          },
        ],
      },
    ]);

    const items = await listPublishedFaqItems(fakeDb);
    expect(items).toHaveLength(2);
    expect(items[0]?.id).toBe("faq-cms-01");
    expect(items[0]?.anchor).toBe("cau-hoi-cms-01");
    expect(items[0]?.question).toBe("MindKid có hỗ trợ máy tính bảng không?");
    expect(items[1]?.category).toBe("privacy");
    expect(items[1]?.legalLink).toBe("/child-privacy");
    expect(items[1]?.anchor).toBe(
      toFaqAnchor("Chính sách bảo vệ dữ liệu trẻ em ở đâu?", 1)
    );
  });

  it("BR-FAQ-04: listPublishedFaqItems fallback an toàn về FAQ_ITEMS khi DB chưa có hàng faq hoặc rỗng", async () => {
    const emptyDb = createFakeDb([]);
    const fallbackFromEmpty = await listPublishedFaqItems(emptyDb);
    expect(fallbackFromEmpty).toEqual([...FAQ_ITEMS]);

    const blankItemsDb = createFakeDb([{ faqItems: [] }]);
    const fallbackFromBlank = await listPublishedFaqItems(blankItemsDb);
    expect(fallbackFromBlank).toEqual([...FAQ_ITEMS]);
  });

  it("BR-FAQ-01..06: normalizeFaqItems bỏ qua mục thiếu câu hỏi/trả lời và giữ nguyên liên kết pháp lý", () => {
    const normalized = normalizeFaqItems([
      { q: "", a: "Thiếu câu hỏi" },
      { q: "Thiếu câu trả lời", a: "   " },
      {
        q: "MindKid có chính sách hoàn tiền không?",
        a: "Có, hỗ trợ hoàn tiền qua kênh CSKH chính thức.",
      },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.anchor).toBe("chinh-sach-hoan-tien");
    expect(normalized[0]?.category).toBe("billing");
    expect(normalized[0]?.legalLink).toBe("/refund-policy");
  });
});
