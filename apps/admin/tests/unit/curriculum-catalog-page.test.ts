import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const HEX_LITERAL_REGEX = /#[0-9a-fA-F]{3,8}\b/;
const FORBIDDEN_RADIUS_REGEX = /\brounded-(?:md|lg)\b/;
const PARENT_RELATIVE_IMPORT_REGEX = /from\s+["']\.\.\//;
const HARDCODED_15_ROADMAPS_REGEX = /\b15\s+lộ trình\b/i;

describe("Admin Read-Only Curriculum Catalog — Multi-Track Koguma-VN (HK1/HK2 & 36w Stage 1/2) & D1", () => {
  const catalogPagePath = join(
    import.meta.dirname,
    "..",
    "..",
    "app",
    "pages",
    "curriculum",
    "index.vue"
  );
  const detailModalPath = join(
    import.meta.dirname,
    "..",
    "..",
    "app",
    "components",
    "curriculum-koguma-detail-modal.vue"
  );

  const catalogPageSource = readFileSync(catalogPagePath, "utf-8");
  const detailModalSource = readFileSync(detailModalPath, "utf-8");

  it("uses manager layout and calls apiFetch to /api/managers/curricula (read-only D1, dynamic count)", () => {
    expect(catalogPageSource).toContain('layout: "manager"');
    expect(catalogPageSource).toContain('"/api/managers/curricula"');
    expect(catalogPageSource).toContain("apiFetch");
    expect(catalogPageSource).not.toContain('method: "POST"');
    expect(catalogPageSource).not.toContain('method: "DELETE"');
    expect(catalogPageSource).not.toContain('method: "PUT"');
    expect(catalogPageSource).not.toMatch(HARDCODED_15_ROADMAPS_REGEX);
  });

  it("renders Koguma 12w (HK1/HK2) and 36w (Stage 1/2) badges, track filters, and Kuno/MOET read-only metadata", () => {
    expect(catalogPageSource).toContain("Koguma 36w · Chặng 1");
    expect(catalogPageSource).toContain("Koguma 36w · Chặng 2");
    expect(catalogPageSource).toContain("Koguma 12w · Học kỳ 1");
    expect(catalogPageSource).toContain("Koguma 12w · Học kỳ 2");
    expect(catalogPageSource).toContain("admin-track-filter-");
    expect(catalogPageSource).toContain("5 trụ cột K1–K5");
    expect(detailModalSource).toContain("Koguma 36w · Năm học (Chặng 1)");
    expect(detailModalSource).toContain("Koguma 36w · Năm học (Chặng 2)");
    expect(detailModalSource).toContain("Koguma 12w · Học kỳ 1");
    expect(detailModalSource).toContain("Koguma 12w · Học kỳ 2");
    expect(detailModalSource).toContain("Cấu trúc 5 trụ cột Kuno (K1–K5)");
    expect(detailModalSource).toContain("10 chủ đề Giáo dục Mầm non Việt Nam");
  });

  it("enforces UI/UX and architecture invariants (zero hex, zero forbidden radius, <= 800 lines, SFC order, min-h-11)", () => {
    for (const src of [catalogPageSource, detailModalSource]) {
      expect(src.split("\n").length).toBeLessThanOrEqual(800);
      expect(src).not.toMatch(HEX_LITERAL_REGEX);
      expect(src).not.toMatch(FORBIDDEN_RADIUS_REGEX);
      expect(src).not.toMatch(PARENT_RELATIVE_IMPORT_REGEX);
      expect(src).toContain("min-h-11");
      expect(src).toContain("dark:");

      const templateIdx = src.indexOf("<template>");
      const scriptIdx = src.indexOf("<script");
      const styleIdx = src.indexOf("<style");
      expect(templateIdx).toBeGreaterThanOrEqual(0);
      expect(scriptIdx).toBeGreaterThan(templateIdx);
      expect(styleIdx).toBeGreaterThan(scriptIdx);
    }
  });
});
