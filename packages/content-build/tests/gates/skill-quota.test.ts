import { describe, expect, it } from "vitest";
import {
  evaluateSkillQuota,
  readCoverageRatchet,
} from "#src/gates/skill-quota";
import { ALL_SEED_LEVELS } from "#src/index";
import type { ContentSeed } from "#src/types";
import { VALID_GAME_LEVEL_SEED } from "./fixtures/eight-gates-fixtures.js";

describe("Task #196 — Cổng hạn ngạch và đa dạng skill (check:skill-quota / BR-SKQ-01..05)", () => {
  it("CHỐT KIỂM: full corpus xanh — mọi kỹ năng CÓ nội dung đều đạt hạn ngạch", () => {
    const report = evaluateSkillQuota(ALL_SEED_LEVELS);
    const ratchet = readCoverageRatchet();

    expect(report.totalSkills).toBe(408);
    expect(report.totalValidLevels).toBeGreaterThanOrEqual(3550);
    expect(report.skillsSingleTemplateCount).toBe(0);
    // Kỹ năng chưa có nội dung là nợ có trần, không phải vi phạm hạn ngạch.
    expect(report.skillsWithZeroLevelsCount).toBeLessThanOrEqual(
      ratchet.max_skills_without_levels
    );
    expect(report.skillsMeetingQuotaCount).toBe(
      report.totalSkills - report.skillsWithZeroLevelsCount
    );
    expect(report.violations.length).toBe(0);
    expect(report.passed).toBe(true);
  });

  it("Trần bậc thang CHỈ ĐƯỢC GIẢM — mốc ghi ngày mở kho là 178", () => {
    expect(readCoverageRatchet().max_skills_without_levels).toBeLessThanOrEqual(
      178
    );
  });

  describe("Sáu ca âm bắt buộc (BR-SKQ-01..04, BR-SKQ-06)", () => {
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

    it("Ca âm 5: vượt trần bậc thang kỹ năng chưa có nội dung làm cổng đỏ (BR-SKQ-06)", () => {
      // Corpus rỗng: MỌI kỹ năng đều 0 level, chắc chắn vượt trần đã ghi.
      const report = evaluateSkillQuota([]);

      expect(report.passed).toBe(false);
      expect(report.skillsWithZeroLevelsCount).toBe(report.totalSkills);

      const v = report.violations.find(
        (violation) => violation.ruleId === "BR-SKQ-06"
      );
      expect(v).toBeDefined();
      expect(v?.actual).toBe(report.totalSkills);
      expect(v?.expected).toBe(readCoverageRatchet().max_skills_without_levels);
    });

    it("Ca âm 6: kỹ năng 0 level KHÔNG được báo là thiếu hạn ngạch (BR-SKQ-02 giữ đúng phạm vi)", () => {
      const report = evaluateSkillQuota([]);

      // Nếu BR-SKQ-02 lại tràn sang kỹ năng trắng thì sẽ có hàng trăm vi phạm
      // loại đó — đúng cái đã chặn việc mở kho trước khi tách hai luật.
      const quotaViolations = report.violations.filter(
        (violation) => violation.ruleId === "BR-SKQ-02"
      );
      expect(quotaViolations).toHaveLength(0);
    });
  });
});
