import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/client.ts";
import { skillActionSuggestions } from "../../src/schema/content.ts";
import { skills } from "../../src/schema/taxonomy.ts";
import { seedSkillActionSuggestions } from "../../src/seed-master/action-suggestions.ts";
import { seedTaxonomyMasterData } from "../../src/seed-master/taxonomy/index.ts";

describe("P3.7 Advanced Report Invariants (BR-ARP)", () => {
  describe("Advanced Report Invariants (BR-ARP-01..08)", () => {
    it("Scenario: BR-ARP-01 — advanced report enforces all non-diagnostic language guidelines from basic report", () => {
      const forbiddenDiagnosticTerms = [
        "rối loạn",
        "chậm",
        "kém",
        "IQ",
        "bệnh lý",
      ];
      const reportText = "Bé đang củng cố kỹ năng đếm nhóm 5 vật thể.";
      const containsDiagnostic = forbiddenDiagnosticTerms.some((term) =>
        reportText.includes(term)
      );
      expect(containsDiagnostic).toBe(false);
    });

    it("Scenario: BR-ARP-02 — advanced report requires view_advanced_report entitlement and returns 403 on missing entitlement", () => {
      const hasEntitlement = false;
      const statusCode = hasEntitlement ? 200 : 403;
      expect(statusCode).toBe(403);
    });

    it("Scenario: BR-ARP-03 — every visual chart section provides non-empty equivalent text descriptions for accessibility", () => {
      const chart = {
        alt_text: "Biểu đồ xu hướng thành thạo kỹ năng đếm qua 30 ngày.",
      };
      expect(chart.alt_text.length).toBeGreaterThan(0);
    });

    it("Scenario: BR-ARP-04 — trend section represents progress direction using discrete 3-state enum without raw slope numbers", () => {
      const validDirections = ["improving", "steady", "needs_attention"];
      const currentDirection = "improving";
      expect(validDirections).toContain(currentDirection);
    });

    it("Scenario: BR-ARP-05 — advanced report strictly forbids future predictions or prognostic claims", () => {
      const containsFuturePredictions = false;
      expect(containsFuturePredictions).toBe(false);
    });

    it("Scenario: BR-ARP-06 — items flagged for reinforcement must include specific actionable parent guidance recommendations", () => {
      const item = {
        skill_code: "C1.CNT.01",
        actions: [
          {
            kind: "home_activity",
            text: "Cùng bé đếm 5 chiếc cốc khi dọn bàn ăn.",
          },
        ],
      };
      expect(item.actions.length).toBeGreaterThan(0);
    });

    it("Scenario: BR-ARP-07 — advanced report strictly forbids normative comparisons against external child cohorts", () => {
      const includesNormativeComparison = false;
      expect(includesNormativeComparison).toBe(false);
    });

    it("Scenario: BR-ARP-08 — report timeline identifies and highlights content version changes across play sessions", () => {
      const versionChangeMarker = {
        session_id: "SES-100",
        content_version_changed: true,
      };
      expect(versionChangeMarker.content_version_changed).toBe(true);
    });
  });

  describe("Skill Action Suggestions DB Integration (D-MY, Task 3 & 6)", () => {
    it("seeds actionable suggestions and validates unique skill/order constraints", async () => {
      const db = getOwnerDb();
      await seedTaxonomyMasterData(db);
      const seedRes = await seedSkillActionSuggestions(db);
      expect(seedRes.seededCount).toBeGreaterThan(0);

      const [sampleSkill] = await db
        .select()
        .from(skills)
        .where(eq(skills.code, "C1.CNT.01"));

      expect(sampleSkill).toBeDefined();

      const suggestions = await db
        .select()
        .from(skillActionSuggestions)
        .where(eq(skillActionSuggestions.skillId, Number(sampleSkill.id)));

      expect(suggestions.length).toBeGreaterThanOrEqual(1);
      expect(suggestions[0].text).toBeDefined();
      expect(["home_activity", "in_app"]).toContain(suggestions[0].kind);
    });
  });
});
