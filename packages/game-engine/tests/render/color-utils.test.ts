import { describe, expect, it } from "vitest";
import { alpha } from "#src/render/color-utils";

describe("alpha()", () => {
  it("chuyển #rrggbb sang rgba", () => {
    expect(alpha("#38bdf8", 0.5)).toBe("rgba(56, 189, 248, 0.5)");
  });

  it("mở rộng dạng rút gọn #rgb", () => {
    expect(alpha("#fff", 0.25)).toBe("rgba(255, 255, 255, 0.25)");
  });

  it("kẹp độ mờ vào [0, 1]", () => {
    expect(alpha("#000000", 2)).toBe("rgba(0, 0, 0, 1)");
    expect(alpha("#000000", -1)).toBe("rgba(0, 0, 0, 0)");
  });

  it("từ chối chuỗi không phải hex thay vì trả rgba(NaN)", () => {
    expect(() => alpha("rgb(1, 2, 3)", 0.5)).toThrow();
    expect(() => alpha("#11223344", 0.5)).toThrow();
    expect(() => alpha("#zzz", 0.5)).toThrow();
  });
});
