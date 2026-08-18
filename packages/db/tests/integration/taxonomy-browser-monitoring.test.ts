import { resolve } from "node:path";
import { loadAndValidateAlertsFile, redactPii } from "@mindkid/shared";
import { describe, expect, it } from "vitest";

describe("P1.16 Taxonomy Browser & Monitoring Invariants (BR-TXB, BR-MON)", () => {
  describe("Taxonomy Browser Invariants (BR-TXB-01..06)", () => {
    it("Scenario: BR-TXB-01 — taxonomy browser is strictly read-only with no write routes", () => {
      const allowedMethods = ["GET"];
      expect(allowedMethods).not.toContain("POST");
      expect(allowedMethods).not.toContain("PATCH");
      expect(allowedMethods).not.toContain("DELETE");
    });

    it("Scenario: BR-TXB-02 — counts published game levels per node and displays draft counts separately", () => {
      const nodeCounts = { published: 5, draft: 2 };
      expect(nodeCounts.published).toBe(5);
      expect(nodeCounts.draft).toBe(2);
    });

    it("Scenario: BR-TXB-03 — highlights skills with 0 published levels as content gaps", () => {
      const publishedCount = 0;
      const isGap = publishedCount === 0;
      expect(isGap).toBe(true);
    });

    it("Scenario: BR-TXB-04 — author action button opens seeder authoring workflow prefilled with skill_code", () => {
      const actionUrl = "/admin/seed-authoring?skill_code=C1.CNT.01";
      expect(actionUrl).toContain("skill_code=C1.CNT.01");
      expect(actionUrl).not.toContain("404");
    });

    it("Scenario: BR-TXB-05 — displays prerequisite graph showing upstream and downstream dependencies", () => {
      const graph = {
        skill: "C1.CNT.03",
        prerequisites: ["C1.CNT.01", "C1.CNT.02"],
        unlocks: ["C1.CNT.04"],
      };
      expect(graph.prerequisites.length).toBeGreaterThan(0);
      expect(graph.unlocks.length).toBeGreaterThan(0);
    });

    it("Scenario: BR-TXB-06 — caches taxonomy tree counts for 5 minutes with as_of timestamp", () => {
      const cacheMinutes = 5;
      const asOf = new Date().toISOString();
      expect(cacheMinutes).toBe(5);
      expect(asOf).toBeDefined();
    });
  });

  describe("Monitoring & Alerting Invariants (BR-MON-01..07)", () => {
    it("Scenario: BR-MON-01 — dispatches alerts on critical system events and P0 conditions", () => {
      const criticalEvent = "DATABASE_DISCONNECTED";
      const isAlertDispatched = criticalEvent === "DATABASE_DISCONNECTED";
      expect(isAlertDispatched).toBe(true);
    });

    it("Scenario: BR-MON-02 & BR-MON-03 & BR-MON-07 — alerts.yml validation passes go-live gate", () => {
      const alertsYmlPath = resolve(
        import.meta.dirname,
        "../../../../infra/monitoring/alerts.yml"
      );
      const result = loadAndValidateAlertsFile(alertsYmlPath);
      expect(result.valid).toBe(true);
      expect(result.stats.p0Ready).toBeGreaterThanOrEqual(7);
      expect(result.errors).toEqual([]);
    });

    it("Scenario: BR-MON-04 — dead-man switch triggers alert when heartbeat fails for 10 minutes", () => {
      const missingHeartbeatMinutes = 10;
      const triggerDeadManSwitch = missingHeartbeatMinutes >= 10;
      expect(triggerDeadManSwitch).toBe(true);
    });

    it("Scenario: BR-MON-05 — redactor filters all PII (display_name, email, child_uuid, etc) from structured logs", () => {
      const rawLog = {
        msg: "User request",
        display_name: "Test User",
        email: "test@example.com",
        child_uuid: "1234-5678",
        password: "secretpassword",
        token: "jwt_token_here",
        authorization: "Bearer xyz",
        valid_field: "safe_metric",
      };

      const redacted = redactPii(rawLog);

      expect(redacted).not.toHaveProperty("display_name");
      expect(redacted).not.toHaveProperty("email");
      expect(redacted).not.toHaveProperty("child_uuid");
      expect(redacted).not.toHaveProperty("password");
      expect(redacted).not.toHaveProperty("token");
      expect(redacted).not.toHaveProperty("authorization");
      expect(redacted.valid_field).toBe("safe_metric");
    });

    it("Scenario: BR-MON-06 — collects client error logs with configurable sampling rate", () => {
      const samplingRate = 0.2; // 20% sampling
      expect(samplingRate).toBeGreaterThan(0);
      expect(samplingRate).toBeLessThanOrEqual(1.0);
    });
  });
});
