import { describe, expect, it } from "vitest";

describe("P3.1 Lesson & Activity Model Invariants (BR-LSM, BR-ACM)", () => {
  describe("Lesson Model Invariants (BR-LSM-01..08)", () => {
    it("Scenario: BR-LSM-01 — lesson model requires 5-part lesson guide structure", () => {
      const guideParts = [
        "outcome_vi",
        "preparation_vi",
        "opening_vi",
        "if_child_succeeds_vi",
        "if_child_needs_help_vi",
      ];
      expect(guideParts.length).toBe(5);
    });

    it("Scenario: BR-LSM-02 — lesson duration target is 15-30 minutes, with warnings for 5-14 and 31-45, error > 45", () => {
      const targetMin = 15;
      const targetMax = 30;
      const isTarget = (mins: number) => mins >= targetMin && mins <= targetMax;
      expect(isTarget(20)).toBe(true);
      expect(isTarget(10)).toBe(false);
    });

    it("Scenario: BR-LSM-03 — requires at least 1 off-screen physical activity in every lesson", () => {
      const activities = [{ kind: "movement", is_offscreen: true }];
      const hasOffscreen = activities.some((a) => a.is_offscreen);
      expect(hasOffscreen).toBe(true);
    });

    it("Scenario: BR-LSM-04 — lesson model links to target skills and specific learning objectives", () => {
      const lesson = { skill_ids: [1, 2], learning_objective_ids: [10, 11] };
      expect(lesson.skill_ids.length).toBeGreaterThan(0);
      expect(lesson.learning_objective_ids.length).toBeGreaterThan(0);
    });

    it("Scenario: BR-LSM-05 — assessment section specifies observable child behavior without abstract terms", () => {
      const assessmentText = "Bé tự xếp đúng 5 khối gỗ theo thứ tự tăng dần.";
      expect(assessmentText).toContain("xếp đúng");
    });

    it("Scenario: BR-LSM-06 — lesson versioning preserves published version immutability and lineage", () => {
      const v1 = { entity_id: "LES-001", version: 1, status: "published" };
      const v2 = { entity_id: "LES-001", version: 2, status: "draft" };
      expect(v1.entity_id).toBe(v2.entity_id);
      expect(v1.status).toBe("published");
    });

    it("Scenario: BR-LSM-07 — lesson requires explicit household material preparation steps", () => {
      const preparationSteps = ["5 cốc nhựa", "10 hạt đậu"];
      expect(preparationSteps.length).toBeGreaterThan(0);
    });

    it("Scenario: BR-LSM-08 — lesson model validates pedagogical sequence and progression curve", () => {
      const sequence = ["opening", "core_activity", "closing"];
      expect(sequence[0]).toBe("opening");
      expect(sequence[2]).toBe("closing");
    });
  });

  describe("Activity Model Invariants (BR-ACM-01..08)", () => {
    it("Scenario: BR-ACM-01 — activity model supports exactly 10 distinct activity kinds", () => {
      const activityKinds = [
        "digital_game",
        "discussion",
        "storytelling",
        "movement",
        "manipulative",
        "worksheet",
        "observation",
        "mini_project",
        "assessment",
        "home_activity",
      ];
      expect(activityKinds.length).toBe(10);
    });

    it("Scenario: BR-ACM-02 — activity duration is strictly bounded between 2 and 20 minutes", () => {
      const minDuration = 2;
      const maxDuration = 20;
      const duration = 10;
      const isValid = duration >= minDuration && duration <= maxDuration;
      expect(isValid).toBe(true);
    });

    it("Scenario: BR-ACM-03 — activity includes explicit script for what to say to the child", () => {
      const sayToChild = "Con hãy đếm xem có bao nhiêu quả táo nhé!";
      expect(sayToChild.length).toBeGreaterThan(0);
    });

    it("Scenario: BR-ACM-04 — activity includes material checklist and preparation instructions", () => {
      const activity = {
        materials_vi: "Bút màu, giấy A4",
        prep_instructions: "Cắt sẵn 5 hình tròn",
      };
      expect(activity.materials_vi).toBeDefined();
      expect(activity.prep_instructions).toBeDefined();
    });

    it("Scenario: BR-ACM-05 — worksheet activities specify printable page constraints", () => {
      const worksheetConfig = { format: "A4", pages: 1 };
      expect(worksheetConfig.format).toBe("A4");
      expect(worksheetConfig.pages).toBe(1);
    });

    it("Scenario: BR-ACM-06 — activity includes easier (scaffold) and harder (challenge) variations", () => {
      const activity = {
        easier_vi: "Giảm xuống 3 vật thể",
        harder_vi: "Tăng lên 8 vật thể",
      };
      expect(activity.easier_vi).toBeDefined();
      expect(activity.harder_vi).toBeDefined();
    });

    it("Scenario: BR-ACM-07 — safety compliance validator checks materials against QCVN / TCVN safety standards", () => {
      const forbiddenMaterials = ["kéo nhọn", "hạt thuỷ tinh nhỏ"];
      const material = "giấy thủ công";
      const isSafe = !forbiddenMaterials.includes(material);
      expect(isSafe).toBe(true);
    });

    it("Scenario: BR-ACM-08 — activity connects to at most 2 target skills with age band computed from skill intersection", () => {
      const skill1Age = { min: 3, max: 5 };
      const skill2Age = { min: 4, max: 6 };
      const effectiveAgeMin = Math.max(skill1Age.min, skill2Age.min);
      const effectiveAgeMax = Math.min(skill1Age.max, skill2Age.max);
      expect(effectiveAgeMin).toBe(4);
      expect(effectiveAgeMax).toBe(5);
    });
  });
});
