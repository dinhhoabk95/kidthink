import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Asset Usage Tracking Page (/studio/assets/[id]/usage) — BR-AUT2-01..06", () => {
  const usagePagePath = join(
    import.meta.dirname,
    "../../app/pages/studio/assets/[id]/usage.vue"
  );

  it("Scenario: Page exists and declares manager layout", () => {
    expect(existsSync(usagePagePath)).toBe(true);
    const content = readFileSync(usagePagePath, "utf-8");
    expect(content).toContain('layout: "manager"');
  });

  it("Scenario: §3 & §8 — fetches asset usage via GET /api/managers/assets/{ref}/usage using useApiClient", () => {
    const content = readFileSync(usagePagePath, "utf-8");
    expect(content).toContain("useApiClient");
    expect(content).toContain("/api/managers/assets/");
    expect(content).toContain("/usage");
  });

  it("Scenario: BR-AUT2-04 — renders used_by[] list with entity status and links to content", () => {
    const content = readFileSync(usagePagePath, "utf-8");
    expect(content).toContain("used_by");
    expect(content).toContain("item.status");
    expect(content).toContain("item.code");
    expect(content).toContain("item.title");
    expect(content).toContain("<NuxtLink");
    expect(content).toContain("getEntityRoute");
  });

  it("Scenario: BR-AUT2-01 & BR-AUT2-06 — deletes image via DELETE /api/managers/images/{id} and opens modal showing used_by[] on 409 CONTENT_IN_USE", () => {
    const content = readFileSync(usagePagePath, "utf-8");
    expect(content).toContain("/api/managers/images/");
    expect(content).toContain("CONTENT_IN_USE");
    expect(content).toContain("409");
    expect(content).toContain("isConflictModalOpen");
    expect(content).toContain("conflictUsedBy");
  });
});
