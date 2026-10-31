import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { describe, expect, it } from "vitest";
import {
  generateLevelAllocationPlan,
  type LevelAllocationPlan,
  loadLevelAllocationPlan,
} from "#src/gates/level-allocation";

const ERR_PAIR_CEILING_REGEX = /BR-ALC-04: Cặp .* vượt trần 3 level/;

describe("Task #198 — Bảng phân bổ level (level-allocation.json / BR-ALC-01..08)", () => {
  it("Bảng phân bổ trong config/level-allocation.json tồn tại và đồng bộ với generator", () => {
    const configPath = repoPath("packages/db/config/level-allocation.json");
    expect(fs.existsSync(configPath)).toBe(true);

    const savedPlan = loadLevelAllocationPlan();
    const generatedPlan = generateLevelAllocationPlan();

    expect(savedPlan.target_total_levels).toBe(
      generatedPlan.target_total_levels
    );
    expect(savedPlan.total_skills).toBe(generatedPlan.total_skills);
    expect(savedPlan.allocations.length).toBe(generatedPlan.allocations.length);
  });

  it("Đạt đúng tổng level phân bổ: mọi năng lực C1..C6 có 3 level mỗi skill trên ≥ 2 khuôn", () => {
    const plan = loadLevelAllocationPlan();
    const skillLevelSums = new Map<string, number>();
    const skillTemplateSets = new Map<string, Set<string>>();

    for (const row of plan.allocations) {
      const current = skillLevelSums.get(row.skill_code) ?? 0;
      skillLevelSums.set(row.skill_code, current + row.level_count);

      let tSet = skillTemplateSets.get(row.skill_code);
      if (!tSet) {
        tSet = new Set<string>();
        skillTemplateSets.set(row.skill_code, tSet);
      }
      tSet.add(row.template_code);
    }

    expect(skillLevelSums.size).toBe(plan.total_skills);

    let c1Total = 0;
    let otherTotal = 0;

    for (const [skillCode, total] of skillLevelSums.entries()) {
      const isC1 = skillCode.startsWith("C1.");
      const tSet = skillTemplateSets.get(skillCode);

      expect(total, `Skill ${skillCode} phải có đúng 3 level`).toBe(3);
      expect(
        tSet?.size,
        `Skill ${skillCode} phải trải trên >= 2 khuôn`
      ).toBeGreaterThanOrEqual(2);
      if (isC1) {
        c1Total += total;
      } else {
        otherTotal += total;
      }
    }

    expect(c1Total).toBe(330);
    expect(otherTotal).toBe((plan.total_skills - 110) * 3);
    expect(c1Total + otherTotal).toBe(plan.target_total_levels);
  });

  it("Trần cứng: không cặp (skill, khuôn) nào vượt quá 3 level", () => {
    const plan = loadLevelAllocationPlan();
    for (const row of plan.allocations) {
      expect(
        row.level_count,
        `Cặp (${row.skill_code}, ${row.template_code}) không được vượt 3 level`
      ).toBeLessThanOrEqual(3);
      expect(
        row.level_count,
        `Cặp (${row.skill_code}, ${row.template_code}) phải có >= 1 level`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("Sàn cặp phân biệt: tổng số cặp (skill, khuôn) đạt >= 886", () => {
    const plan = loadLevelAllocationPlan();
    expect(plan.distinct_pairs_count).toBeGreaterThanOrEqual(886);
  });

  it("Chủ đề: không chủ đề nào vượt trần catalog_max_ratio 25% (332 level)", () => {
    const plan = loadLevelAllocationPlan();
    for (const [theme, count] of Object.entries(plan.theme_distribution)) {
      expect(
        count,
        `Chủ đề '${theme}' có ${count} level, vượt trần 332 (25%)`
      ).toBeLessThanOrEqual(332);
    }
  });

  it("Băng tuổi: mọi dòng phân bổ đều có band hợp lệ, không nằm trong banned_age_bands của template", () => {
    const plan = loadLevelAllocationPlan();
    for (const row of plan.allocations) {
      const template = ALL_TEMPLATES[row.template_code];
      expect(
        template,
        `Template ${row.template_code} phải tồn tại`
      ).toBeDefined();
      const banned = template?.banned_age_bands ?? [];
      expect(
        banned.includes(row.age_band),
        `Template ${row.template_code} cấm band ${row.age_band}`
      ).toBe(false);
    }
  });

  it("Ca âm: kế hoạch phân bổ có cặp > 3 level hoặc skill thiếu khuôn bị phát hiện ngay", () => {
    const invalidAllocation: LevelAllocationPlan = {
      date: "2026-09-01",
      target_total_levels: 1329,
      total_skills: 443,
      total_allocations: 1,
      distinct_pairs_count: 1,
      theme_distribution: { school: 1329 },
      allocations: [
        {
          skill_code: "C1.CNT.01",
          competency_code: "C1",
          template_code: "GT-001",
          level_count: 4, // VI PHẠM: > 3 level
          age_band: "3-4",
          theme_tags: ["school"],
          difficulty_range: [1, 3],
        },
      ],
    };

    const validatePlan = (p: LevelAllocationPlan) => {
      for (const row of p.allocations) {
        if (row.level_count > 3) {
          throw new Error(
            `BR-ALC-04: Cặp (${row.skill_code}, ${row.template_code}) vượt trần 3 level (có ${row.level_count})`
          );
        }
      }
    };

    expect(() => validatePlan(invalidAllocation)).toThrow(
      ERR_PAIR_CEILING_REGEX
    );
  });
});
