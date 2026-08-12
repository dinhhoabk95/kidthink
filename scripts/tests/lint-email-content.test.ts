import { describe, expect, it } from "vitest";
import { lintEmailContentText } from "../lint-email-content.js";

describe("Email Content Linter (Task 5 / BR-NOT-03, BR-NOT-07, BR-NOT-08)", () => {
  it("passes clean template with display_name and unsubscribe link", () => {
    const cleanTemplate = `
      <h1>Báo cáo tuần của {{display_name}}</h1>
      <p>Bé đã hoàn thành 5 bài học tuần này.</p>
      <a href="https://example.com/unsubscribe">unsubscribe</a>
    `;
    const violations = lintEmailContentText(cleanTemplate, "clean.html", true);
    expect(violations).toHaveLength(0);
  });

  it("Ca âm BR-NOT-03: template with birth_year triggers RED violation", () => {
    const dirtyTemplate = `
      <h1>Xin chào phụ huynh</h1>
      <p>Năm sinh của bé: {{birth_year}}</p>
      <a href="/unsubscribe">unsubscribe</a>
    `;
    const violations = lintEmailContentText(dirtyTemplate, "dirty.html", true);
    expect(violations.some((v) => v.message.includes("BR-NOT-03"))).toBe(true);
  });

  it("Ca âm BR-NOT-08: template with tracking pixel triggers RED violation", () => {
    const pixelTemplate = `
      <h1>Thông báo đơn hàng</h1>
      <img src="https://tracker.com/pixel.gif" width="1" height="1" alt="" />
    `;
    const violations = lintEmailContentText(pixelTemplate, "pixel.html", false);
    expect(violations.some((v) => v.message.includes("BR-NOT-08"))).toBe(true);
  });

  it("Ca âm BR-NOT-07: periodic email missing unsubscribe link triggers RED violation", () => {
    const noUnsubTemplate = `
      <h1>Báo cáo tuần</h1>
      <p>Bé đã học xong.</p>
    `;
    const violations = lintEmailContentText(
      noUnsubTemplate,
      "weekly.html",
      true
    );
    expect(violations.some((v) => v.message.includes("BR-NOT-07"))).toBe(true);
  });

  it("Ca âm §7.3: pressuring marketing phrase triggers RED violation", () => {
    const pressuringTemplate = `
      <h1>Giảm giá 50% mua ngay đừng bỏ lỡ</h1>
    `;
    const violations = lintEmailContentText(
      pressuringTemplate,
      "promo.html",
      false
    );
    expect(violations.some((v) => v.message.includes("§7.3 violation"))).toBe(
      true
    );
  });
});
