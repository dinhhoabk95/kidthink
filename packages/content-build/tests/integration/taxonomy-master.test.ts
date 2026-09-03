import { getOwnerDb } from "@mindkid/db";
import { describe, expect, it } from "vitest";
import {
  parseTaxonomyDocs,
  seedTaxonomyMasterData,
  validateTaxonomyInvariants,
} from "../../src/seed-master/taxonomy/index.js";

const CYCLE_REGEX = /Cycle detected in skill prerequisites/;
const BR_TAX_02_REGEX = /BR-TAX-02 violation/;

describe("Taxonomy Master Seeder & Invariants (BR-TAX-01..09)", () => {
  it("parses docs/taxonomy/ and satisfies BR-TAX-09 counts", () => {
    const skills = parseTaxonomyDocs("docs/taxonomy");
    expect(skills.length).toBe(408);
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
});
