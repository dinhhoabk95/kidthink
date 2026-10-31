import { describe, expect, it } from "vitest";
import {
  evaluateSkillQuota,
  evaluateSkillQuotaWithDebt,
  readCoverageRatchet,
  readQuotaConfig,
  readSkillQuotaDebt,
} from "#src/gates/skill-quota";
import { ALL_SEED_LEVELS } from "#src/index";
import type { ContentSeed } from "#src/types";
import { VALID_GAME_LEVEL_SEED } from "./fixtures/eight-gates-fixtures.js";

describe("Task #196 & #310 S7b — Cổng hạn ngạch và đa dạng skill (check:skill-quota / BR-SKQ-01..08)", () => {
  it("CHỐT KIỂM: full corpus đạt chuẩn qua sổ nợ chỉ giảm (BR-SKQ-02/03 không nới hạn ngạch)", () => {
    const quota = readQuotaConfig();
    expect(quota.c1.requiredLevels).toBe(3);
    expect(quota.c1.requiredTemplates).toBe(2);
    expect(quota.default.requiredLevels).toBe(3);
    expect(quota.default.requiredTemplates).toBe(2);

    const report = evaluateSkillQuota(ALL_SEED_LEVELS);
    const ratchet = readCoverageRatchet();
    const debt = readSkillQuotaDebt();
    const debtEval = evaluateSkillQuotaWithDebt(report, debt);

    expect(report.totalSkills).toBeGreaterThanOrEqual(408);
    expect(report.totalValidLevels).toBeGreaterThanOrEqual(1329);
    expect(report.parseRejectedCount).toBe(0);
    expect(report.skillsWithZeroLevelsCount).toBeLessThanOrEqual(
      ratchet.max_skills_without_levels
    );
    expect(debt.max_violations).toBeLessThanOrEqual(38);
    expect(debtEval.unexcusedViolations).toEqual([]);
    expect(debtEval.staleEntries).toEqual([]);
    expect(debtEval.debtViolations.length).toBeLessThanOrEqual(
      debt.max_violations
    );
    expect(debtEval.passed).toBe(true);
  });

  it("Trần bậc thang CHỈ ĐƯỢC GIẢM — mốc ghi ngày mở kho là 178", () => {
    expect(readCoverageRatchet().max_skills_without_levels).toBeLessThanOrEqual(
      178
    );
  });

  describe("Sáu ca âm bắt buộc (BR-SKQ-01..04, BR-SKQ-06)", () => {
    it("Ca âm 1: Skill thiếu level làm cổng đỏ (BR-SKQ-02)", () => {
      // Giả lập catalog chỉ có 2 level cho C1.CNT.01 (yêu cầu là 3)
      const mockLevels: ContentSeed[] = [];
      for (let i = 1; i <= 2; i++) {
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
      expect(v?.actual).toBe(2);
      expect(v?.expected).toBe(3);
    });

    it("Ca âm 2: Skill đủ level nhưng dồn 1 khuôn duy nhất làm cổng đỏ (BR-SKQ-03)", () => {
      // Giả lập C1.CNT.01 có 3 level nhưng đều trên GT-001 (đòi hỏi >= 2 khuôn)
      const mockLevels: ContentSeed[] = [];
      for (let i = 1; i <= 3; i++) {
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
      expect(v?.expected).toBe(2);
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

    it("Ca âm 7: level dạy KHÔNG được tính vào hạn ngạch level chơi (BR-SKQ-08)", () => {
      // 2 level chơi cộng 1 level dạy cho một kỹ năng C1 (hạn ngạch 3).
      // Đếm chung thì đủ 3; BR-SKQ-08 loại level dạy nên vẫn phải báo thiếu 1.
      const skillCode = "C1.NREC.01";
      const assessLevels: ContentSeed[] = Array.from({ length: 2 }, (_, i) => ({
        ...VALID_GAME_LEVEL_SEED,
        header: {
          ...VALID_GAME_LEVEL_SEED.header,
          code: `GL-C1-NREC-PLAY-${String(i + 1).padStart(4, "0")}`,
          template_code: "GT-001",
          skill_codes: [skillCode],
        },
      }));

      const teachLevel: ContentSeed = {
        ...VALID_GAME_LEVEL_SEED,
        header: {
          ...VALID_GAME_LEVEL_SEED.header,
          code: "GL-C1-NREC-INTRO-9001",
          template_code: "GT-000",
          skill_codes: [skillCode],
        },
        content_pack: {
          target_concept: "number_1",
          intro_type: "visual_demonstration",
          audio_prompt: "Đây là số 1",
          interactive_element: "tap_to_continue",
        },
      };

      const report = evaluateSkillQuota([...assessLevels, teachLevel]);
      const quotaViolations = report.violations.filter(
        (v) => v.skill_code === skillCode && v.ruleId === "BR-SKQ-02"
      );
      expect(quotaViolations).toHaveLength(1);
      expect(quotaViolations[0]?.actual).toBe(2);
    });

    it("Ca âm 8: phát sinh nợ mới BR-SKQ-02/03 ngoài skill-quota-debt.json làm cổng đỏ", () => {
      const reduced = ALL_SEED_LEVELS.filter(
        (lvl) => !lvl.header.skill_codes.includes("C1.CNT.01")
      );
      reduced.push({
        ...VALID_GAME_LEVEL_SEED,
        header: {
          ...VALID_GAME_LEVEL_SEED.header,
          code: "GL-C1-CNT01-DEBT-NEW-0001",
          template_code: "GT-001",
          skill_codes: ["C1.CNT.01"],
        },
      });

      const report = evaluateSkillQuota(reduced);
      const debtEval = evaluateSkillQuotaWithDebt(report);
      expect(debtEval.passed).toBe(false);
      expect(
        debtEval.unexcusedViolations.some(
          (v) => v.skill_code === "C1.CNT.01" && v.ruleId === "BR-SKQ-02"
        )
      ).toBe(true);
      expect(
        debtEval.unexcusedViolations.some(
          (v) => v.skill_code === "C1.CNT.01" && v.ruleId === "BR-SKQ-03"
        )
      ).toBe(true);
    });

    it("Ca âm 9: kỹ năng trong sổ nợ bị tụt số level dưới min_levels làm cổng đỏ", () => {
      let keptCount = 0;
      const reduced = ALL_SEED_LEVELS.filter((lvl) => {
        if (
          lvl.header.template_code !== "GT-000" &&
          lvl.header.skill_codes.includes("C5.VOC.06")
        ) {
          keptCount++;
          return keptCount <= 1;
        }
        return true;
      });

      const report = evaluateSkillQuota(reduced);
      const debtEval = evaluateSkillQuotaWithDebt(report);
      expect(debtEval.passed).toBe(false);
      expect(
        debtEval.unexcusedViolations.some(
          (v) => v.skill_code === "C5.VOC.06" && v.ruleId === "BR-SKQ-02"
        )
      ).toBe(true);
    });
  });
});
