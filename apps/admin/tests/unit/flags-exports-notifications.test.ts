import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("P2.9 Admin Screens (BR-FLG, BR-FFA, BR-EXP, BR-NTA)", () => {
  const flagsPageContent = readFileSync(
    join(import.meta.dirname, "../../app/pages/flags/index.vue"),
    "utf-8"
  );
  const exportsPageContent = readFileSync(
    join(import.meta.dirname, "../../app/pages/exports/index.vue"),
    "utf-8"
  );
  const notificationsPageContent = readFileSync(
    join(import.meta.dirname, "../../app/pages/notifications/index.vue"),
    "utf-8"
  );

  it("Scenario: D-IW — all three pages declare manager layout", () => {
    expect(flagsPageContent).toContain('layout: "manager"');
    expect(exportsPageContent).toContain('layout: "manager"');
    expect(notificationsPageContent).toContain('layout: "manager"');
  });

  describe("Feature Flags Page (/flags)", () => {
    it("Scenario: BR-FFA-01 — modal requires reason >= 10 chars to confirm toggle", () => {
      expect(flagsPageContent).toContain("changeReason.trim().length < 10");
      expect(flagsPageContent).toContain("BR-FFA-01");
    });

    it("Scenario: BR-FFA-02 & BR-FFA-04 — displays expired flag badge and orphan flag badge", () => {
      expect(flagsPageContent).toContain("flag.is_expired");
      expect(flagsPageContent).toContain("flag.is_orphan");
      expect(flagsPageContent).toContain("Quá hạn");
      expect(flagsPageContent).toContain("Cờ mồ côi");
    });

    it("Scenario: BR-FFA-05 — displays safe default value alongside current state", () => {
      expect(flagsPageContent).toContain("Mặc định an toàn:");
      expect(flagsPageContent).toContain("flag.default_value");
    });
  });

  describe("Data Export Page (/exports)", () => {
    it("Scenario: BR-EXP-01 — presents 6 closed export kinds", () => {
      expect(exportsPageContent).toContain("revenue");
      expect(exportsPageContent).toContain("subscriptions");
      expect(exportsPageContent).toContain("content_kpi");
      expect(exportsPageContent).toContain("skill_coverage");
      expect(exportsPageContent).toContain("curriculum_health");
      expect(exportsPageContent).toContain("audit");
    });

    it("Scenario: BR-EXP-03 — export confirmation modal requires reason >= 10 chars", () => {
      expect(exportsPageContent).toContain("exportReason.trim().length < 10");
      expect(exportsPageContent).toContain("Lý do xuất dữ liệu *");
    });

    it("Scenario: BR-EXP-04 — notes 15-minute signed URL validity", () => {
      expect(exportsPageContent).toContain("15 phút");
    });
  });

  describe("Notifications Page (/notifications)", () => {
    it("Scenario: Tabs between delivery logs and notification templates", () => {
      expect(notificationsPageContent).toContain("Nhật ký chuyển phát");
      expect(notificationsPageContent).toContain("Mẫu thông báo (Templates)");
    });

    it("Scenario: BR-NTA-01 — provides resend button for failed notifications", () => {
      expect(notificationsPageContent).toContain("resendNotification");
      expect(notificationsPageContent).toContain("Gửi lại");
    });

    it("Scenario: §7.3 — provides template preview modal", () => {
      expect(notificationsPageContent).toContain("openPreviewModal");
      expect(notificationsPageContent).toContain("previewHtml");
      expect(notificationsPageContent).toContain("Xem trước");
    });
  });
});
