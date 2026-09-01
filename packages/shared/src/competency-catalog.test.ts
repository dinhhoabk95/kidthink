import { describe, expect, it } from "vitest";
import {
  COMPETENCY_CATALOG,
  COMPETENCY_TIERS,
  findCompetency,
} from "./competency-catalog.ts";

/**
 * Nguồn duy nhất cho sáu năng lực.
 *
 * Trước task 165 repo có sáu bảng nhãn viết tay mang hai bộ từ vựng khác nhau,
 * cả hai là taxonomy toán v1 đã bỏ. Test này khoá **hình dạng** của nguồn;
 * cổng `apps/web/tests/gates/public-competency-labels.ts` khoá việc không ai
 * chép tay lại.
 */
describe("COMPETENCY_CATALOG — nguồn duy nhất của tầng L1", () => {
  it("đúng sáu mục, mã C1..C6 theo thứ tự", () => {
    expect(COMPETENCY_CATALOG.map((entry) => entry.code)).toEqual([
      "C1",
      "C2",
      "C3",
      "C4",
      "C5",
      "C6",
    ]);
  });

  it("khớp docs/taxonomy/index.md", () => {
    expect(COMPETENCY_CATALOG.map((entry) => entry.name)).toEqual([
      "Tư duy toán học",
      "Tư duy không gian",
      "Tư duy logic",
      "Tư duy quan sát",
      "Tư duy ngôn ngữ",
      "Chức năng điều hành",
    ]);
  });

  it("mỗi năng lực một emoji riêng", () => {
    const emojis = COMPETENCY_CATALOG.map((entry) => entry.emoji);

    expect(new Set(emojis).size).toBe(emojis.length);
  });

  it("BR-LND-06 — mô tả không hứa kết quả học tập", () => {
    const banned = ["thông minh hơn", "tăng iq", "vượt trội", "giỏi hơn"];

    for (const entry of COMPETENCY_CATALOG) {
      const text = `${entry.tagline} ${entry.short}`.toLowerCase();
      for (const claim of banned) {
        expect(text).not.toContain(claim);
      }
    }
  });

  it("COMPETENCY_TIERS bỏ phần trình bày, giữ nguyên mã và tên", () => {
    expect(COMPETENCY_TIERS).toHaveLength(6);
    expect(Object.keys(COMPETENCY_TIERS[0] ?? {}).sort()).toEqual([
      "code",
      "description",
      "name",
    ]);
  });

  it("findCompetency trả undefined cho mã ngoài C1–C6", () => {
    expect(findCompetency("C1")?.name).toBe("Tư duy toán học");
    expect(findCompetency("C7")).toBeUndefined();
  });
});
