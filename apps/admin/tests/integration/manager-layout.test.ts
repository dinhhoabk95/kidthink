import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getNavItemsForRole,
  MANAGER_NAV_ITEMS,
} from "~/composables/nav-config";

const HEX_COLOR_REGEX = /#[0-9a-fA-F]{6}/;

function getPageFiles(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      getPageFiles(fullPath, fileList);
    } else if (file.endsWith(".vue")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

describe("Task 1 & D-IW — Manager Shell Layout & Page Hosting Invariants", () => {
  it("Scenario: D-IW — all admin pages (except /login) strictly use layout: 'manager'", () => {
    const pagesDir = path.resolve(import.meta.dirname, "../../app/pages");
    const pageFiles = getPageFiles(pagesDir);

    expect(pageFiles.length).toBeGreaterThanOrEqual(4);

    for (const file of pageFiles) {
      const content = readFileSync(file, "utf8");
      const relativePath = path.relative(pagesDir, file);

      if (relativePath === "login.vue") {
        expect(
          content.includes('layout: "auth"') ||
            content.includes("layout: 'auth'") ||
            content.includes("layout: false")
        ).toBe(true);
        continue;
      }

      expect(
        content.includes('layout: "manager"') ||
          content.includes("layout: 'manager'")
      ).toBe(true);
    }
  });

  it("Scenario: D-IW negative test — admin pages must NOT define their own custom nav", () => {
    const pagesDir = path.resolve(import.meta.dirname, "../../app/pages");
    const pageFiles = getPageFiles(pagesDir);

    for (const file of pageFiles) {
      const content = readFileSync(file, "utf8");
      const relativePath = path.relative(pagesDir, file);

      if (relativePath === "login.vue") {
        continue;
      }

      // Standalone pages must not have their own <aside> or custom sidebar nav
      expect(content).not.toContain("<aside");
      expect(content).not.toContain('aria-label="Thanh điều hướng chính"');
    }
  });

  it("Scenario: D-IY & BR-DSH-06 — navigation menu filters out sensitive operational modules for content_reviewer", () => {
    const reviewerNav = getNavItemsForRole("content_reviewer");
    const reviewerHrefList = reviewerNav.map((item) => item.href);

    // content_reviewer must see: Dashboard, Content Review, Taxonomy, Levels, Lessons, Curriculum
    expect(reviewerHrefList).toContain("/");
    expect(reviewerHrefList).toContain("/taxonomy");
    expect(reviewerHrefList).toContain("/content-review");
    expect(reviewerHrefList).toContain("/levels");
    expect(reviewerHrefList).toContain("/lessons");
    expect(reviewerHrefList).toContain("/curriculum");

    // content_reviewer must NOT see: Users, Payments, Legal Consents, System
    expect(reviewerHrefList).not.toContain("/users");
    expect(reviewerHrefList).not.toContain("/payments");
    expect(reviewerHrefList).not.toContain("/legal-consents");
    expect(reviewerHrefList).not.toContain("/system");

    const superAdminNav = getNavItemsForRole("super_admin");
    expect(superAdminNav.length).toBe(MANAGER_NAV_ITEMS.length);
  });

  it("Scenario: Accessibility & Tokens — navigation uses semantic HTML, keyboard focus, and tokens", () => {
    const layoutSource = readFileSync(
      path.resolve(import.meta.dirname, "../../app/layouts/manager.vue"),
      "utf8"
    );

    // Semantic HTML & a11y
    expect(layoutSource).toContain("<aside");
    expect(layoutSource).toContain("<nav");
    expect(layoutSource).toContain("<header");
    expect(layoutSource).toContain("<main");
    expect(layoutSource).toContain("focus-visible:ring-2");

    // Token check — no inline hex colors
    expect(layoutSource).not.toMatch(HEX_COLOR_REGEX);
  });
});
