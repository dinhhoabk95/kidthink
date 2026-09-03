import {
  activities,
  competencies,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  lessonActivities,
  lessons,
  managers,
  skills,
  strands,
  transitionContent,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

async function setupTestEnvironment() {
  const db = getOwnerDb();
  let seq = "";
  while (true) {
    const candidate = (Math.floor(Math.random() * 8000) + 1000).toString();
    const [existingLes] = await db
      .select({ id: lessons.id })
      .from(lessons)
      .where(eq(lessons.code, `LES-${candidate}`))
      .limit(1);
    const [existingAct] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.code, `ACT-${candidate}`))
      .limit(1);
    if (!(existingLes || existingAct)) {
      seq = candidate;
      break;
    }
  }

  // 1. Manager
  const [mgr] = await db
    .insert(managers)
    .values({
      displayName: `Manager ${seq}`,
      email: `mgr_${seq}@tinimath.vn`,
      passwordHash: "dummy_hash_for_test",
      role: "super_admin",
    })
    .returning();
  if (!mgr) {
    throw new Error("Failed to insert manager");
  }

  // 2. Competency, Strand, Skill
  const compCode = `C${(Number(seq) % 6) + 1}`;
  const strandCode = `${compCode}.CNT`;
  const skillCode = `${compCode}.CNT.01`;

  const [comp] = await db
    .insert(competencies)
    .values({
      code: compCode,
      name: "Năng lực tư duy",
      colorToken: "indigo",
      icon: "brain",
    })
    .onConflictDoUpdate({
      target: competencies.code,
      set: { name: "Năng lực tư duy" },
    })
    .returning();
  if (!comp) {
    throw new Error("Failed to insert competency");
  }

  const [strd] = await db
    .insert(strands)
    .values({
      code: strandCode,
      competencyId: comp.id,
      name: "Mạch số lượng",
    })
    .onConflictDoUpdate({
      target: strands.code,
      set: { competencyId: comp.id, name: "Mạch số lượng" },
    })
    .returning();
  if (!strd) {
    throw new Error("Failed to insert strand");
  }

  const [sk] = await db
    .insert(skills)
    .values({
      code: skillCode,
      strandId: strd.id,
      name: "Kỹ năng đếm tương ứng 1-1",
      ageMin: 3,
      ageMax: 5,
      difficulty: 1,
    })
    .onConflictDoUpdate({
      target: skills.code,
      set: { strandId: strd.id, name: "Kỹ năng đếm tương ứng 1-1" },
    })
    .returning();
  if (!sk) {
    throw new Error("Failed to insert skill");
  }

  // 3. Game Template & Level
  const num4 = (Math.floor(Math.random() * 9000) + 1000).toString();
  const letters = ["AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ"];
  const l1 = letters[Math.floor(Math.random() * letters.length)];
  const l2 = letters[Math.floor(Math.random() * letters.length)];
  const gtCode = "GT-001";
  const glCode = `GL-C1-${l1}-${l2}-${num4}`;

  const [level] = await db
    .insert(gameLevels)
    .values({
      entityId: Math.floor(Math.random() * 900_000_000) + 100_000_000,
      code: glCode,
      contentVersion: 1,
      templateCode: gtCode,
      title: "Đếm số lượng 1-5",
      accessTier: "standard",
      ageMin: 3,
      ageMax: 5,
      difficulty: 1,
      status: "draft",
      contentPack: { items: [1, 2, 3] },
      difficultyParams: { count: 3 },
      createdByManagerId: mgr.id,
    })
    .returning();
  if (!level) {
    throw new Error("Failed to insert level");
  }

  await db.insert(contentSkillMap).values({
    entityType: "game_level",
    entityId: level.id,
    skillId: sk.id,
    weight: "1.00",
  });

  return { mgr, sk, level, seq };
}

describe("Activity & Lesson Lifecycle Transitions & Gating (BR-ACA-04, BR-LSA-03)", () => {
  it("Scenario: Activity draft -> in_review -> approved -> published with skill mapping", async () => {
    const { mgr, sk, seq } = await setupTestEnvironment();
    const db = getOwnerDb();

    const [act] = await db
      .insert(activities)
      .values({
        entityId: Number(seq) * 20,
        code: `ACT-${seq}`,
        contentVersion: 1,
        kind: "manipulative",
        title: "Thao tác ghép hạt đếm",
        instruction:
          '1. Chuẩn bị: 5 hạt đậu. 2. Nói với trẻ: "Bé hãy đếm xem có mấy hạt nhé!". 3. Dễ hơn: 3 hạt. 4. Khó hơn: 10 hạt.',
        materials: "5 hạt đậu hoặc khối xếp hình",
        estimatedMinutes: 10,
        accessTier: "standard",
        status: "draft",
        createdByManagerId: mgr.id,
      })
      .returning();
    if (!act) {
      throw new Error("Failed to insert activity");
    }

    await db.insert(contentSkillMap).values({
      entityType: "activity",
      entityId: act.id,
      skillId: sk.id,
      weight: "1.00",
    });

    // 1. draft -> in_review
    const res1 = await transitionContent({
      entityType: "activity",
      entityDbId: act.id,
      toStatus: "in_review",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    expect(res1.status).toBe("in_review");

    // 2. in_review -> approved
    const res2 = await transitionContent({
      entityType: "activity",
      entityDbId: act.id,
      toStatus: "approved",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    expect(res2.status).toBe("approved");

    // 3. approved -> published (runs publish checklist)
    const res3 = await transitionContent({
      entityType: "activity",
      entityDbId: act.id,
      toStatus: "published",
      actorManagerId: mgr.id,
      actorRole: "content_reviewer",
    });
    expect(res3.status).toBe("published");
  });

  it("Scenario: BR-ACA-04 — Archiving an activity in use by a lesson is rejected with 409 CONTENT_IN_USE", async () => {
    const { mgr, seq } = await setupTestEnvironment();
    const db = getOwnerDb();

    // Create activity
    const [act] = await db
      .insert(activities)
      .values({
        entityId: Number(seq) * 30,
        code: `ACT-${seq}`,
        contentVersion: 1,
        kind: "discussion",
        title: "Trò chuyện về đồ vật",
        instruction:
          '1. Chuẩn bị: Tranh ảnh. 2. "Con thấy gì trong tranh?". 3. Dễ hơn: chỉ đồ vật. 4. Khó hơn: kể câu chuyện.',
        estimatedMinutes: 5,
        accessTier: "standard",
        status: "published",
        createdByManagerId: mgr.id,
      })
      .returning();
    if (!act) {
      throw new Error("Failed to insert activity");
    }

    // Create active lesson referencing this activity
    const [les] = await db
      .insert(lessons)
      .values({
        entityId: Number(seq) * 40,
        code: `LES-${seq}`,
        contentVersion: 1,
        title: "Bài học đếm số đầu tiên",
        guide:
          "1. Mục tiêu: Nhận biết số lượng 3.\n2. Chuẩn bị: Đồ chơi.\n3. Mở đầu: Hát bài tập đếm.\n4. Khi trẻ làm được: Khen ngợi và thử thách thêm.\n5. Khi trẻ cần giúp: Cầm tay hướng dẫn.",
        targetAgeMin: 3,
        targetAgeMax: 5,
        estimatedMinutes: 15,
        accessTier: "standard",
        status: "draft",
        createdByManagerId: mgr.id,
      })
      .returning();
    if (!les) {
      throw new Error("Failed to insert lesson");
    }

    // Link activity to lesson
    await db.insert(lessonActivities).values({
      lessonId: les.id,
      activityId: act.entityId,
      position: 1,
      isRequired: true,
    });

    // Attempting to archive activity should throw 409 CONTENT_IN_USE
    await expect(
      transitionContent({
        entityType: "activity",
        entityDbId: act.id,
        toStatus: "archived",
        actorManagerId: mgr.id,
        actorRole: "super_admin",
      })
    ).rejects.toThrow(
      "BR-ACA-04: Không thể archive activity đang được sử dụng trong 1 bài học"
    );
  });

  it("Scenario: BR-LSA-03 — Publishing a lesson fails if any attached activity is not published", async () => {
    const { mgr, sk, seq } = await setupTestEnvironment();
    const db = getOwnerDb();

    // Create draft activity
    const [act] = await db
      .insert(activities)
      .values({
        entityId: Number(seq) * 50,
        code: `ACT-${seq}`,
        contentVersion: 1,
        kind: "movement",
        title: "Nhảy theo nhịp đếm",
        instruction:
          '1. Chuẩn bị: Không gian. 2. "Cùng nhảy 3 cái nhé!". 3. Dễ hơn: nhảy 1 cái. 4. Khó hơn: nhảy 5 cái.',
        estimatedMinutes: 5,
        accessTier: "standard",
        status: "draft", // NOT published
        createdByManagerId: mgr.id,
      })
      .returning();
    if (!act) {
      throw new Error("Failed to insert activity");
    }

    // Create approved lesson
    const [les] = await db
      .insert(lessons)
      .values({
        entityId: Number(seq) * 60,
        code: `LES-${seq}`,
        contentVersion: 1,
        title: "Bài học vận động đếm",
        guide:
          "1. Mục tiêu: Đếm qua vận động.\n2. Chuẩn bị: Thảm.\n3. Mở đầu: Khởi động nhẹ.\n4. Khi trẻ làm được: Tăng tốc độ.\n5. Khi trẻ cần giúp: Làm mẫu chậm.",
        targetAgeMin: 3,
        targetAgeMax: 5,
        estimatedMinutes: 10,
        accessTier: "standard",
        status: "approved",
        createdByManagerId: mgr.id,
      })
      .returning();
    if (!les) {
      throw new Error("Failed to insert lesson");
    }

    await db.insert(contentSkillMap).values({
      entityType: "lesson",
      entityId: les.id,
      skillId: sk.id,
      weight: "1.00",
    });

    await db.insert(lessonActivities).values({
      lessonId: les.id,
      activityId: act.entityId,
      position: 1,
      isRequired: true,
    });

    // Publishing should fail because attached activity is in draft
    await expect(
      transitionContent({
        entityType: "lesson",
        entityDbId: les.id,
        toStatus: "published",
        actorManagerId: mgr.id,
        actorRole: "super_admin",
      })
    ).rejects.toThrow(`BR-LSA-03 / BR-CLC-09: Hoạt động ACT-${seq}`);
  });
});
