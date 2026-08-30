import {
  childProfiles,
  createCollection,
  curricula,
  curriculumEnrollments,
  curriculumItemProgress,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  getUserCollections,
  getUserLibrary,
  removeLibraryItem,
  saveLibraryItem,
  users,
} from "@mindkid/db";
import { and, eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

describe("Task #82 — P3 Account & Curriculum Integration (BR-MDB, BR-MLB, BR-CUR)", () => {
  let user1Id: number;
  let user2Id: number;
  let childAId: number;
  let childBId: number;
  let gameLevel1Id: number;
  let gameLevel2Id: number;
  let curriculum1Id: number;

  afterEach(async () => {
    const db = getOwnerDb();
    if (user1Id) {
      await db.delete(users).where(eq(users.id, user1Id));
    }
    if (user2Id) {
      await db.delete(users).where(eq(users.id, user2Id));
    }
    if (curriculum1Id) {
      await db
        .delete(curriculumItems)
        .where(eq(curriculumItems.curriculumId, curriculum1Id));
      await db
        .delete(curriculumWeeks)
        .where(eq(curriculumWeeks.curriculumId, curriculum1Id));
      await db.delete(curricula).where(eq(curricula.id, curriculum1Id));
    }
    if (gameLevel1Id) {
      await db.delete(gameLevels).where(eq(gameLevels.entityId, gameLevel1Id));
    }
    if (gameLevel2Id) {
      await db.delete(gameLevels).where(eq(gameLevels.entityId, gameLevel2Id));
    }
  });

  beforeEach(async () => {
    const db = getOwnerDb();
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 10_000);

    const makeLevelCode = async (prefix: string) => {
      for (let attempt = 0; attempt < 50; attempt++) {
        const candidate = `${prefix}-${String(Math.floor(1000 + Math.random() * 8999))}`;
        const existing = await db
          .select({ id: gameLevels.id })
          .from(gameLevels)
          .where(eq(gameLevels.code, candidate))
          .limit(1);
        if (existing.length === 0) {
          return candidate;
        }
      }
      return `${prefix}-${String(Math.floor(1000 + Math.random() * 8999))}`;
    };

    // 1. Seed Users
    const [u1] = await db
      .insert(users)
      .values({
        email: `p3_user1_${ts}_${rand}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Parent User 1",
      })
      .returning();
    if (!u1) {
      throw new Error("Failed to insert u1");
    }
    user1Id = u1.id;

    const [u2] = await db
      .insert(users)
      .values({
        email: `p3_user2_${ts}_${rand}@tinimath.test`,
        passwordHash: "hash123",
        displayName: "Parent User 2",
      })
      .returning();
    if (!u2) {
      throw new Error("Failed to insert u2");
    }
    user2Id = u2.id;

    // 2. Seed Child Profiles for User 1
    const [cA] = await db
      .insert(childProfiles)
      .values({
        userId: user1Id,
        displayName: "Bé An",
        birthYear: 2021,
        avatarId: "bear",
      })
      .returning();
    if (!cA) {
      throw new Error("Failed to insert cA");
    }
    childAId = cA.id;

    const [cB] = await db
      .insert(childProfiles)
      .values({
        userId: user1Id,
        displayName: "Bé Bình",
        birthYear: 2020,
        avatarId: "rabbit",
      })
      .returning();
    if (!cB) {
      throw new Error("Failed to insert cB");
    }
    childBId = cB.id;

    // 3. Seed Templates & Levels
    const templateCode = "GT-001";
    await db
      .insert(gameTemplates)
      .values({
        code: templateCode,
        name: "Game template test P3",
        mechanic: "drag_drop",
        contentContract: {},
      })
      .onConflictDoNothing();
    const [gt] = await db
      .select({ id: gameTemplates.id })
      .from(gameTemplates)
      .where(eq(gameTemplates.code, templateCode));
    const templateId = gt?.id ?? 1;

    const [gl1] = await db
      .insert(gameLevels)
      .values({
        code: await makeLevelCode("GL-C1-NUM-CNT"),
        entityId: Math.floor(80_000_000 + Math.random() * 10_000_000),
        templateId,
        difficulty: 1,
        title: "Đếm số vui vẻ",
        accessTier: "standard",
        status: "published",
        contentPack: { items: ["apple"] },
        difficultyParams: { count: 3 },
      })
      .returning();
    if (!gl1) {
      throw new Error("Failed to insert gl1");
    }
    gameLevel1Id = gl1.entityId;

    const [gl2] = await db
      .insert(gameLevels)
      .values({
        code: await makeLevelCode("GL-C2-SHP-REC"),
        entityId: Math.floor(80_000_000 + Math.random() * 10_000_000),
        templateId,
        difficulty: 2,
        title: "Nhận biết hình khối",
        accessTier: "premium",
        status: "archived",
        contentPack: { items: ["circle"] },
        difficultyParams: { count: 4 },
      })
      .returning();
    if (!gl2) {
      throw new Error("Failed to insert gl2");
    }
    gameLevel2Id = gl2.entityId;

    // 4. Seed Curriculum & Enroll child A
    const [curr1] = await db
      .insert(curricula)
      .values({
        code: `CUR-P3-${ts}-${rand}`.slice(0, 50),
        entityId: 3000 + (ts % 100_000),
        title: "Lộ trình tư duy toán 4-5 tuổi",
        accessTier: "standard",
        status: "published",
        durationWeeks: 4,
        sessionsPerWeek: 3,
      })
      .returning();
    if (!curr1) {
      throw new Error("Failed to insert curr1");
    }
    curriculum1Id = curr1.id;

    await db.insert(curriculumWeeks).values({
      curriculumId: curr1.id,
      weekNo: 1,
      goal: "Làm quen với số lượng",
    });

    const [cItem1] = await db
      .insert(curriculumItems)
      .values({
        curriculumId: curr1.id,
        weekNo: 1,
        sessionNo: 1,
        position: 1,
        entityType: "game_level",
        entityId: gl1.id,
        isRequired: true,
      })
      .returning();
    if (!cItem1) {
      throw new Error("Failed to insert cItem1");
    }

    const [enrA] = await db
      .insert(curriculumEnrollments)
      .values({
        childId: childAId,
        curriculumId: curr1.id,
        status: "active",
      })
      .returning();
    if (!enrA) {
      throw new Error("Failed to insert enrA");
    }

    await db.insert(curriculumItemProgress).values({
      enrollmentId: enrA.id,
      childId: childAId,
      curriculumItemId: cItem1.id,
      status: "completed",
      completedAt: new Date(),
    });
  });

  describe("My Library Service (BR-MLB-01..07)", () => {
    it("Scenario: BR-MLB-01 & BR-MLB-02 — saves content reference, resolves published metadata and shows locked badge", async () => {
      const db = getOwnerDb();

      // Save standard item
      const saved = await saveLibraryItem(db, {
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel1Id,
        note: "Bài tập yêu thích của An",
      });
      expect(saved?.entityId).toBe(gameLevel1Id);

      // Save premium item (user has free tier)
      await saveLibraryItem(db, {
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel2Id,
      });

      const library = await getUserLibrary(db, {
        userId: user1Id,
        activeTier: "free",
      });

      expect(library.items.length).toBe(2);

      const standardItem = library.items.find(
        (i) => i.entity_id === gameLevel1Id
      );
      expect(standardItem?.title).toBe("Đếm số vui vẻ");
      expect(standardItem?.is_locked).toBe(true); // locked for free tier
      expect(standardItem?.is_archived).toBe(false);

      const archivedItem = library.items.find(
        (i) => i.entity_id === gameLevel2Id
      );
      expect(archivedItem?.title).toBe("Nhận biết hình khối");
      expect(archivedItem?.is_archived).toBe(true); // BR-MLB-05
      expect(archivedItem?.status_label).toBe("Không còn khả dụng");
    });

    it("Scenario: duplicate bookmarking returns 409 error", async () => {
      const db = getOwnerDb();
      await saveLibraryItem(db, {
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel1Id,
      });

      await expect(
        saveLibraryItem(db, {
          userId: user1Id,
          entityType: "game_level",
          entityId: gameLevel1Id,
        })
      ).rejects.toThrow("Mục này đã tồn tại trong thư viện.");
    });

    it("Scenario: removing item deletes bookmark without altering catalog", async () => {
      const db = getOwnerDb();
      await saveLibraryItem(db, {
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel1Id,
      });

      await removeLibraryItem(db, {
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel1Id,
      });

      const library = await getUserLibrary(db, { userId: user1Id });
      expect(
        library.items.find((i) => i.entity_id === gameLevel1Id)
      ).toBeUndefined();
    });

    it("Scenario: BR-MLB-04 — user library is strictly private to owner", async () => {
      const db = getOwnerDb();
      await saveLibraryItem(db, {
        userId: user1Id,
        entityType: "game_level",
        entityId: gameLevel1Id,
      });

      const user2Library = await getUserLibrary(db, { userId: user2Id });
      expect(user2Library.items.length).toBe(0);
    });

    it("Scenario: BR-MLB-06 — enforces 20 collection limit per user with 402 COLLECTION_LIMIT_EXCEEDED", async () => {
      const db = getOwnerDb();

      // Create 20 collections
      for (let i = 1; i <= 20; i++) {
        await createCollection(db, user1Id, `Bộ sưu tập ${i}`);
      }

      const collectionsList = await getUserCollections(db, user1Id);
      expect(collectionsList.length).toBe(20);

      // Attempt 21st collection
      await expect(
        createCollection(db, user1Id, "Bộ sưu tập thứ 21")
      ).rejects.toThrow("Vượt quá giới hạn 20 bộ sưu tập cho phép.");
    });
  });

  describe("Multi-Child & Curriculum Dashboard Isolation (BR-MDB-06, BR-CUR)", () => {
    it("Child A has active curriculum with progress; Child B has no curriculum, avoiding data mix", async () => {
      const db = getOwnerDb();

      // Verify Child A active enrollment
      const [enrollmentA] = await db
        .select()
        .from(curriculumEnrollments)
        .where(
          and(
            eq(curriculumEnrollments.childId, childAId),
            eq(curriculumEnrollments.status, "active")
          )
        );
      expect(enrollmentA).toBeDefined();
      expect(enrollmentA?.curriculumId).toBe(curriculum1Id);

      // Verify Child B has no enrollments
      const enrollmentsB = await db
        .select()
        .from(curriculumEnrollments)
        .where(eq(curriculumEnrollments.childId, childBId));
      expect(enrollmentsB.length).toBe(0);
    });
  });
});
