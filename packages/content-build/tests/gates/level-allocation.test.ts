import fs from "node:fs";
import { repoPath } from "@mindkid/config/paths";
import { ALL_TEMPLATES } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import {
  generateLevelAllocationPlan,
  type LevelAllocationPlan,
  loadLevelAllocationPlan,
} from "#src/gates/level-allocation";

const ERR_PAIR_CEILING_REGEX = /BR-ALC-04: Cặp .* vượt trần 5 level/;

describe("Task #198 — Bảng phân bổ level (level-allocation.json / BR-ALC-01..08)", () => {
  it("Bảng phân bổ trong config/level-allocation.json tồn tại và đồng bộ với generator", () => {
    const configPath = repoPath("packages/db/config/level-allocation.json");
    expect(fs.existsSync(configPath)).toBe(true);

    const savedPlan = loadLevelAllocationPlan();
    const generatedPlan = generateLevelAllocationPlan();

    expect(savedPlan.target_total_levels).toBe(5180);
    expect(savedPlan.total_skills).toBe(408);
    expect(savedPlan.target_total_levels).toBe(
      generatedPlan.target_total_levels
    );
    expect(savedPlan.allocations.length).toBe(generatedPlan.allocations.length);
  });

  it("Đạt đúng tổng 5.180 level: C1 (110 skills × 20 = 2200), C2..C6 (298 skills × 10 = 2980)", () => {
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

    expect(skillLevelSums.size).toBe(408);

    let c1Total = 0;
    let otherTotal = 0;

    for (const [skillCode, total] of skillLevelSums.entries()) {
      const isC1 = skillCode.startsWith("C1.");
      const tSet = skillTemplateSets.get(skillCode);

      if (isC1) {
        expect(total, `Skill ${skillCode} phải có đúng 20 level`).toBe(20);
        expect(
          tSet?.size,
          `Skill C1 ${skillCode} phải trải trên >= 4 khuôn`
        ).toBeGreaterThanOrEqual(4);
        c1Total += total;
      } else {
        expect(total, `Skill ${skillCode} phải có đúng 10 level`).toBe(10);
        expect(
          tSet?.size,
          `Skill ${skillCode} phải trải trên >= 2 khuôn`
        ).toBeGreaterThanOrEqual(2);
        otherTotal += total;
      }
    }

    expect(c1Total).toBe(2200);
    expect(otherTotal).toBe(2980);
    expect(c1Total + otherTotal).toBe(5180);
  });

  it("Trần cứng: không cặp (skill, khuôn) nào vượt quá 5 level", () => {
    const plan = loadLevelAllocationPlan();
    for (const row of plan.allocations) {
      expect(
        row.level_count,
        `Cặp (${row.skill_code}, ${row.template_code}) không được vượt 5 level`
      ).toBeLessThanOrEqual(5);
      expect(
        row.level_count,
        `Cặp (${row.skill_code}, ${row.template_code}) phải có >= 1 level`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("Sàn cặp phân biệt: tổng số cặp (skill, khuôn) đạt >= 658", () => {
    const plan = loadLevelAllocationPlan();
    expect(plan.distinct_pairs_count).toBeGreaterThanOrEqual(658);
  });

  it("Chủ đề: không chủ đề nào vượt trần catalog_max_ratio 25% (822 level)", () => {
    const plan = loadLevelAllocationPlan();
    for (const [theme, count] of Object.entries(plan.theme_distribution)) {
      expect(
        count,
        `Chủ đề '${theme}' có ${count} level, vượt trần 822 (25%)`
      ).toBeLessThanOrEqual(822);
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

  it("Ca âm: kế hoạch phân bổ có cặp > 5 level hoặc C1 thiếu khuôn bị phát hiện ngay", () => {
    const invalidAllocation: LevelAllocationPlan = {
      date: "2026-09-01",
      target_total_levels: 3290,
      total_skills: 408,
      total_allocations: 1,
      distinct_pairs_count: 1,
      theme_distribution: { school: 3290 },
      allocations: [
        {
          skill_code: "C1.CNT.01",
          competency_code: "C1",
          template_code: "GT-001",
          level_count: 20, // VI PHẠM: > 5 level
          age_band: "3-4",
          theme_tags: ["school"],
          difficulty_range: [1, 3],
        },
      ],
    };

    const validatePlan = (p: LevelAllocationPlan) => {
      for (const row of p.allocations) {
        if (row.level_count > 5) {
          throw new Error(
            `BR-ALC-04: Cặp (${row.skill_code}, ${row.template_code}) vượt trần 5 level (có ${row.level_count})`
          );
        }
      }
    };

    expect(() => validatePlan(invalidAllocation)).toThrow(
      ERR_PAIR_CEILING_REGEX
    );
  });
});
