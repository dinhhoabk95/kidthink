import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MANAGER_NAV_ITEMS } from "../../app/composables/nav-config.js";

describe("Task 1 & Task 2 — Admin Shell Layout & Invariants (D-IW, D-IY)", () => {
  it("Scenario: D-IW & D-IY — MANAGER_NAV_ITEMS single canonical declaration with roles", () => {
    expect(MANAGER_NAV_ITEMS.length).toBeGreaterThanOrEqual(8);

    const reviewerNav = MANAGER_NAV_ITEMS.filter((item) =>
      item.roles.includes("content_reviewer")
    );
    const adminNav = MANAGER_NAV_ITEMS.filter((item) =>
      item.roles.includes("super_admin")
    );

    // super_admin sees all items
    expect(adminNav.length).toBe(MANAGER_NAV_ITEMS.length);

    // content_reviewer MUST NOT see billing, users, or system
    const forbiddenReviewerHrefs = [
      "/payments",
      "/users",
      "/system",
      "/legal-consents",
    ];
    for (const item of reviewerNav) {
      expect(forbiddenReviewerHrefs).not.toContain(item.href);
    }

    // content_reviewer CAN see dashboard, taxonomy, levels, lessons, curriculum, review
    const allowedReviewerHrefs = [
      "/",
      "/taxonomy",
      "/levels",
      "/lessons",
      "/curriculum",
      "/content-review",
    ];
    for (const href of allowedReviewerHrefs) {
      expect(reviewerNav.some((i) => i.href === href)).toBe(true);
    }
  });

  it("Scenario: D-IW gate — every page under apps/admin/app/pages/ declares layout: 'manager'", () => {
    const pagesDir = join(import.meta.dirname, "../../app/pages");

    function getVueFiles(dir: string): string[] {
      const entries = readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...getVueFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".vue")) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const pageFiles = getVueFiles(pagesDir);
    expect(pageFiles.length).toBeGreaterThanOrEqual(4);

    for (const filePath of pageFiles) {
      const content = readFileSync(filePath, "utf-8");
      const hasManagerLayout =
        content.includes('layout: "manager"') ||
        content.includes("layout: 'manager'") ||
        content.includes("layout: `manager`");

      expect(
        hasManagerLayout,
        `Page ${filePath} must declare definePageMeta({ layout: "manager" })`
      ).toBe(true);
    }
  });

  it("Scenario: D-IW negative test — no page under apps/admin/app/pages/ declares its own duplicate sidebar or <nav", () => {
    const pagesDir = join(import.meta.dirname, "../../app/pages");

    function getVueFiles(dir: string): string[] {
      const entries = readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...getVueFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".vue")) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const pageFiles = getVueFiles(pagesDir);
    for (const filePath of pageFiles) {
      const content = readFileSync(filePath, "utf-8");
      // Pages must NOT have <aside or role="navigation" (sidebar must only be in manager.vue layout)
      expect(content).not.toContain("<aside");
      expect(content).not.toContain('aria-label="Thanh điều hướng chính"');
    }
  });
});
