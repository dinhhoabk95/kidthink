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

    let pubLevel: any;
    let draftLevel: any;
    const rand = Math.floor(1000 + Math.random() * 8999);
    const code1 = `GL-C1-CNT-TEST-${rand}`;
    const code2 = `GL-C1-CNT-TEST-${rand + 1}`;
    const entityId1 = Math.floor(100_000 + Math.random() * 800_000);
    const entityId2 = Math.floor(100_000 + Math.random() * 800_000);

    if (skillId) {
      // Insert 1 published level and 1 draft level
      pubLevel = await db
        .insert(gameLevels)
        .values({
          entityId: entityId1,
          code: code1,
          contentVersion: 1,
          templateId,
          titleVi: "Level Published Test",
          contentPack: {},
          difficultyParams: {},
          accessTier: "free",
          status: "published",
        })
        .returning();

      draftLevel = await db
        .insert(gameLevels)
        .values({
          entityId: entityId2,
          code: code2,
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

    try {
      invalidateTaxonomyManagerCache();
      const event = mockEvent("content_reviewer");
      const res = await handler(event);

      expect(res).toBeDefined();
      expect(res.as_of).toBeDefined();
      expect(Array.isArray(res.competencies)).toBe(true);
      expect(res.competencies.length).toBeGreaterThan(0);

      // Verify draft vs published count structure on skills
      const c1 = res.competencies.find((c: any) => c.code === "C1");
      expect(c1).toBeDefined();
      const numStrand = res.strands.find((s: any) => s.code === "C1.NUM");
      expect(numStrand).toBeDefined();
      const cntSkill = res.skills.find(
        (sk: any) => sk.code === "C1.CNT.99" || sk.code === "C1.CNT.01"
      );
      expect(cntSkill).toBeDefined();
      expect(typeof cntSkill.published_count).toBe("number");
      expect(typeof cntSkill.draft_count).toBe("number");
      expect(cntSkill.published_count).toBeGreaterThanOrEqual(1);
      expect(cntSkill.draft_count).toBeGreaterThanOrEqual(1);
      expect(typeof cntSkill.is_gap).toBe("boolean");
    } finally {
      if (pubLevel?.[0]?.id) {
        await db
          .delete(contentSkillMap)
          .where(eq(contentSkillMap.entityId, pubLevel[0].id));
        await db.delete(gameLevels).where(eq(gameLevels.id, pubLevel[0].id));
      }
      if (draftLevel?.[0]?.id) {
        await db
          .delete(contentSkillMap)
          .where(eq(contentSkillMap.entityId, draftLevel[0].id));
        await db.delete(gameLevels).where(eq(gameLevels.id, draftLevel[0].id));
      }
      invalidateTaxonomyManagerCache();
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
