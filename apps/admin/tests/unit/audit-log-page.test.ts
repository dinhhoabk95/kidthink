import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Audit Log Viewer Page (/audit) — BR-ALV-01..07", () => {
  const auditPageContent = readFileSync(
    join(import.meta.dirname, "../../app/pages/audit/index.vue"),
    "utf-8"
  );
  const levelsPageContent = readFileSync(
    join(import.meta.dirname, "../../app/pages/levels/index.vue"),
    "utf-8"
  );

  it("Scenario: D-IW — declares manager layout", () => {
    expect(auditPageContent).toContain('layout: "manager"');
  });

  it("Scenario: BR-ALV-05 — reads entity_type, entity_id, action, actor_type, q from route.query and syncs back to URL query", () => {
    expect(auditPageContent).toContain("route.query.entity_type");
    expect(auditPageContent).toContain("route.query.entity_id");
    expect(auditPageContent).toContain("route.query.action");
    expect(auditPageContent).toContain("route.query.actor_type");
    expect(auditPageContent).toContain("route.query.q");
    expect(auditPageContent).toContain("router.replace");
    expect(auditPageContent).toContain("syncFiltersToQuery");
  });

  it("Scenario: BR-ALV-04 — renders structured field-by-field diff table instead of raw JSON dump by default", () => {
    expect(auditPageContent).toContain("diffFields");
    expect(auditPageContent).toContain("Field-by-Field Diff");
  });

  it("Scenario: BR-ALV-05 — levels page provides link to /audit with entity_type and entity_id", () => {
    expect(levelsPageContent).toContain("/audit?entity_type=");
  });
});
