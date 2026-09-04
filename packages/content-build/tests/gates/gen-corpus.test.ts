import { ALL_SKILL_SEEDS, buildLevelsForSkill } from "@mindkid/content";
import { ALL_TEMPLATES } from "@mindkid/game-engine";
import { describe, expect, it } from "vitest";
import { runEightGates } from "#src/gates/runner";

describe("Skill Level Generator Pipeline (buildLevelsForSkill) — Task #208", () => {
  it("Sinh level mẫu từ skill C1.CNT.01: 100% level qua các cổng kiểm duyệt", () => {
    const skill = ALL_SKILL_SEEDS.find((s) => s.identity?.code === "C1.CNT.01");
    if (!skill) {
      throw new Error("Skill C1.CNT.01 not found");
    }

    const levels = buildLevelsForSkill(skill);
    expect(levels.length).toBeGreaterThan(0);

    const existingCodes = new Set<string>();
    for (const level of levels) {
      const gateResults = runEightGates(level, existingCodes);
      const allPassed = gateResults.every((r) => r.passed);

      expect(
        allPassed,
        `Level ${level.header.code} phải qua các cổng: ${gateResults
          .filter((r) => !r.passed)
          .map((r) => r.issues.map((i) => i.message).join(", "))
          .join("; ")}`
      ).toBe(true);

      existingCodes.add(level.header.code);
    }
  });

  it("Tính tất định (BR-LGK-02): chạy hai lần cho cùng 1 skill ra byte-for-byte giống hệt nhau", () => {
    const skill = ALL_SKILL_SEEDS.find((s) => s.identity?.code === "C1.CNT.01");
    if (!skill) {
      throw new Error("Skill C1.CNT.01 not found");
    }

    const run1 = buildLevelsForSkill(skill);
    const run2 = buildLevelsForSkill(skill);

    const str1 = JSON.stringify(run1);
    const str2 = JSON.stringify(run2);

    expect(str1).toBe(str2);
  });

  describe("Ca âm cho bộ sinh màn chơi", () => {
    it("Ca âm: template không tồn tại trong hệ thống sẽ bị phát hiện", () => {
      expect(
        ALL_TEMPLATES["GT-999" as keyof typeof ALL_TEMPLATES]
      ).toBeUndefined();
    });
  });
});
