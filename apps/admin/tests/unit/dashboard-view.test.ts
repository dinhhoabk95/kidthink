import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("Task 5 — Dashboard View & Mutation Scan (BR-DSH-01, D-JA, D-IX)", () => {
  const dashboardSource = readFileSync(
    join(import.meta.dirname, "../../app/pages/index.vue"),
    "utf-8"
  );

  it("Scenario: BR-DSH-01 & D-JA gate — dashboard contains NO mutation calls (POST, PATCH, PUT, DELETE)", () => {
    // Scan template and script for mutation HTTP methods
    const mutationMatches = dashboardSource.match(
      /method:\s*["'](POST|PATCH|PUT|DELETE)["']/gi
    );
    expect(
      mutationMatches,
      "Dashboard component must be strictly read-only, no POST/PATCH/PUT/DELETE mutations allowed"
    ).toBeNull();

    expect(dashboardSource).not.toContain("$fetch.post");
    expect(dashboardSource).not.toContain("$fetch.put");
    expect(dashboardSource).not.toContain("$fetch.delete");
    expect(dashboardSource).not.toContain("$fetch.patch");
  });

  it("Scenario: D-IX — pending_source references exist in dashboard and never hardcode 0", () => {
    expect(dashboardSource).toContain("P2.3");
    expect(dashboardSource).toContain("P2.8");
    expect(dashboardSource).toContain("P3.1");
    expect(dashboardSource).toContain("P3.3");
    expect(dashboardSource).toContain("P4");

    // Must display "Chưa có nguồn"
    expect(dashboardSource).toContain("Chưa có nguồn — bước P2.3");
  });

  it("Scenario: BR-DSH-04 — displays as_of timestamp at the top of the dashboard", () => {
    expect(dashboardSource).toContain("data.as_of");
    expect(dashboardSource).toContain("Dữ liệu tính đến (as of):");
  });

  it("Scenario: BR-DSH-02 — action links exist for todo and feedback items", () => {
    expect(dashboardSource).toContain('to="/system"');
    expect(dashboardSource).toContain('to="/taxonomy"');
  });
});
