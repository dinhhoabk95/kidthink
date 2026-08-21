import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { lintEmailContentText, runEmailContentGate } from "./email-content.ts";

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
    // Mẫu vi phạm nằm trong fixture, ❌ NEVER viết thẳng vào file test: nhãn
    // vai trò ngoài đời xuất hiện trong nguồn dưới apps/ sẽ làm cổng
    // BR-GLOS-04 (lint:user-vocabulary) đỏ.
    const dirtyTemplate = readFileSync(
      resolve(import.meta.dirname, "fixtures/email-content/birth-year.txt"),
      "utf8"
    );
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

describe("Cổng lint:email trên template thật (BR-NOT-03, BR-NOT-07, BR-NOT-08)", () => {
  it("apps/web/server/templates không vi phạm luật nội dung email", () => {
    expect(runEmailContentGate()).toEqual([]);
  });
});
