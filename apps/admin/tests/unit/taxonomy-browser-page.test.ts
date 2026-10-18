import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Taxonomy Browser & Studio Skill Pre-selection — BR-TXB-01..06", () => {
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
  const studioLevelsContent = readFileSync(
    join(
      import.meta.dirname,
      "..",
      "..",
      "app",
      "pages",
      "studio",
      "levels",
      "index.vue"
    ),
    "utf-8"
  );

  it("Scenario: D-IW — taxonomy pages declare manager layout", () => {
    expect(taxonomyIndexContent).toContain('layout: "manager"');
    expect(taxonomyDetailContent).toContain('layout: "manager"');
  });

  it("Scenario: BR-TXB-04 — /taxonomy links each skill to /studio/levels?skill_code={code} and not /admin/seed-authoring", () => {
    expect(taxonomyIndexContent).toContain("/studio/levels?skill_code=");
    expect(taxonomyIndexContent).not.toContain("/admin/seed-authoring");
    expect(taxonomyDetailContent).toContain("skill.actions.author_url");
  });

  it("Scenario: BR-TXB-04 — /studio/levels reads route.query.skill_code as initial filter when loading levels", () => {
    expect(studioLevelsContent).toContain("route.query.skill_code");
    expect(studioLevelsContent).toContain("filters.value.skill_code");
    expect(studioLevelsContent).toContain('params.set("skill_code"');
  });
});
