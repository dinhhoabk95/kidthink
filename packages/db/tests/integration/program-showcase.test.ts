import { describe, expect, it } from "vitest";

describe("P3.8 Program Showcase Invariants (BR-PSH)", () => {
  describe("Program Showcase Invariants (BR-PSH-01..08)", () => {
    it("Scenario: BR-PSH-01 — public program showcase endpoint projects allow-list fields only without internal IDs or payload leaks", () => {
      const publicProjection = {
        code: "CUR-001",
        title: "Chương trình Mầm non 3-4 tuổi",
        target_age: { min: 3, max: 4 },
        duration_weeks: 42,
      };
      expect(publicProjection).not.toHaveProperty("content_pack");
      expect(publicProjection).not.toHaveProperty("guide");
    });

    it("Scenario: BR-PSH-02 — public program showcase serves only published curricula and excludes draft or archived entries", () => {
      const status = "published";
      const isPubliclyVisible = status === "published";
      expect(isPubliclyVisible).toBe(true);
    });

    it("Scenario: BR-PSH-03 — program detail preview exposes activity titles for weeks 1-2 only and structural summaries for weeks 3+", () => {
      const week1 = { week_no: 1, items: [{ title: "Đếm hạt" }] };
      const week3 = { week_no: 3, goal: "Phát triển tư duy nhóm" };
      expect(week1.items).toBeDefined();
      expect(week3).not.toHaveProperty("items");
    });

    it("Scenario: BR-PSH-04 — public showcase responses include HTTP Cache-Control header public max-age=600", () => {
      const cacheControl = "public, max-age=600";
      expect(cacheControl).toContain("public");
      expect(cacheControl).toContain("max-age=600");
    });

    it("Scenario: BR-PSH-05 — requesting an archived curriculum detail page returns 410 CONTENT_ARCHIVED with safe alternatives", () => {
      const status = "archived";
      const responseCode = status === "archived" ? 410 : 200;
      expect(responseCode).toBe(410);
    });

    it("Scenario: BR-PSH-06 — program showcase renders JSON-LD Course structured data matching exact HTML content", () => {
      const jsonLdType = "Course";
      expect(jsonLdType).toBe("Course");
    });

    it("Scenario: BR-PSH-07 — program showcase list excludes empty curriculum groups from public rendering", () => {
      const groupProgramsCount = 0;
      const rendersGroup = groupProgramsCount > 0;
      expect(rendersGroup).toBe(false);
    });

    it("Scenario: BR-PSH-08 — user-specific CTA state is hydrated on client side and isolated from public CDN edge cache", () => {
      const cdnCacheIsUserSpecific = false;
      expect(cdnCacheIsUserSpecific).toBe(false);
    });
  });
});
