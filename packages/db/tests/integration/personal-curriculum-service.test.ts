import { eq, inArray } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getOwnerDb } from "../../src/client.ts";
import {
  childProfiles,
  curricula,
  curriculumItems,
  gameLevels,
  gameTemplates,
  lessons,
  users,
} from "../../src/index.ts";
import {
  completeChildPersonalCurriculumItem,
  copySystemCurriculum,
  createPersonalCurriculum,
  deletePersonalCurriculum,
  enrollChildInPersonalCurriculum,
  getPersonalCurriculumByUuid,
  listPersonalCurricula,
  replacePersonalCurriculumItems,
  resolveChildPersonalCurriculumNextStep,
  updatePersonalCurriculumMeta,
} from "../../src/services/personal-curriculum.ts";

const ERR_ADDON_CURRICULUM = /Add-on Curriculum/;
const ERR_TIER_FORBIDDEN = /vượt quyền/;
const ERR_QUOTA_EXCEEDED = /hạn mức/;
const ERR_VERSION_CONFLICT = /Xung đột phiên bản/;
const ERR_NOT_FOUND = /Không tìm thấy/;
const ERR_READY_STATUS = /ready/;
const ERR_UNPUBLISHED = /chưa được xuất bản/;

describe("Personal Curriculum Service & Lifecycle Integration Tests (Task #65 / P4.4)", () => {
  let userAId: number;
  let userBId: number;
  let childAUuid: string;
  let childBUuid: string;
  let publishedLessonId: number;
  let premiumGameLevelId: number;
  let standardGameLevelId: number;
  let archivedLessonId: number;
  let systemCurriculumCode: string;
  let systemCurriculumId: number;

  beforeEach(async () => {
    const db = getOwnerDb();
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 1_000_000);

    // 1. Create test users
    const [uA] = await db
      .insert(users)
      .values({
        email: `pcu_user_a_${ts}_${rand}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "User A (Teacher/Parent)",
      })
      .returning();
    userAId = uA.id;

    const [uB] = await db
      .insert(users)
      .values({
        email: `pcu_user_b_${ts}_${rand}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "User B (Other Parent)",
      })
      .returning();
    userBId = uB.id;

    // 2. Create child profiles
    const [cA] = await db
      .insert(childProfiles)
      .values({
        userId: userAId,
        displayName: "Bé An (Con User A)",
        birthYear: 2021,
        avatarId: "bear",
      })
      .returning();
    childAUuid = cA.uuid;

    const [cB] = await db
      .insert(childProfiles)
      .values({
        userId: userBId,
        displayName: "Bé Bình (Con User B)",
        birthYear: 2021,
        avatarId: "rabbit",
      })
      .returning();
    childBUuid = cB.uuid;

    // 3. Create or get game template
    const [gt] = await db
      .insert(gameTemplates)
      .values({
        code: "GT-999",
        nameVi: "Game template test",
        mechanic: "drag_drop",
        contentContract: {},
      })
      .onConflictDoNothing()
      .returning();
    let templateId = gt?.id;
    if (!templateId) {
      const [existing] = await db
        .select({ id: gameTemplates.id })
        .from(gameTemplates)
        .where(eq(gameTemplates.code, "GT-999"))
        .limit(1);
      templateId = existing.id;
    }

    // 4. Create standard & premium game levels
    async function insertUniqueGameLevel(
      entityId: number,
      difficulty: number,
      titleVi: string,
      accessTier: "standard" | "premium"
    ): Promise<number> {
      for (let i = 0; i < 20; i++) {
        const code = `GL-C1-TST-PCU-${Math.floor(Math.random() * 8000) + 1000}`;
        const [existing] = await db
          .select({ id: gameLevels.id })
          .from(gameLevels)
          .where(eq(gameLevels.code, code))
          .limit(1);
        if (!existing) {
          const [res] = await db
            .insert(gameLevels)
            .values({
              code,
              entityId,
              templateId,
              difficulty,
              titleVi,
              accessTier,
              status: "published",
              contentPack: {},
              difficultyParams: {},
            })
            .returning();
          return res.id;
        }
      }
      throw new Error("Failed to insert unique game level");
    }

    standardGameLevelId = await insertUniqueGameLevel(
      101,
      1,
      "Đếm số tiêu chuẩn",
      "standard"
    );
    premiumGameLevelId = await insertUniqueGameLevel(
      102,
      2,
      "Đếm số cao cấp",
      "premium"
    );

    // 5. Create lessons (published & archived)
    async function insertUniqueLesson(
      entityId: number,
      titleVi: string,
      status: "published" | "archived"
    ): Promise<number> {
      for (let i = 0; i < 20; i++) {
        const code = `LES-${Math.floor(Math.random() * 8000) + 1000}`;
        const [existing] = await db
          .select({ id: lessons.id })
          .from(lessons)
          .where(eq(lessons.code, code))
          .limit(1);
        if (!existing) {
          const [res] = await db
            .insert(lessons)
            .values({
              code,
              entityId,
              titleVi,
              accessTier: "standard",
              status,
              estimatedMinutes: 20,
              contentVersion: 1,
            })
            .returning();
          return res.id;
        }
      }
      throw new Error("Failed to insert unique lesson");
    }

    publishedLessonId = await insertUniqueLesson(
      201,
      "Bài học hình khối cơ bản",
      "published"
    );
    archivedLessonId = await insertUniqueLesson(
      202,
      "Bài học cũ đã lưu trữ",
      "archived"
    );

    // 6. Create system published curriculum
    systemCurriculumCode = `CUR-SYS-${ts}-${rand}`;
    const [sysCurr] = await db
      .insert(curricula)
      .values({
        code: systemCurriculumCode,
        entityId: 301,
        titleVi: "Chương trình mẫu hệ thống",
        accessTier: "standard",
        status: "published",
        durationWeeks: 4,
        sessionsPerWeek: 3,
      })
      .returning();
    systemCurriculumId = sysCurr.id;

    await db.insert(curriculumItems).values([
      {
        curriculumId: sysCurr.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: standardGameLevelId,
        isRequired: true,
      },
      {
        curriculumId: sysCurr.id,
        weekNo: 1,
        sessionNo: 2,
        position: 1,
        entityType: "lesson",
        entityId: publishedLessonId,
        isRequired: true,
      },
    ]);
  });

  afterEach(async () => {
    const db = getOwnerDb();
    if (systemCurriculumId) {
      await db
        .delete(curriculumItems)
        .where(eq(curriculumItems.curriculumId, systemCurriculumId));
      await db.delete(curricula).where(eq(curricula.id, systemCurriculumId));
    }
    if (standardGameLevelId || premiumGameLevelId) {
      await db
        .delete(gameLevels)
        .where(
          inArray(
            gameLevels.id,
            [standardGameLevelId, premiumGameLevelId].filter(Boolean)
          )
        );
    }
    if (publishedLessonId || archivedLessonId) {
      await db
        .delete(lessons)
        .where(
          inArray(
            lessons.id,
            [publishedLessonId, archivedLessonId].filter(Boolean)
          )
        );
    }
    if (userAId || userBId) {
      await db
        .delete(childProfiles)
        .where(
          inArray(childProfiles.userId, [userAId, userBId].filter(Boolean))
        );
      await db
        .delete(users)
        .where(inArray(users.id, [userAId, userBId].filter(Boolean)));
    }
  });

  describe("Entitlement, Quota & Paywall Gates (BR-PCU-01, BR-PCU-08)", () => {
    it("từ chối tạo khi user thiếu entitlement create_custom_curriculum", async () => {
      await expect(
        createPersonalCurriculum(
          { userId: userAId, entitlements: [] },
          { title: "Lộ trình không có quyền" }
        )
      ).rejects.toThrow(ERR_ADDON_CURRICULUM);
    });

    it("từ chối thêm nội dung premium khi user chỉ có gói standard (BR-PCU-01)", async () => {
      await expect(
        createPersonalCurriculum(
          {
            userId: userAId,
            entitlements: ["create_custom_curriculum", "play_standard_games"],
            currentTier: "standard",
          },
          {
            title: "Lộ trình vượt tier",
            items: [
              {
                week_no: 1,
                session_no: 1,
                position: 1,
                entity_type: "game_level",
                entity_id: premiumGameLevelId,
              },
            ],
          }
        )
      ).rejects.toThrow(ERR_TIER_FORBIDDEN);
    });

    it("từ chối thêm bài học có status archived khi tạo mới (BR-PCU-01)", async () => {
      await expect(
        createPersonalCurriculum(
          {
            userId: userAId,
            entitlements: ["create_custom_curriculum", "play_standard_games"],
            currentTier: "standard",
          },
          {
            title: "Lộ trình chứa bài học archived",
            items: [
              {
                week_no: 1,
                session_no: 1,
                position: 1,
                entity_type: "lesson",
                entity_id: archivedLessonId,
              },
            ],
          }
        )
      ).rejects.toThrow(ERR_UNPUBLISHED);
    });

    it("từ chối tạo khi vượt quá hạn mức quota custom_curricula_saved (BR-PCU-08)", async () => {
      const context = {
        userId: userAId,
        entitlements: ["create_custom_curriculum", "play_standard_games"],
        currentTier: "standard" as const,
      };

      // Create 5 curricula (default max quota)
      for (let i = 1; i <= 5; i++) {
        await createPersonalCurriculum(context, { title: `Lộ trình #${i}` });
      }

      // 6th curriculum should be rejected
      await expect(
        createPersonalCurriculum(context, { title: "Lộ trình #6 vượt quota" })
      ).rejects.toThrow(ERR_QUOTA_EXCEEDED);
    });
  });

  describe("CRUD, Versioning & Audit Lifecycle (BR-PCU-01..08, D-P4M..D-P4P)", () => {
    it("tạo, cập nhật metadata, thay thế items và ghi nhận audit log đầy đủ", async () => {
      const context = {
        userId: userAId,
        entitlements: [
          "create_custom_curriculum",
          "play_standard_games",
          "play_premium_games",
        ],
        currentTier: "premium" as const,
      };

      // 1. Tạo lộ trình mới
      const created = await createPersonalCurriculum(context, {
        title: "Lộ trình cá nhân bé An",
        age_min: 4,
        age_max: 5,
        duration_weeks: 4,
        sessions_per_week: 3,
        items: [
          {
            week_no: 1,
            session_no: 1,
            position: 1,
            entity_type: "game_level",
            entity_id: standardGameLevelId,
          },
        ],
      });

      expect(created.title).toBe("Lộ trình cá nhân bé An");
      expect(created.status).toBe("draft");
      expect(created.version).toBe(1);
      expect(created.items.length).toBe(1);

      // 2. Cập nhật metadata và chuyển sang ready (BR-PCU-05: cảnh báo không chặn)
      const updated = await updatePersonalCurriculumMeta(
        context,
        created.uuid,
        {
          title: "Lộ trình cá nhân bé An - Hoàn chỉnh",
          status: "ready",
          expected_version: 1,
        }
      );

      expect(updated.title).toBe("Lộ trình cá nhân bé An - Hoàn chỉnh");
      expect(updated.status).toBe("ready");
      expect(updated.version).toBe(2);

      // 3. Xung đột phiên bản khi truyền expected_version sai
      await expect(
        updatePersonalCurriculumMeta(context, created.uuid, {
          title: "Xung đột phiên bản",
          expected_version: 1, // Current is 2
        })
      ).rejects.toThrow(ERR_VERSION_CONFLICT);

      // 4. Thay thế danh sách items
      const replaced = await replacePersonalCurriculumItems(
        context,
        created.uuid,
        {
          items: [
            {
              week_no: 1,
              session_no: 1,
              position: 1,
              entity_type: "game_level",
              entity_id: standardGameLevelId,
              is_required: true,
            },
            {
              week_no: 1,
              session_no: 2,
              position: 1,
              entity_type: "lesson",
              entity_id: publishedLessonId,
              is_required: true,
            },
          ],

          expected_version: 2,
        }
      );

      expect(replaced.version).toBe(3);
      expect(replaced.items.length).toBe(2);

      // 5. Kiểm tra danh sách lộ trình của user
      const list = await listPersonalCurricula(context);
      expect(list.some((c) => c.uuid === created.uuid)).toBe(true);

      // 6. Xoá lộ trình
      const delResult = await deletePersonalCurriculum(context, created.uuid);
      expect(delResult.ok).toBe(true);

      // 7. Truy vấn sau khi xoá trả về 404
      await expect(
        getPersonalCurriculumByUuid(context, created.uuid)
      ).rejects.toThrow(ERR_NOT_FOUND);
    });

    it("ngăn chặn IDOR: User B không thể đọc, sửa hoặc xoá lộ trình của User A (BR-PCU-02)", async () => {
      const contextA = {
        userId: userAId,
        entitlements: ["create_custom_curriculum", "play_standard_games"],
      };
      const contextB = {
        userId: userBId,
        entitlements: ["create_custom_curriculum", "play_standard_games"],
      };

      const currA = await createPersonalCurriculum(contextA, {
        title: "Lộ trình bí mật của User A",
      });

      // User B cố đọc -> 404
      await expect(
        getPersonalCurriculumByUuid(contextB, currA.uuid)
      ).rejects.toThrow(ERR_NOT_FOUND);

      // User B cố sửa -> 404
      await expect(
        updatePersonalCurriculumMeta(contextB, currA.uuid, {
          title: "Bị tấn công",
        })
      ).rejects.toThrow(ERR_NOT_FOUND);

      // User B cố xoá -> 404
      await expect(
        deletePersonalCurriculum(contextB, currA.uuid)
      ).rejects.toThrow(ERR_NOT_FOUND);
    });

    it("sao chép lộ trình hệ thống snapshot có kiểm soát quyền (BR-PCU-01, BR-PCU-03)", async () => {
      const context = {
        userId: userAId,
        entitlements: ["create_custom_curriculum", "play_standard_games"],
        currentTier: "standard" as const,
      };

      const copied = await copySystemCurriculum(context, {
        system_curriculum_code: systemCurriculumCode,
        title: "Bản sao lớp Mầm của cô",
      });

      expect(copied.title).toBe("Bản sao lớp Mầm của cô");
      expect(copied.status).toBe("draft");
      expect(copied.items.length).toBe(2);
      expect(copied.items[0].code).toContain("GL-C1-");
    });
  });

  describe("Child Enrollment & Player Integration with Personal Policy (BR-PCU-02, BR-PCU-04, BR-PCU-06, BR-PCU-07)", () => {
    it("ghi danh chỉ cho trẻ thuộc quyền sở hữu của caller và từ chối trẻ của người khác (BR-PCU-02)", async () => {
      const contextA = {
        userId: userAId,
        entitlements: ["create_custom_curriculum", "play_standard_games"],
        currentTier: "standard" as const,
      };

      const curr = await createPersonalCurriculum(contextA, {
        title: "Lộ trình ôn luyện",
        items: [
          {
            week_no: 1,
            session_no: 1,
            position: 1,
            entity_type: "game_level",
            entity_id: standardGameLevelId,
          },
        ],
      });

      // Lộ trình đang ở draft -> từ chối ghi danh
      await expect(
        enrollChildInPersonalCurriculum(contextA, childAUuid, curr.uuid)
      ).rejects.toThrow(ERR_READY_STATUS);

      // Chuyển sang ready
      await updatePersonalCurriculumMeta(contextA, curr.uuid, {
        status: "ready",
      });

      // Ghi danh trẻ của chính mình -> thành công
      const enrollment = await enrollChildInPersonalCurriculum(
        contextA,
        childAUuid,
        curr.uuid
      );
      expect(enrollment.status).toBe("active");

      // Cố ghi danh trẻ của User B -> 404 (BR-PCU-02)
      await expect(
        enrollChildInPersonalCurriculum(contextA, childBUuid, curr.uuid)
      ).rejects.toThrow(ERR_NOT_FOUND);
    });

    it("player tuân thủ personal policy: bỏ qua tuần rỗng và hoàn thành từng bài học (BR-PCU-04, BR-PCU-06)", async () => {
      const context = {
        userId: userAId,
        entitlements: ["create_custom_curriculum", "play_standard_games"],
        currentTier: "standard" as const,
      };

      // Tạo lộ trình 3 tuần: tuần 1 có item, tuần 2 rỗng, tuần 3 có item
      const curr = await createPersonalCurriculum(context, {
        title: "Lộ trình có tuần rỗng",
        duration_weeks: 3,
        items: [
          {
            week_no: 1,
            session_no: 1,
            position: 1,
            entity_type: "game_level",
            entity_id: standardGameLevelId,
          },
          {
            week_no: 3,
            session_no: 1,
            position: 1,
            entity_type: "lesson",
            entity_id: publishedLessonId,
          },
        ],
      });

      await updatePersonalCurriculumMeta(context, curr.uuid, {
        status: "ready",
      });

      await enrollChildInPersonalCurriculum(context, childAUuid, curr.uuid);

      // 1. Bước đầu tiên -> Tuần 1, session 1
      const step1 = await resolveChildPersonalCurriculumNextStep(
        context,
        childAUuid
      );
      expect(step1.active_enrollment?.title).toBe("Lộ trình có tuần rỗng");
      expect(step1.next_step?.week_no).toBe(1);
      expect(step1.next_step?.session_no).toBe(1);
      expect(step1.next_step?.curriculum_progress).toBe(0);

      // 2. Hoàn thành item tuần 1
      const item1Id = Number(curr.items[0]?.id);
      const compResult = await completeChildPersonalCurriculumItem(
        context,
        childAUuid,
        item1Id
      );
      expect(compResult.ok).toBe(true);

      // 3. Bước kế tiếp -> Tự động bỏ qua tuần 2 (rỗng) và nhảy tới Tuần 3 (BR-PCU-06)
      const step2 = await resolveChildPersonalCurriculumNextStep(
        context,
        childAUuid
      );
      expect(step2.next_step?.week_no).toBe(3);
      expect(step2.next_step?.session_no).toBe(1);
      expect(step2.next_step?.curriculum_progress).toBe(0.5);
      expect(step2.next_step?.is_completed).toBe(false);

      // 4. Hoàn thành item tuần 3
      const item3Id = Number(curr.items[1]?.id);
      await completeChildPersonalCurriculumItem(context, childAUuid, item3Id);

      // 5. Hoàn thành toàn bộ lộ trình
      const step3 = await resolveChildPersonalCurriculumNextStep(
        context,
        childAUuid
      );
      expect(step3.next_step?.curriculum_progress).toBe(1);
      expect(step3.next_step?.is_completed).toBe(true);
    });
  });
});
