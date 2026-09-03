import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  createNewVersion,
  deleteContentEntity,
  getOwnerDb,
  rollbackVersion,
  transitionContent,
} from "#src/index";
import { gameLevels } from "#src/schema/game";
import { managers } from "#src/schema/identity";
import { contentSkillMap } from "#src/schema/tagging";
import { competencies, skills, strands } from "#src/schema/taxonomy";

async function setupTestData() {
  const db = getOwnerDb();
  const randNum = Math.floor(Math.random() * 900) + 100;
  const seq = `${randNum}`;
  const num4 = (Math.floor(Math.random() * 9000) + 1000).toString();
  const letters = ["AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ"];
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const glCode = `GL-C1-${l1}-${l2}-${num4}`;

  // Insert competency, strand, skill
  const compCode = "C1";
  const strandCode = `${compCode}.CNT`;
  const skillCode = `${compCode}.CNT.01`;

  const [comp] = await db
    .insert(competencies)
    .values({
      code: compCode,
      name: "Năng lực toán",
      colorToken: "blue",
      icon: "math",
    })
    .onConflictDoUpdate({
      target: competencies.code,
      set: { name: "Năng lực toán" },
    })
    .returning();

  const compRows = await db
    .select()
    .from(competencies)
    .where(eq(competencies.code, compCode));
  const compId = comp ? comp.id : compRows[0]?.id;
  if (!compId) {
    throw new Error("Failed to find competency id");
  }

  const [strd] = await db
    .insert(strands)
    .values({
      code: strandCode,
      competencyId: compId,
      name: "Mạch kiến thức",
    })
    .onConflictDoUpdate({
      target: strands.code,
      set: { competencyId: compId, name: "Mạch kiến thức" },
    })
    .returning();

  const strdRows = await db
    .select()
    .from(strands)
    .where(eq(strands.code, strandCode));
  const strdId = strd ? strd.id : strdRows[0]?.id;
  if (!strdId) {
    throw new Error("Failed to find strand id");
  }

  const [sk] = await db
    .insert(skills)
    .values({
      code: skillCode,
      strandId: strdId,
      name: "Kỹ năng đếm",
      ageMin: 3,
      ageMax: 5,
      difficulty: 1,
    })
    .onConflictDoUpdate({
      target: skills.code,
      set: { strandId: strdId, name: "Kỹ năng đếm" },
    })
    .returning();

  const skillRows = await db
    .select()
    .from(skills)
    .where(eq(skills.code, skillCode));
  const skillId = sk ? sk.id : skillRows[0]?.id;
  if (!skillId) {
    throw new Error("Failed to find skill id");
  }

  // Template code
  const templateCode = "GT-001";

  // Insert manager
  const [mgr] = await db
    .insert(managers)
    .values({
      email: `mgr_${seq}_${num4}@test.com`,
      passwordHash: "hash",
      displayName: `Manager ${seq}`,
      role: "content_reviewer",
    })
    .returning();
  if (!mgr) {
    throw new Error("Failed to insert mgr");
  }

  // Insert super_admin manager
  const [admin] = await db
    .insert(managers)
    .values({
      email: `admin_${seq}_${num4}@test.com`,
      passwordHash: "hash",
      displayName: `Super Admin ${seq}`,
      role: "super_admin",
    })
    .returning();
  if (!admin) {
    throw new Error("Failed to insert admin");
  }

  // Insert initial game level draft
  const [level] = await db
    .insert(gameLevels)
    .values({
      entityId: randNum * 10,
      code: glCode,
      contentVersion: 1,
      templateCode,
      title: "Mức chơi thử nghiệm 1",
      description: "Mô tả",
      accessTier: "standard",
      ageMin: 3,
      ageMax: 5,
      difficulty: 1,
      status: "draft",
      contentPack: {
        hasCorrectAnswer: true,
        items: [{ id: 1, isCorrect: true }],
      },
      difficultyParams: { speed: 1 },
      createdByManagerId: mgr.id,
    })
    .returning();
  if (!level) {
    throw new Error("Failed to insert level");
  }

  // Insert contentSkillMap
  await db.insert(contentSkillMap).values({
    entityType: "game_level",
    entityId: level.id,
    skillId,
    weight: "1.00",
  });

  return { templateCode, mgr, admin, level, glCode };
}

describe("P0.6 Tasks 5, 6, 7 — Lifecycle & Versioning Services Integration Tests", () => {
  it("Task 5: transition flow draft -> in_review -> approved -> published with permissions", async () => {
    const { mgr, level } = await setupTestData();

    // 1. draft -> in_review
    const res1 = await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "in_review",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    expect(res1.status).toBe("in_review");

    // 2. in_review -> approved
    const res2 = await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "approved",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    expect(res2.status).toBe("approved");

    // 3. approved -> published (runs checklist §7.3)
    const res3 = await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "published",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    expect(res3.status).toBe("published");
  });

  it("Task 5: BR-CLC-05 — rejected bắt buộc lý do >= 10 ký tự", async () => {
    const { mgr, level } = await setupTestData();

    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "in_review",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });

    // Rejection with short reason should throw REJECTED_REASON_TOO_SHORT
    await expect(
      transitionContent({
        entityType: "game_level",
        entityDbId: level.id,
        toStatus: "rejected",
        actorManagerId: mgr.id,
        actorRole: "content_reviewer",
        reason: "Ngắn",
      })
    ).rejects.toSatisfy((err: any) => err.code === "REJECTED_REASON_TOO_SHORT");

    // Rejection with >= 10 chars succeeds
    const res = await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "rejected",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
      reason: "Nội dung bài tập chưa đạt yêu cầu sư phạm",
    });
    expect(res.status).toBe("rejected");
  });

  it("Task 5: expectedVersion xung đột trả 409 VERSION_CONFLICT", async () => {
    const { mgr, level } = await setupTestData();

    await expect(
      transitionContent({
        entityType: "game_level",
        entityDbId: level.id,
        toStatus: "in_review",
        actorManagerId: mgr.id,
        actorRole: "content_reviewer",
        expectedVersion: 99, // Mismatch
      })
    ).rejects.toSatisfy((err: any) => err.code === "VERSION_CONFLICT");
  });

  it("Task 6: Publish version 2 tự động archive version 1 trong 1 transaction (BR-CLC-07 & BR-VER-02)", async () => {
    const { mgr, level, glCode } = await setupTestData();
    const db = getOwnerDb();

    // Publish v1
    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "in_review",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "approved",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "published",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });

    // Create v2 draft
    const v2 = await createNewVersion("game_level", glCode, mgr.id);
    expect(v2.contentVersion).toBe(2);

    // Transition v2 -> published
    await transitionContent({
      entityType: "game_level",
      entityDbId: v2.id,
      toStatus: "in_review",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: v2.id,
      toStatus: "approved",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: v2.id,
      toStatus: "published",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });

    // Verify v1 is now archived and v2 is published
    const [v1Row] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, level.id));
    const [v2Row] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, v2.id));

    expect(v1Row?.status).toBe("archived");
    expect(v2Row?.status).toBe("published");
  });

  it("Task 6: Rollback — super_admin rollback về bản v1 mà không đổi số version (BR-VER-06)", async () => {
    const { mgr, admin, level, glCode } = await setupTestData();
    const db = getOwnerDb();

    // Publish v1
    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "in_review",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "approved",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "published",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });

    // Create & publish v2
    const v2 = await createNewVersion("game_level", glCode, mgr.id);
    await transitionContent({
      entityType: "game_level",
      entityDbId: v2.id,
      toStatus: "in_review",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: v2.id,
      toStatus: "approved",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: v2.id,
      toStatus: "published",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });

    // content_reviewer calling rollback -> 403 INSUFFICIENT_ROLE
    await expect(
      rollbackVersion("game_level", glCode, 1, mgr.id, "content_reviewer")
    ).rejects.toSatisfy(
      (err: unknown) => (err as { code?: string })?.code === "INSUFFICIENT_ROLE"
    );

    // super_admin rollback to v1 -> succeeds
    const rb = await rollbackVersion(
      "game_level",
      glCode,
      1,
      admin.id,
      "super_admin"
    );
    expect(rb.status).toBe("published");
    expect(rb.contentVersion).toBe(1); // BR-VER-06: version stays 1

    const [v1Row] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, level.id));
    const [v2Row] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.id, v2.id));

    expect(v1Row?.status).toBe("published");
    expect(v2Row?.status).toBe("archived");
  });

  it("Task 7: BR-CLC-04 (cấm máy tự chuyển) & BR-CLC-08 (xoá cứng bị chặn khi đã published)", async () => {
    const { mgr, level } = await setupTestData();

    // BR-CLC-04: missing managerId throws MACHINE_TRANSITION_FORBIDDEN
    await expect(
      transitionContent({
        entityType: "game_level",
        entityDbId: level.id,
        toStatus: "in_review",
        actorManagerId: undefined as unknown as number,
        actorRole: "content_reviewer",
      })
    ).rejects.toSatisfy(
      (err: unknown) =>
        (err as { code?: string })?.code === "MACHINE_TRANSITION_FORBIDDEN"
    );

    // Publish level
    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "in_review",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "approved",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    await transitionContent({
      entityType: "game_level",
      entityDbId: level.id,
      toStatus: "published",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });

    // BR-CLC-08: Deleting published content fails with CONTENT_IN_USE
    await expect(deleteContentEntity("game_level", level.id)).rejects.toSatisfy(
      (err: unknown) => (err as { code?: string })?.code === "CONTENT_IN_USE"
    );
  });
});
