import { describe, expect, it } from "vitest";
import template from "#src/templates/GT-019/template";

/**
 * Task #313 — GT-019: `rotation_step` là hằng 90 của `BR-E019-01`, khoá ở schema
 * để không có độ khó nào khai một giá trị mà runtime bỏ qua.
 */
const BASE = { allow_flip: false, hint_after_ms: 8000, allow_retry: true };

describe("GT-019 — rotation_step chỉ nhận 90 (BR-E019-01)", () => {
  it("90 hợp lệ", () => {
    expect(
      template.difficulty_contract.safeParse({ ...BASE, rotation_step: 90 })
        .success
    ).toBe(true);
  });

  it("thiếu thì mặc định 90", () => {
    const parsed = template.difficulty_contract.safeParse(BASE);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data.rotation_step).toBe(90);
  });

  it("giá trị khác 90 bị từ chối", () => {
    for (const step of [0, 15, 45, 180]) {
      expect(
        template.difficulty_contract.safeParse({ ...BASE, rotation_step: step })
          .success
      ).toBe(false);
    }
  });
});
