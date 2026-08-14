import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadAndValidateAlertsFile,
  parseAlertsYaml,
  validateAlertsConfig,
} from "../src/alerts-config.js";

describe("Task 2 — alerts.yml & Go-Live Quality Gate (BR-MON-01, BR-MON-02, BR-MON-03, BR-MON-07, D-IR)", () => {
  const alertsYmlPath = resolve(
    import.meta.dirname,
    "../../../infra/monitoring/alerts.yml"
  );

  it("reads and parses infra/monitoring/alerts.yml with P0, P1, P2 groups (D-IR)", () => {
    const result = loadAndValidateAlertsFile(alertsYmlPath);
    expect(result.valid).toBe(true);
    expect(result.stats.p0).toBeGreaterThanOrEqual(7);
    expect(result.stats.p1).toBeGreaterThanOrEqual(4);
    expect(result.stats.p2).toBeGreaterThanOrEqual(3);
    expect(result.summaryMessage).toContain("quy tắc P0 có nguồn và runbook");
    console.log(result.summaryMessage);
  });

  it("Scenario: BR-MON-02 — every rule in alerts.yml has a valid runbook link", () => {
    const result = loadAndValidateAlertsFile(alertsYmlPath);
    expect(result.errors).toEqual([]);
  });

  it("Scenario: BR-MON-03 — negative test: disabled alert rule is rejected by validator", () => {
    const sampleWithDisabled = `
version: "1.0"
groups:
  - name: P0
    rules:
      - name: TestRule
        severity: critical
        threshold: "1 failure"
        channels: [telegram]
        runbook: "https://docs.tinimath.vn/runbooks/test"
        enabled: false
`;
    const parsed = parseAlertsYaml(sampleWithDisabled);
    const result = validateAlertsConfig(parsed);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("BR-MON-03"))).toBe(true);
  });

  it("Scenario: BR-MON-07 & D-IR — negative test: P0 rule with pending_source or missing P0 rule fails go-live gate", () => {
    const sampleWithPendingP0 = `
version: "1.0"
groups:
  - name: P0
    rules:
      - name: HealthCheck503
        severity: critical
        threshold: "2 consecutive failures"
        channels: [telegram]
        runbook: "https://docs.tinimath.vn/runbooks/health-503"
        pending_source: "P2.9"
        enabled: true
      - name: DBDisconnect
        severity: critical
        threshold: "immediate"
        channels: [telegram]
        runbook: "https://docs.tinimath.vn/runbooks/db"
        enabled: true
`;
    const parsed = parseAlertsYaml(sampleWithPendingP0);
    const result = validateAlertsConfig(parsed);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("BR-MON-07 / D-IR"))).toBe(
      true
    );
  });

  it("Scenario: D-IR — P1/P2 rules are allowed to have pending_source without failing go-live gate", () => {
    const result = loadAndValidateAlertsFile(alertsYmlPath);
    expect(result.valid).toBe(true);
  });
});
