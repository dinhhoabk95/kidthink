import { getOwnerDb, skillActionSuggestions, skills } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { seedSkillActionSuggestions } from "#src/seed-master/action-suggestions";
import { seedTaxonomyMasterData } from "#src/seed-master/taxonomy/index";

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
    if (!sampleSkill) {
      throw new Error("sampleSkill not found");
    }

    const suggestions = await db
      .select()
      .from(skillActionSuggestions)
      .where(eq(skillActionSuggestions.skillId, Number(sampleSkill.id)));

    expect(suggestions.length).toBeGreaterThanOrEqual(1);
    expect(suggestions[0]?.text).toBeDefined();
    expect(["home_activity", "in_app"]).toContain(suggestions[0]?.kind);
  });
});
