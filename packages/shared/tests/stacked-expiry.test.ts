import { describe, expect, it } from "vitest";
import { activeStackBase, computeStackedExpiryDate } from "#src/vietqr";

const NOW = new Date("2026-08-15T00:00:00Z");
const DAY = 86_400_000;
const daysFromNow = (d: Date | null): number | null =>
  d === null ? null : Math.round((d.getTime() - NOW.getTime()) / DAY);

describe("computeStackedExpiryDate (UC-039 BR-007, UC-038 BR-014)", () => {
  it("vĩnh viễn + gói có hạn: giữ vĩnh viễn (null)", () => {
    expect(computeStackedExpiryDate(null, 365, 30, NOW)).toBeNull();
  });

  it("vĩnh viễn + gói vĩnh viễn: vẫn null", () => {
    expect(computeStackedExpiryDate(null, null, 0, NOW)).toBeNull();
  });

  it("có hạn còn 50 ngày + 100 ngày: 150 ngày", () => {
    const existing = new Date(NOW.getTime() + 50 * DAY);
    expect(daysFromNow(computeStackedExpiryDate(existing, 100, 0, NOW))).toBe(
      150
    );
  });

  it("có hạn + bonus: cộng cả bonus", () => {
    const existing = new Date(NOW.getTime() + 10 * DAY);
    expect(daysFromNow(computeStackedExpiryDate(existing, 30, 5, NOW))).toBe(
      45
    );
  });

  it("có hạn + gói vĩnh viễn: nâng lên vĩnh viễn", () => {
    const existing = new Date(NOW.getTime() + 10 * DAY);
    expect(computeStackedExpiryDate(existing, null, 0, NOW)).toBeNull();
  });

  it("đã hết hạn + gói mới: tính từ bây giờ", () => {
    const expired = new Date(NOW.getTime() - 20 * DAY);
    expect(daysFromNow(computeStackedExpiryDate(expired, 30, 0, NOW))).toBe(30);
  });

  it("chưa có quyền (undefined) + gói có hạn: tính từ bây giờ", () => {
    expect(daysFromNow(computeStackedExpiryDate(undefined, 365, 0, NOW))).toBe(
      365
    );
  });

  it("ngày hỏng: coi như không có hạn cũ", () => {
    expect(daysFromNow(computeStackedExpiryDate("rác", 30, 0, NOW))).toBe(30);
  });
});

describe("activeStackBase", () => {
  it("chỉ bản ghi active mới được cộng dồn; vĩnh viễn đã huỷ không giữ null", () => {
    expect(activeStackBase({ status: "active", expiresAt: null })).toBeNull();
    expect(
      activeStackBase({ status: "cancelled", expiresAt: null })
    ).toBeUndefined();
    expect(activeStackBase(undefined)).toBeUndefined();
    expect(
      computeStackedExpiryDate(
        activeStackBase({ status: "cancelled", expiresAt: null }),
        30,
        0,
        NOW
      )?.toISOString()
    ).toBe("2026-09-14T00:00:00.000Z");
  });
});
