import { getOwnerDb, skillDatasets, skills } from "@mindkid/db";
import type { SkillDataset } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import { afterEach, describe, expect, it } from "vitest";
import {
  getAllTaxonomySkills,
  parseTaxonomyDocs,
  seedSkillDatasetsStep,
  seedTaxonomyMasterData,
  validateTaxonomyInvariants,
} from "#src/seed-master/taxonomy/index";

const CYCLE_REGEX = /Cycle detected in skill prerequisites/;
const BR_TAX_02_REGEX = /BR-TAX-02 violation/;
const BR_TAX_03_REGEX = /BR-TAX-03 violation/;
const BR_TAX_04_REGEX = /BR-TAX-04 violation/;
const BR_TAX_05_REGEX = /BR-TAX-05 violation/;

describe("Taxonomy Master Seeder & Invariants (BR-TAX-01..09)", () => {
  afterEach(async () => {
    const db = getOwnerDb();
    await db
      .delete(skillDatasets)
      .where(eq(skillDatasets.conceptLabel, "Test Axes Dataset"));
  });
  it("parses docs/taxonomy/ and satisfies BR-TAX-09 counts", () => {
    const skills = parseTaxonomyDocs("docs/taxonomy");
    expect(skills.length).toBeGreaterThanOrEqual(408);
  });

  it("loads all TypeScript SKILL_IDENTITIES and validates invariants (BR-TAX-01..05)", () => {
    const tsSkills = getAllTaxonomySkills();
    expect(tsSkills.length).toBeGreaterThanOrEqual(408);
    expect(() => validateTaxonomyInvariants(tsSkills)).not.toThrow();
  });

  it("validates invariants without throwing on valid taxonomy docs", () => {
    const skills = parseTaxonomyDocs("docs/taxonomy");
    expect(() => validateTaxonomyInvariants(skills)).not.toThrow();
  });

  it("Ca âm BR-TAX-01: prerequisite cycle throws before INSERT", () => {
    const cyclicSkill = {
      code: "C1.CNT.99",
      strand_code: "C1.CNT",
      competency_code: "C1",
      name: "Cyclic Skill",
      age_min: 3,
      age_max: 4,
      difficulty: 1,
      thinking_processes: ["solve"],
      prerequisites: ["C1.CNT.99"],
      learning_objectives: [
        {
          code: "C1.CNT.99.01",
          behaviour: "b",
          observable_criteria: "o",
          position: 1,
        },
        {
          code: "C1.CNT.99.02",
          behaviour: "b",
          observable_criteria: "o",
          position: 2,
        },
        {
          code: "C1.CNT.99.03",
          behaviour: "b",
          observable_criteria: "o",
          position: 3,
        },
      ],
      tier: "basic" as const,
    };
    const validSkills = parseTaxonomyDocs("docs/taxonomy");
    const dirtySkills = [...validSkills.slice(1), cyclicSkill];

    expect(() => validateTaxonomyInvariants(dirtySkills)).toThrow(CYCLE_REGEX);
  });

  it("Ca âm BR-TAX-02: skill with < 3 LOs throws error", () => {
    const validSkills = parseTaxonomyDocs("docs/taxonomy");
    const incompleteSkills = validSkills.map((s, idx) =>
      idx === 0
        ? { ...s, learning_objectives: s.learning_objectives.slice(0, 2) }
        : s
    );

    expect(() => validateTaxonomyInvariants(incompleteSkills)).toThrow(
      BR_TAX_02_REGEX
    );
  });

  it("Ca âm BR-TAX-03: skill with unknown strand or duplicate LO throws error", () => {
    const validSkills = parseTaxonomyDocs("docs/taxonomy");
    const invalidStrandSkills = validSkills.map((s, idx) =>
      idx === 0 ? { ...s, strand_code: "C1.UNKNOWN" } : s
    );
    expect(() => validateTaxonomyInvariants(invalidStrandSkills)).toThrow(
      BR_TAX_03_REGEX
    );

    const firstLoCode =
      validSkills[0]?.learning_objectives[0]?.code ?? "LO-C1.CNT.01-01";
    const dupLoSkills = validSkills.map((s, idx) =>
      idx === 1
        ? {
            ...s,
            learning_objectives: s.learning_objectives.map((lo, lIdx) =>
              lIdx === 0 ? { ...lo, code: firstLoCode } : lo
            ),
          }
        : s
    );
    expect(() => validateTaxonomyInvariants(dupLoSkills)).toThrow(
      BR_TAX_03_REGEX
    );
  });

  it("Ca âm BR-TAX-04: invalid age range, difficulty, or thinking process throws error", () => {
    const validSkills = parseTaxonomyDocs("docs/taxonomy");
    const badAgeSkills = validSkills.map((s, idx) =>
      idx === 0 ? { ...s, age_min: 5, age_max: 4 } : s
    );
    expect(() => validateTaxonomyInvariants(badAgeSkills)).toThrow(
      BR_TAX_04_REGEX
    );

    const badDiffSkills = validSkills.map((s, idx) =>
      idx === 0 ? { ...s, difficulty: 6 } : s
    );
    expect(() => validateTaxonomyInvariants(badDiffSkills)).toThrow(
      BR_TAX_04_REGEX
    );

    const badThinkingSkills = validSkills.map((s, idx) =>
      idx === 0 ? { ...s, thinking_processes: ["not_a_process"] } : s
    );
    expect(() => validateTaxonomyInvariants(badThinkingSkills)).toThrow(
      BR_TAX_04_REGEX
    );
  });

  it("Ca âm BR-TAX-05: prerequisite difficulty > skill difficulty throws error", () => {
    const validSkills = parseTaxonomyDocs("docs/taxonomy");
    const secondSkillCode = validSkills[1]?.code ?? "C1.CNT.02";
    const badPrereqDiffSkills = validSkills.map((s, idx) => {
      if (idx === 0) {
        return { ...s, difficulty: 1, prerequisites: [secondSkillCode] };
      }
      if (idx === 1) {
        return { ...s, difficulty: 3, prerequisites: [] };
      }
      return s;
    });
    expect(() => validateTaxonomyInvariants(badPrereqDiffSkills)).toThrow(
      BR_TAX_05_REGEX
    );
  });

  it("seeds database idempotently and populates all tables (BR-TAX-09)", async () => {
    const db = getOwnerDb();
    const stats1 = await seedTaxonomyMasterData(db, "docs/taxonomy");
    expect(stats1.competencyCount).toBe(6);
    expect(stats1.strandCount).toBeGreaterThanOrEqual(41);
    expect(stats1.skillCount).toBeGreaterThanOrEqual(134);
    expect(stats1.loCount).toBeGreaterThanOrEqual(400);

    // Idempotent re-run
    const stats2 = await seedTaxonomyMasterData(db, "docs/taxonomy");
    expect(stats2.skillCount).toBe(stats1.skillCount);
  }, 60_000);

  it("T2.4 & T2.5: axes và extendsSkillCode ghi xuống DB và không bị ghi đè thành null (BR-STS-04)", async () => {
    const db = getOwnerDb();
    const skillList = await db.select().from(skills).limit(1);
    const existingSkill = skillList[0];
    if (!existingSkill) {
      expect.fail(
        "Bảng skills rỗng, không thể chạy test seedSkillDatasetsStep"
      );
      throw new Error("Bảng skills rỗng");
    }
    const skillIdMap = new Map<string, number>([
      [existingSkill.code, existingSkill.id],
    ]);

    const testAxes = { size: ["small", "medium", "large"] };
    const mockDataset: SkillDataset = {
      skill_code: existingSkill.code,
      concept_label: "Test Axes Dataset",
      surface: "game",
      items: [],
      ladder: [],
      phrasing: { prompt_template: "test" },
      axes: testAxes,
      extends: "C1.NREC.01",
    };

    // T2.4: Gọi seedSkillDatasetsStep thật, đọc lại từ skill_datasets
    await seedSkillDatasetsStep(db, skillIdMap, {
      [existingSkill.code]: mockDataset,
    });

    const records1 = await db
      .select()
      .from(skillDatasets)
      .where(eq(skillDatasets.code, existingSkill.code))
      .limit(1);
    expect(records1.length).toBe(1);
    const record1 = records1[0];
    expect(record1?.axes).not.toBeNull();
    expect(record1?.axes).toEqual(testAxes);
    expect(record1?.extendsSkillCode).toBe("C1.NREC.01");

    // T2.5: Chạy lần hai qua seedSkillDatasetsStep thật, khẳng định axes không bị ghi đè thành null
    await seedSkillDatasetsStep(db, skillIdMap, {
      [existingSkill.code]: mockDataset,
    });

    const records2 = await db
      .select()
      .from(skillDatasets)
      .where(eq(skillDatasets.code, existingSkill.code))
      .limit(1);
    expect(records2.length).toBe(1);
    const record2 = records2[0];
    expect(record2?.axes).not.toBeNull();
    expect(record2?.axes).toEqual(testAxes);
  });
});
