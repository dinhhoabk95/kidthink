import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Taxonomy Browser & Skill Pre-selection — BR-TXB-01..06", () => {
  const taxonomyIndexContent = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "..",
      "app",
      "pages",
      "taxonomy",
      "index.vue"
    ),
    "utf-8"
  );
  const taxonomyDetailContent = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "..",
      "app",
      "pages",
      "taxonomy",
      "[code].vue"
    ),
    "utf-8"
  );
  const levelsContent = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "..",
      "app",
      "pages",
      "levels",
      "index.vue"
    ),
    "utf-8"
  );

  it("Scenario: D-IW — taxonomy pages declare manager layout", () => {
    expect(taxonomyIndexContent).toContain('layout: "manager"');
    expect(taxonomyDetailContent).toContain('layout: "manager"');
  });

  it("Scenario: BR-TXB-04 — /taxonomy links each skill to /levels?skill_code={code} and not /studio/levels", () => {
    expect(taxonomyIndexContent).toContain("/levels?skill_code=");
    expect(taxonomyIndexContent).not.toContain("/studio/levels");
    expect(taxonomyIndexContent).not.toContain("/admin/seed-authoring");
    expect(taxonomyDetailContent).toContain("/levels?skill_code=");
  });

  it("Scenario: BR-TXB-04 — /levels reads route.query.skill_code as initial filter when loading levels", () => {
    expect(levelsContent).toContain("route.query.skill_code");
    expect(levelsContent).toContain("filters.value.skill_code");
    expect(
      levelsContent.includes('params.set("skill_code"') ||
        levelsContent.includes("query.skill_code =")
    ).toBe(true);
  });
});
