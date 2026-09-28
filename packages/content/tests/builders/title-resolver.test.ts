import { describe, expect, it } from "vitest";
import {
  numberDuplicateTitles,
  resolveLevelTitle,
} from "#src/builders/title-resolver";

const UNKNOWN_THEME_REGEX = /unknown_theme/;

describe("resolveLevelTitle — Chuẩn hóa tiêu đề trò chơi theo chủ đề GDMN", () => {
  it("tự nhiên hóa kỹ năng Đếm đồ vật theo đối tượng chủ đề", () => {
    expect(resolveLevelTitle("Đếm đồ vật", "farm")).toBe(
      "Đếm con vật nông trại"
    );
    expect(resolveLevelTitle("Đếm đồ vật", "food")).toBe("Đếm các loại quả");
    expect(resolveLevelTitle("Đếm đồ vật", "vehicle")).toBe(
      "Đếm phương tiện giao thông"
    );
    expect(resolveLevelTitle("Đếm đồ vật", "school")).toBe(
      "Đếm đồ dùng học tập"
    );
    expect(resolveLevelTitle("Đếm đồ vật", "home")).toBe(
      "Đếm đồ dùng gia đình"
    );
    expect(resolveLevelTitle("Đếm đồ vật", "animal")).toBe(
      "Đếm các loài động vật"
    );
    expect(resolveLevelTitle("Đếm đồ vật", "ocean")).toBe("Đếm sinh vật biển");
    expect(resolveLevelTitle("Đếm đồ vật", "nature")).toBe(
      "Đếm hoa lá thiên nhiên"
    );
  });

  it("thay thế cụm 'bằng đồ vật' thành đối tượng chủ đề tự nhiên", () => {
    expect(resolveLevelTitle("Cộng bằng đồ vật", "farm")).toBe(
      "Cộng con vật nông trại"
    );
    expect(resolveLevelTitle("Cộng bằng đồ vật", "food")).toBe(
      "Cộng các loại quả"
    );
  });

  it("gắn đối tượng cho các kỹ năng so sánh thuộc tính", () => {
    expect(resolveLevelTitle("So sánh to - nhỏ", "animal")).toBe(
      "So sánh to - nhỏ các loài động vật"
    );
    expect(resolveLevelTitle("So sánh dài - ngắn", "food")).toBe(
      "So sánh dài - ngắn các loại quả"
    );
  });

  it("gắn nhãn chủ đề cho các kỹ năng so sánh đơn giản và phân loại", () => {
    expect(resolveLevelTitle("Lớn hơn", "farm")).toBe("Lớn hơn: Nông trại");
    expect(resolveLevelTitle("Phân loại theo màu sắc", "food")).toBe(
      "Phân loại theo màu sắc: Hoa quả"
    );
  });

  it("gắn nhãn chủ đề cho các kỹ năng tư duy trừu tượng", () => {
    expect(resolveLevelTitle("Quy luật ABAB", "garden")).toBe(
      "Quy luật ABAB — Vườn cây"
    );
    expect(resolveLevelTitle("Hình tròn, hình vuông", "home")).toBe(
      "Hình tròn, hình vuông — Gia đình"
    );
  });

  // Ca âm BR-SDS-16: theme không có nhãn phải ném, không lùi về tên kỹ năng trần
  it("ném lỗi khi theme không có trong bảng nhãn", () => {
    expect(() => resolveLevelTitle("Đếm đồ vật", "unknown_theme")).toThrow(
      UNKNOWN_THEME_REGEX
    );
  });
});

describe("numberDuplicateTitles — tên duy nhất trong một kỹ năng (BR-SDS-16)", () => {
  it("giữ nguyên tên không trùng", () => {
    expect(numberDuplicateTitles(["A", "B"])).toEqual(["A", "B"]);
  });

  it("đánh số ' · Bài N' theo thứ tự cho các tên trùng", () => {
    expect(numberDuplicateTitles(["A", "B", "A", "A"])).toEqual([
      "A · Bài 1",
      "B",
      "A · Bài 2",
      "A · Bài 3",
    ]);
  });
});
