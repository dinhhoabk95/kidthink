import { describe, expect, it } from "vitest";
import { getOwnerDb, transitionContent } from "../../src/index.ts";
import {
  activities,
  lessonActivities,
  lessons,
} from "../../src/schema/content.ts";
import { gameLevels, gameTemplates } from "../../src/schema/game.ts";
import { managers } from "../../src/schema/identity.ts";
import { contentSkillMap } from "../../src/schema/tagging.ts";
import { competencies, skills, strands } from "../../src/schema/taxonomy.ts";

async function setupTestEnvironment() {
  const db = getOwnerDb();
  const seq = (Math.floor(Math.random() * 8000) + 1000).toString();

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

  // 2. Competency, Strand, Skill
  const compCode = `C${(Number(seq) % 6) + 1}`;
  const strandCode = `${compCode}.CNT`;
  const skillCode = `${compCode}.CNT.01`;

  const [comp] = await db
    .insert(competencies)
    .values({
      code: compCode,
      nameVi: "Năng lực tư duy",
      colorToken: "indigo",
      icon: "brain",
    })
    .onConflictDoUpdate({
      target: competencies.code,
      set: { nameVi: "Năng lực tư duy" },
    })
    .returning();

  const [strd] = await db
    .insert(strands)
    .values({
      code: strandCode,
      competencyId: comp.id,
      nameVi: "Mạch số lượng",
    })
    .onConflictDoUpdate({
      target: strands.code,
      set: { competencyId: comp.id, nameVi: "Mạch số lượng" },
    })
    .returning();

  const [sk] = await db
    .insert(skills)
    .values({
      code: skillCode,
      strandId: strd.id,
      nameVi: "Kỹ năng đếm tương ứng 1-1",
      ageMin: 3,
      ageMax: 5,
      difficulty: 1,
    })
    .onConflictDoUpdate({
      target: skills.code,
      set: { strandId: strd.id, nameVi: "Kỹ năng đếm tương ứng 1-1" },
    })
    .returning();

  // 3. Game Template & Level
  const [tmpl] = await db
    .insert(gameTemplates)
    .values({
      code: `GT-${seq.slice(0, 3)}`,
      nameVi: "Template đếm số",
      mechanic: "tap_select",
    })
    .returning();

  const [level] = await db
    .insert(gameLevels)
    .values({
      entityId: Number(seq) * 10,
      code: `GL-C1-CNT-NUM-${seq}`,
      contentVersion: 1,
      templateId: tmpl.id,
      titleVi: "Đếm số lượng 1-5",
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
        titleVi: "Thao tác ghép hạt đếm",
        instructionVi:
          '1. Chuẩn bị: 5 hạt đậu. 2. Nói với trẻ: "Bé hãy đếm xem có mấy hạt nhé!". 3. Dễ hơn: 3 hạt. 4. Khó hơn: 10 hạt.',
        materialsVi: "5 hạt đậu hoặc khối xếp hình",
        estimatedMinutes: 10,
        accessTier: "standard",
        status: "draft",
        createdByManagerId: mgr.id,
      })
      .returning();

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
        titleVi: "Trò chuyện về đồ vật",
        instructionVi:
          '1. Chuẩn bị: Tranh ảnh. 2. "Con thấy gì trong tranh?". 3. Dễ hơn: chỉ đồ vật. 4. Khó hơn: kể câu chuyện.',
        estimatedMinutes: 5,
        accessTier: "standard",
        status: "published",
        createdByManagerId: mgr.id,
      })
      .returning();

    // Create active lesson referencing this activity
    const [les] = await db
      .insert(lessons)
      .values({
        entityId: Number(seq) * 40,
        code: `LES-${seq}`,
        contentVersion: 1,
        titleVi: "Bài học đếm số đầu tiên",
        guideVi:
          "1. Mục tiêu: Nhận biết số lượng 3.\n2. Chuẩn bị: Đồ chơi.\n3. Mở đầu: Hát bài tập đếm.\n4. Khi trẻ làm được: Khen ngợi và thử thách thêm.\n5. Khi trẻ cần giúp: Cầm tay hướng dẫn.",
        targetAgeMin: 3,
        targetAgeMax: 5,
        estimatedMinutes: 15,
        accessTier: "standard",
        status: "draft",
        createdByManagerId: mgr.id,
      })
      .returning();

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
        titleVi: "Nhảy theo nhịp đếm",
        instructionVi:
          '1. Chuẩn bị: Không gian. 2. "Cùng nhảy 3 cái nhé!". 3. Dễ hơn: nhảy 1 cái. 4. Khó hơn: nhảy 5 cái.',
        estimatedMinutes: 5,
        accessTier: "standard",
        status: "draft", // NOT published
        createdByManagerId: mgr.id,
      })
      .returning();

    // Create approved lesson
    const [les] = await db
      .insert(lessons)
      .values({
        entityId: Number(seq) * 60,
        code: `LES-${seq}`,
        contentVersion: 1,
        titleVi: "Bài học vận động đếm",
        guideVi:
          "1. Mục tiêu: Đếm qua vận động.\n2. Chuẩn bị: Thảm.\n3. Mở đầu: Khởi động nhẹ.\n4. Khi trẻ làm được: Tăng tốc độ.\n5. Khi trẻ cần giúp: Làm mẫu chậm.",
        targetAgeMin: 3,
        targetAgeMax: 5,
        estimatedMinutes: 10,
        accessTier: "standard",
        status: "approved",
        createdByManagerId: mgr.id,
      })
      .returning();

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
