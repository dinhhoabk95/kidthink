import { describe, expect, it } from "vitest";
import { SearchParamsSchema } from "#src/services/content-search";

/**
 * `GAME-CATALOG-PUBLIC` §7.1 — bộ lọc lứa tuổi đi theo band.
 *
 * `SearchParamsSchema` là `z.object` không `strict`, nên một tham số chưa khai
 * bị **loại trong im lặng**: trang chủ trỏ `/games?age_band=4-5` suốt nhiều
 * tháng và danh mục trả cả 239 level thay vì 84, không lỗi, không cảnh báo.
 * Test này khoá đúng cái im lặng đó.
 */
describe("SearchParamsSchema — age_band (GAME-CATALOG-PUBLIC §7.1)", () => {
  it("giữ lại ba band hợp lệ", () => {
    for (const band of ["3-4", "4-5", "5-6"]) {
      expect(SearchParamsSchema.parse({ age_band: band }).age_band).toBe(band);
    }
  });

  it("từ chối band không thuộc dải mầm non", () => {
    expect(() => SearchParamsSchema.parse({ age_band: "3-6" })).toThrow();
    expect(() => SearchParamsSchema.parse({ age_band: "4" })).toThrow();
  });

  it("`age` và `age_band` là hai câu hỏi khác nhau, cùng tồn tại được", () => {
    const parsed = SearchParamsSchema.parse({ age: "4", age_band: "4-5" });

    expect(parsed.age).toBe(4);
    expect(parsed.age_band).toBe("4-5");
  });

  it("tham số chưa khai vẫn bị loại trong im lặng — lý do cần test này", () => {
    const parsed = SearchParamsSchema.parse({ age_group: "4-5" });

    expect("age_group" in parsed).toBe(false);
  });
});
