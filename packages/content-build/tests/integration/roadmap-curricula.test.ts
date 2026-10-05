import { RM_3_4_MAM_01 } from "@mindkid/content";
import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  getOwnerDb,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  seedRoadmapCurricula,
  writeItemsForCurriculum,
} from "#src/seed-master/curricula";
import {
  curriculumCodeForRoadmap,
  type ResolvedCurriculumItem,
} from "#src/seed-master/roadmap-curricula";

const CODE = curriculumCodeForRoadmap(RM_3_4_MAM_01.code);

function item(
  overrides: Partial<ResolvedCurriculumItem> = {}
): ResolvedCurriculumItem {
  return {
    curriculumCode: CODE,
    weekNo: 1,
    sessionNo: 1,
    position: 1,
    entityType: "lesson",
    contentCode: "LES-X",
    entityId: 9001,
    isRequired: true,
    ...overrides,
  };
}

async function curriculumId(): Promise<number> {
  const db = getOwnerDb();
  const [row] = await db
    .select({ id: curricula.id })
    .from(curricula)
    .where(eq(curricula.code, CODE))
    .limit(1);
  if (!row) {
    throw new Error("Chương trình lộ trình chưa được gieo");
  }
  return row.id;
}

describe("gieo chương trình từ lộ trình", () => {
  it("idempotent: gieo lần hai không tạo thêm chương trình, đủ 12 tuần", async () => {
    const db = getOwnerDb();
    await seedRoadmapCurricula(db);
    const second = await seedRoadmapCurricula(db);
    expect(second.curriculaCount).toBe(0);
    const id = await curriculumId();
    const weeks = await db
      .select({ weekNo: curriculumWeeks.weekNo })
      .from(curriculumWeeks)
      .where(eq(curriculumWeeks.curriculumId, id));
    expect(weeks).toHaveLength(RM_3_4_MAM_01.duration_weeks);
  });

  it("item: upsert cập nhật thực thể khi trùng ô, chỉ xoá hàng thừa", async () => {
    const db = getOwnerDb();
    await seedRoadmapCurricula(db);
    const id = await curriculumId();
    await db
      .delete(curriculumItems)
      .where(eq(curriculumItems.curriculumId, id));

    await writeItemsForCurriculum(db, id, [
      item({ position: 1, entityId: 9001 }),
      item({ position: 2, entityId: 9002 }),
      item({ sessionNo: 2, position: 1, entityId: 9003 }),
    ]);
    const first = await db
      .select()
      .from(curriculumItems)
      .where(eq(curriculumItems.curriculumId, id));
    expect(first).toHaveLength(3);
    const keptRow = first.find(
      (row) => row.sessionNo === 1 && row.position === 1
    );

    await writeItemsForCurriculum(db, id, [
      item({ position: 1, entityId: 9100 }),
    ]);
    const second = await db
      .select()
      .from(curriculumItems)
      .where(eq(curriculumItems.curriculumId, id));
    expect(second).toHaveLength(1);
    expect(second[0]?.id).toBe(keptRow?.id);
    expect(second[0]?.entityId).toBe(9100);

    await db
      .delete(curriculumItems)
      .where(eq(curriculumItems.curriculumId, id));
  });
});
