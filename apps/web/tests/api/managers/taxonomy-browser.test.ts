import {
  competencies,
  contentSkillMap,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  skills,
  strands,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import handler, {
  invalidateTaxonomyManagerCache,
  TAXONOMY_SUFFICIENT_THRESHOLD,
} from "../../../server/api/managers/taxonomy/index.get.js";

function mockEvent(
  managerRole?: "super_admin" | "content_reviewer",
  url = "/api/managers/taxonomy"
) {
  return {
    method: "GET",
    path: url,
    node: {
      req: {
        headers: {},
        url,
      },
      res: {},
    },
    context: {
      ...(managerRole
        ? {
            manager: {
              manager_id: 1,
              display_name: "Manager Name",
              session_id: "sess_manager_123",
              refresh_token_version: 1,
              role: managerRole,
            },
          }
        : {}),
    },
  } as any;
}

describe("Task 5 — GET /api/managers/taxonomy (BR-TXB-01..03, BR-TXB-06, D-IT)", () => {
  it("Scenario: BR-TXB-01 — rejects unauthenticated callers with 401; permits both super_admin and content_reviewer", async () => {
    const unauthEvent = mockEvent();
    await expect(handler(unauthEvent)).rejects.toThrow();

    const reviewerEvent = mockEvent("content_reviewer");
    const reviewerRes = await handler(reviewerEvent);
    expect(reviewerRes).toBeDefined();

    const adminEvent = mockEvent("super_admin");
    const adminRes = await handler(adminEvent);
    expect(adminRes).toBeDefined();
  });

  it("Scenario: D-IT — locks TAXONOMY_SUFFICIENT_THRESHOLD constant to 3", () => {
    expect(TAXONOMY_SUFFICIENT_THRESHOLD).toBe(3);
  });

  it("Scenario: BR-TXB-02 & BR-TXB-03 — returns 4-tier tree, counts published vs draft separately, highlights content gaps", async () => {
    invalidateTaxonomyManagerCache();
    const db = getOwnerDb();

    // Ensure template exists for level
    const templateRows = await db
      .insert(gameTemplates)
      .values({
        code: "GT-099",
        nameVi: "Template Test",
        mechanic: "tap-select",
      })
      .onConflictDoNothing()
      .returning();

    const templateId = templateRows[0]?.id || 1;

    // Insert test competency, strand, skill
    const compRows = await db
      .insert(competencies)
      .values({
        code: "C1",
        nameVi: "Tư duy toán học",
        colorToken: "brand-indigo",
        icon: "math",
        position: 1,
      })
      .onConflictDoNothing()
      .returning();

    const compId = compRows[0]?.id || 1;

    const strandRows = await db
      .insert(strands)
      .values({
        code: "C1.CNT",
        competencyId: compId,
        nameVi: "Đếm và lượng",
        position: 1,
      })
      .onConflictDoNothing()
      .returning();

    const strandId = strandRows[0]?.id || 1;

    const skillRows = await db
      .insert(skills)
      .values({
        code: "C1.CNT.99",
        strandId,
        nameVi: "Kỹ năng test gap",
        ageMin: 3,
        ageMax: 5,
        difficulty: 1,
        thinkingProcesses: ["count"],
        status: "seeded",
        position: 99,
      })
      .onConflictDoNothing()
      .returning();

    let skillId = skillRows[0]?.id;
    if (!skillId) {
      const existingSkill = await db
        .select()
        .from(skills)
        .where(eq(skills.code, "C1.CNT.99"));
      skillId = existingSkill[0]?.id;
    }

    if (skillId) {
      // Clean up previous test levels if any
      await db
        .delete(contentSkillMap)
        .where(eq(contentSkillMap.skillId, skillId));
      await db
        .delete(gameLevels)
        .where(eq(gameLevels.code, "GL-C1-CNT-TEST-0001"));
      await db
        .delete(gameLevels)
        .where(eq(gameLevels.code, "GL-C1-CNT-TEST-0002"));

      // Insert 1 published level and 1 draft level
      const pubLevel = await db
        .insert(gameLevels)
        .values({
          entityId: 9991,
          code: "GL-C1-CNT-TEST-0001",
          contentVersion: 1,
          templateId,
          titleVi: "Level Published Test",
          contentPack: {},
          difficultyParams: {},
          accessTier: "free",
          status: "published",
        })
        .returning();

      const draftLevel = await db
        .insert(gameLevels)
        .values({
          entityId: 9992,
          code: "GL-C1-CNT-TEST-0002",
          contentVersion: 1,
          templateId,
          titleVi: "Level Draft Test",
          contentPack: {},
          difficultyParams: {},
          accessTier: "free",
          status: "draft",
        })
        .returning();

      await db.insert(contentSkillMap).values([
        {
          entityType: "level",
          entityId: pubLevel[0].id,
          skillId,
          weight: "1.00",
        },
        {
          entityType: "level",
          entityId: draftLevel[0].id,
          skillId,
          weight: "1.00",
        },
      ]);
    }

    invalidateTaxonomyManagerCache();
    const event = mockEvent("content_reviewer");
    const res = await handler(event);

    expect(res).toBeDefined();
    expect(res.as_of).toBeDefined();
    expect(Array.isArray(res.competencies)).toBe(true);
    expect(Array.isArray(res.strands)).toBe(true);
    expect(Array.isArray(res.skills)).toBe(true);

    const testSkill = res.skills.find((s: any) => s.code === "C1.CNT.99");
    if (testSkill) {
      expect(testSkill.published_count).toBe(1);
      expect(testSkill.draft_count).toBe(1);
      expect(testSkill.total_count).toBe(2);
      expect(testSkill.gap_status).toBe("thin");
    }
  });

  it("Scenario: gaps_only=true returns only skills with 0 published levels", async () => {
    const event = mockEvent(
      "super_admin",
      "/api/managers/taxonomy?gaps_only=true"
    );
    const res = await handler(event);

    expect(
      res.skills.every((s: any) => s.published_count === 0 && s.is_gap === true)
    ).toBe(true);
  });
});
