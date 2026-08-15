import {
  competencies,
  getOwnerDb,
  learningObjectives,
  skillPrerequisites,
  skills,
  strands,
} from "@kidthink/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import handler from "../../../server/api/managers/taxonomy/skills/[code].get.js";

const AUTHOR_URL_REGEX =
  /(?:\/studio\/levels|\/admin\/seed-authoring)\?skill_code=C2\.GEO\.99/;

function mockEvent(
  code: string,
  managerRole?: "super_admin" | "content_reviewer"
) {
  return {
    method: "GET",
    path: `/api/managers/taxonomy/skills/${code}`,
    node: {
      req: {
        headers: {},
        url: `/api/managers/taxonomy/skills/${code}`,
      },
      res: {},
    },
    context: {
      params: { code },
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

describe("Task 6 — GET /api/managers/taxonomy/skills/[code] (BR-TXB-04, BR-TXB-05, D-IU, D-IV)", () => {
  it("rejects unauthenticated request with 401; returns 404 for unknown skill code", async () => {
    const unauthEvent = mockEvent("C1.CNT.01");
    await expect(handler(unauthEvent)).rejects.toThrow();

    const notFoundEvent = mockEvent("C1.NOTEXIST.99", "super_admin");
    try {
      await handler(notFoundEvent);
      expect.fail("Should throw 404");
    } catch (err: any) {
      expect(err.statusCode || err.status).toBe(404);
    }
  });

  it("Scenario: BR-TXB-04 & BR-TXB-05 & D-IU — returns 6 sections with 2-way prerequisite graph and seeder authoring action", async () => {
    const db = getOwnerDb();

    const compRows = await db
      .insert(competencies)
      .values({
        code: "C2",
        nameVi: "Hình học và không gian",
        colorToken: "brand-indigo",
        icon: "geometry",
        position: 2,
      })
      .onConflictDoNothing()
      .returning();

    const compId = compRows[0]?.id || 1;

    const strandRows = await db
      .insert(strands)
      .values({
        code: "C2.GEO",
        competencyId: compId,
        nameVi: "Hình dạng phẳng",
        position: 1,
      })
      .onConflictDoNothing()
      .returning();

    const existingStrand = await db
      .select({ id: strands.id })
      .from(strands)
      .where(eq(strands.code, "C2.GEO"))
      .limit(1);

    const strandId = existingStrand[0]?.id || strandRows[0]?.id || 1;

    const s1Rows = await db
      .insert(skills)
      .values({
        code: "C2.GEO.98",
        strandId,
        nameVi: "Nhận biết hình tròn",
        ageMin: 3,
        ageMax: 4,
        difficulty: 1,
        thinkingProcesses: ["observe", "match"],
        whatAxis: ["geometry", "shape"],
        status: "seeded",
        position: 98,
      })
      .onConflictDoNothing()
      .returning();

    const s2Rows = await db
      .insert(skills)
      .values({
        code: "C2.GEO.99",
        strandId,
        nameVi: "Phân biệt hình tròn và hình vuông",
        ageMin: 3,
        ageMax: 5,
        difficulty: 2,
        thinkingProcesses: ["compare", "sort"],
        whatAxis: ["geometry", "shape"],
        status: "seeded",
        position: 99,
      })
      .onConflictDoNothing()
      .returning();

    const s1Id =
      s1Rows[0]?.id ??
      (
        await db
          .select({ id: skills.id })
          .from(skills)
          .where(eq(skills.code, "C2.GEO.98"))
      )[0]?.id;
    const s2Id =
      s2Rows[0]?.id ??
      (
        await db
          .select({ id: skills.id })
          .from(skills)
          .where(eq(skills.code, "C2.GEO.99"))
      )[0]?.id;

    if (s1Id && s2Id) {
      // s2 requires s1 (s1 is upstream prereq for s2, and s1 unlocks s2)
      await db
        .insert(skillPrerequisites)
        .values({
          skillId: s2Id,
          prerequisiteId: s1Id,
          strength: "1.00",
        })
        .onConflictDoNothing();

      // LO for s2
      await db
        .insert(learningObjectives)
        .values({
          code: "LO-C2.GEO.99-01",
          skillId: s2Id,
          behaviourVi: "Chỉ ra điểm khác nhau giữa hình tròn và hình vuông",
          observableCriteriaVi: "Chọn đúng khi đưa ra 2 hình",
          position: 1,
        })
        .onConflictDoNothing();
    }

    const event = mockEvent("C2.GEO.99", "content_reviewer");
    const res = await handler(event);

    expect(res).toBeDefined();

    // Section 1: Identifiers
    expect(res.identifiers.code).toBe("C2.GEO.99");
    expect(res.identifiers.name).toBe("Phân biệt hình tròn và hình vuông");
    expect(res.identifiers.strand_code).toBe("C2.GEO");
    expect(res.identifiers.competency_code).toBe("C2");

    // Section 2: Attributes
    expect(res.attributes.age_min).toBe(3);
    expect(res.attributes.difficulty).toBe(2);
    expect(res.attributes.thinking_processes).toContain("compare");

    // Section 3: Learning Objectives
    expect(Array.isArray(res.learning_objectives)).toBe(true);

    // Section 4: 2-way Prerequisites (BR-TXB-05)
    expect(res.prerequisites.upstream).toBeDefined();
    expect(res.prerequisites.downstream).toBeDefined();
    expect(
      res.prerequisites.upstream.some((p: any) => p.code === "C2.GEO.98")
    ).toBe(true);

    // Section 5: Attached Content
    expect(res.attached_content).toBeDefined();
    expect(res.attached_content.levels).toBeDefined();

    // Section 6: Action button with studio link (BR-TXB-04, P2.6) + PR notice
    expect(res.actions.author_url).toMatch(AUTHOR_URL_REGEX);
    expect(res.actions.author_url).not.toContain("404");
    expect(res.actions.pr_notice).toContain("Pull Request");
  });
});
