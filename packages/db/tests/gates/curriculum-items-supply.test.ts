import { count } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getOwnerDb } from "#src/index";
import { curriculumItems } from "#src/schema/curriculum";
import { seed } from "#src/seed";
import { seedCurriculaMasterData } from "#src/seed-master/curricula";

const ERR_NO_CONTENT_PATTERN = /chưa có bài học hay level nào/;

/**
 * `curriculum_items` phải có nội dung sau khi seed.
 *
 * Bước curricula từng đứng TRƯỚC bước gieo nội dung trong `seed()`, nên hai
 * danh sách nguồn (`lessons`, `game_levels`) rỗng và
 * `insertCurriculumItemForSession` lặng lẽ trả `false` cho mọi tiết:
 * `pnpm db:seed` in "5 curricula, 74 weeks, **0 items**" rồi báo thành công.
 * Năm chương trình có đủ tuần nhưng không tiết nào có gì để học.
 */
describe("nguồn nội dung của chương trình học", () => {
  it("sau seed(), mọi chương trình đều có tiết học", async () => {
    await seed();

    const db = getOwnerDb();
    const [row] = await db.select({ total: count() }).from(curriculumItems);
    expect(row?.total ?? 0).toBeGreaterThan(0);
  }, 600_000);

  it("mọi tiết học trỏ vào nội dung có thật", async () => {
    const db = getOwnerDb();
    const items = await db
      .select({
        entityType: curriculumItems.entityType,
        entityId: curriculumItems.entityId,
      })
      .from(curriculumItems);

    expect(items.length).toBeGreaterThan(0);
    const dangling = items.filter(
      (item) => item.entityId === null || item.entityId === undefined
    );
    expect(dangling).toEqual([]);
  });

  it("chế độ đầy đủ từ chối khi DB thiếu nội dung", async () => {
    const emptyDb = {
      select: () => ({
        from: () => ({
          orderBy: () => ({ limit: () => Promise.resolve([]) }),
          where: () => ({ limit: () => Promise.resolve([]) }),
        }),
      }),
    } as unknown as ReturnType<typeof getOwnerDb>;

    await expect(
      seedCurriculaMasterData(emptyDb, { requireContent: true })
    ).rejects.toThrow(ERR_NO_CONTENT_PATTERN);
  });

  it("chế độ master-only không đòi nội dung", async () => {
    const emptyDb = {
      select: () => ({
        from: () => ({
          orderBy: () => ({ limit: () => Promise.resolve([]) }),
          where: () => ({ limit: () => Promise.resolve([]) }),
        }),
      }),
      insert: () => ({
        values: () => ({
          onConflictDoNothing: () => ({ returning: () => Promise.resolve([]) }),
          onConflictDoUpdate: () => ({ returning: () => Promise.resolve([]) }),
        }),
      }),
    } as unknown as ReturnType<typeof getOwnerDb>;

    await expect(
      seedCurriculaMasterData(emptyDb, { requireContent: false })
    ).resolves.toBeDefined();
  });
});
