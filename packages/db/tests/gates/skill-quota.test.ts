import { describe, expect, it } from "vitest";
import { evaluateSkillQuota } from "#src/seed-content/gates/skill-quota";
import { ALL_SEED_LEVELS } from "#src/seed-content/index";
import type { ContentSeed } from "#src/seed-content/types";
import { VALID_GAME_LEVEL_SEED } from "./fixtures/eight-gates-fixtures.js";

describe("Task #196 — Cổng hạn ngạch và đa dạng skill (check:skill-quota / BR-SKQ-01..05)", () => {
  it("CHỐT KIỂM: Chạy trên full corpus seed hiện tại và XANH TOÀN BỘ 230/230 skills", () => {
    const report = evaluateSkillQuota(ALL_SEED_LEVELS);
    expect(report.totalSkills).toBe(230);
    expect(report.totalValidLevels).toBeGreaterThanOrEqual(3550);
    expect(report.skillsWithZeroLevelsCount).toBe(0);
    expect(report.skillsSingleTemplateCount).toBe(0);
    expect(report.violations.length).toBe(0);
    expect(report.passed).toBe(true);
  });

  describe("Bốn ca âm bắt buộc (BR-SKQ-01..04)", () => {
    it("Ca âm 1: Skill thiếu level làm cổng đỏ (BR-SKQ-02)", () => {
      // Giả lập catalog chỉ có 5 level cho C1.CNT.01 (yêu cầu là 20)
      const mockLevels: ContentSeed[] = [];
      for (let i = 1; i <= 5; i++) {
        mockLevels.push({
          ...VALID_GAME_LEVEL_SEED,
          header: {
            ...VALID_GAME_LEVEL_SEED.header,
            code: `GL-C1-CNT01-MOCK-${String(i).padStart(4, "0")}`,
            template_code: "GT-001",
            skill_codes: ["C1.CNT.01"],
          },
        });
      }

      const report = evaluateSkillQuota(mockLevels);
      expect(report.passed).toBe(false);

      const v = report.violations.find(
        (violation) =>
          violation.ruleId === "BR-SKQ-02" &&
          violation.skill_code === "C1.CNT.01"
      );
      expect(v).toBeDefined();
      expect(v?.actual).toBe(5);
      expect(v?.expected).toBe(20);
    });

    it("Ca âm 2: Skill đủ level nhưng dồn 1 khuôn duy nhất làm cổng đỏ (BR-SKQ-03)", () => {
      // Giả lập C1.CNT.01 có 20 level nhưng đều trên GT-001 (đòi hỏi >= 4 khuôn)
      const mockLevels: ContentSeed[] = [];
      for (let i = 1; i <= 20; i++) {
        mockLevels.push({
          ...VALID_GAME_LEVEL_SEED,
          header: {
            ...VALID_GAME_LEVEL_SEED.header,
            code: `GL-C1-CNT01-GT001-${String(i).padStart(4, "0")}`,
            template_code: "GT-001",
            skill_codes: ["C1.CNT.01"],
          },
        });
      }

      const report = evaluateSkillQuota(mockLevels);
      expect(report.passed).toBe(false);

      const v = report.violations.find(
        (violation) =>
          violation.ruleId === "BR-SKQ-03" &&
          violation.skill_code === "C1.CNT.01"
      );
      expect(v).toBeDefined();
      expect(v?.actual).toBe(1);
      expect(v?.expected).toBe(4);
    });

    it("Ca âm 3: Cặp (skill, khuôn) vượt trần 5 level làm cổng đỏ (BR-SKQ-04)", () => {
      // 6 level cho cặp (C1.CNT.01, GT-001)
      const mockLevels: ContentSeed[] = [];
      for (let i = 1; i <= 6; i++) {
        mockLevels.push({
          ...VALID_GAME_LEVEL_SEED,
          header: {
            ...VALID_GAME_LEVEL_SEED.header,
            code: `GL-C1-CNT01-CAP-${String(i).padStart(4, "0")}`,
            template_code: "GT-001",
            skill_codes: ["C1.CNT.01"],
          },
        });
      }

      const report = evaluateSkillQuota(mockLevels);
      expect(report.passed).toBe(false);

      const v = report.violations.find(
        (violation) =>
          violation.ruleId === "BR-SKQ-04" &&
          violation.skill_code === "C1.CNT.01" &&
          violation.template_code === "GT-001"
      );
      expect(v).toBeDefined();
      expect(v?.actual).toBe(6);
      expect(v?.expected).toBe(5);
    });

    it("Ca âm 4: Level không parse được content_pack thì KHÔNG được đếm vào hạn ngạch (BR-SKQ-01)", () => {
      const brokenLevel: ContentSeed = {
        ...VALID_GAME_LEVEL_SEED,
        header: {
          ...VALID_GAME_LEVEL_SEED.header,
          code: "GL-C1-BROKEN-0001",
          template_code: "GT-001",
          skill_codes: ["C1.CNT.01"],
        },
        content_pack: {
          prompt: "Sai cấu trúc schema hoàn toàn",
        },
      };

      const report = evaluateSkillQuota([brokenLevel]);
      expect(report.parseRejectedCount).toBe(1);
      expect(report.totalValidLevels).toBe(0);

      const v = report.violations.find(
        (violation) => violation.ruleId === "BR-SKQ-01"
      );
      expect(v).toBeDefined();
      expect(v?.message).toContain("trượt content_contract");
    });
  });
});
