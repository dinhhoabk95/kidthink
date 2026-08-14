import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const MUTATION_METHOD_REGEX = /method:\s*["'](POST|PATCH|PUT|DELETE)["']/i;

describe("Task 5 — Dashboard View Invariants (BR-DSH-01, BR-DSH-02, D-JA)", () => {
  it("Scenario: BR-DSH-01 & D-JA gate — dashboard view is strictly read-only and emits NO mutation calls", () => {
    const dashboardSource = readFileSync(
      path.resolve(import.meta.dirname, "../../app/pages/index.vue"),
      "utf8"
    );

    // Must NOT contain mutation methods in fetch / api calls
    expect(dashboardSource).not.toMatch(MUTATION_METHOD_REGEX);
    expect(dashboardSource).not.toContain("$fetch.post");
    expect(dashboardSource).not.toContain("$fetch.patch");
    expect(dashboardSource).not.toContain("$fetch.put");
    expect(dashboardSource).not.toContain("$fetch.delete");
  });

  it("Scenario: D-JA — MVP dashboard uses delta comparison with arrows and NO chart libraries", () => {
    const dashboardSource = readFileSync(
      path.resolve(import.meta.dirname, "../../app/pages/index.vue"),
      "utf8"
    );

    // No chart canvas or chart libraries
    expect(dashboardSource).not.toContain("<canvas");
    expect(dashboardSource).not.toContain("chart.js");
    expect(dashboardSource).not.toContain("echarts");
    expect(dashboardSource).not.toContain("apexcharts");
    expect(dashboardSource).not.toContain("recharts");
  });

  it("Scenario: BR-DSH-02 — all cards in the 'Việc cần làm' (todo) section provide valid action links", () => {
    const dashboardSource = readFileSync(
      path.resolve(import.meta.dirname, "../../app/pages/index.vue"),
      "utf8"
    );

    // Links to operational handler pages or system
    expect(dashboardSource).toContain('to="/system"');
    expect(dashboardSource).toContain("open_alerts");
    expect(dashboardSource).toContain("pending_payments");
    expect(dashboardSource).toContain("pending_content");
  });

  it("Scenario: D-IX — pending sources display explicit pending step badges, never false zeros", () => {
    const dashboardSource = readFileSync(
      path.resolve(import.meta.dirname, "../../app/pages/index.vue"),
      "utf8"
    );

    expect(dashboardSource).toContain("Bước P2.3");
    expect(dashboardSource).toContain("Bước P2.8");
    expect(dashboardSource).toContain("Bước P3.1");
    expect(dashboardSource).toContain("Bước P3.3");
    expect(dashboardSource).toContain("Bước P4");
    expect(dashboardSource).toContain("Chưa có nguồn");
  });
});
