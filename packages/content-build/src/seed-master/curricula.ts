import { ALL_ROADMAPS, type RoadmapSeed } from "@mindkid/content";
import type { getOwnerDb } from "@mindkid/db";
import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
} from "@mindkid/db";
import { eq, inArray } from "drizzle-orm";
import type { ContentDemandLedger } from "#src/gates/content-demand";
import {
  type CurriculumItemPlan,
  curriculumCodeForRoadmap,
  findStaleItemIds,
  planCurriculumItems,
  type ResolvedCurriculumItem,
  resolveCurriculumItems,
  roadmapToCurriculumConfig,
} from "./roadmap-curricula.js";

type OwnerDb = ReturnType<typeof getOwnerDb>;

async function findCurriculumId(
  db: OwnerDb,
  code: string
): Promise<number | undefined> {
  const [row] = await db
    .select({ id: curricula.id })
    .from(curricula)
    .where(eq(curricula.code, code))
    .limit(1);
  return row?.id;
}

async function upsertCurriculumRecord(
  db: OwnerDb,
  roadmap: RoadmapSeed
): Promise<{ curriculumId: number; isNew: boolean }> {
  const cfg = roadmapToCurriculumConfig(roadmap);
  const existing = await findCurriculumId(db, cfg.code);
  if (existing !== undefined) {
    return { curriculumId: existing, isNew: false };
  }

  const [inserted] = await db
    .insert(curricula)
    .values({
      code: cfg.code,
      programType: cfg.programType,
      targetAgeMin: cfg.targetAgeMin,
      targetAgeMax: cfg.targetAgeMax,
      durationWeeks: cfg.durationWeeks,
      sessionsPerWeek: cfg.sessionsPerWeek,
      title: cfg.title,
      description: cfg.description,
      accessTier: cfg.accessTier,
    })
    .onConflictDoNothing()
    .returning({ id: curricula.id });

  if (inserted?.id) {
    return { curriculumId: inserted.id, isNew: true };
  }
  const found = await findCurriculumId(db, cfg.code);
  if (found === undefined) {
    throw new Error(`Không tạo được chương trình ${cfg.code}`);
  }
  return { curriculumId: found, isNew: false };
}

async function seedCurriculumWeeksData(
  db: OwnerDb,
  curriculumId: number,
  roadmap: RoadmapSeed
): Promise<number> {
  for (const week of roadmap.weeks) {
    await db
      .insert(curriculumWeeks)
      .values({ curriculumId, weekNo: week.week_no, goal: week.goal })
      .onConflictDoUpdate({
        target: [curriculumWeeks.curriculumId, curriculumWeeks.weekNo],
        set: { goal: week.goal },
      });
  }
  return roadmap.weeks.length;
}

/**
 * Gieo bản ghi chương trình và các tuần từ lộ trình. Chạy trước bước gieo
 * nội dung: bước này không đọc `game_levels`.
 */
export async function seedRoadmapCurricula(
  db: OwnerDb,
  roadmaps: readonly RoadmapSeed[] = ALL_ROADMAPS
): Promise<{ curriculaCount: number; weeksCount: number }> {
  let curriculaCount = 0;
  let weeksCount = 0;
  for (const roadmap of roadmaps) {
    const { curriculumId, isNew } = await upsertCurriculumRecord(db, roadmap);
    if (isNew) {
      curriculaCount++;
    }
    weeksCount += await seedCurriculumWeeksData(db, curriculumId, roadmap);
  }
  return { curriculaCount, weeksCount };
}

async function loadIdsByCode(
  db: OwnerDb,
  plan: readonly CurriculumItemPlan[]
): Promise<{
  game_level: Map<string, number>;
}> {
  const levelCodes = [...new Set(plan.map((item) => item.contentCode))];
  const levelRows =
    levelCodes.length === 0
      ? []
      : await db
          .select({ id: gameLevels.id, code: gameLevels.code })
          .from(gameLevels)
          .where(inArray(gameLevels.code, levelCodes));
  return {
    game_level: new Map(levelRows.map((row) => [row.code, row.id])),
  };
}

export async function writeItemsForCurriculum(
  db: OwnerDb,
  curriculumId: number,
  items: readonly ResolvedCurriculumItem[]
): Promise<number> {
  for (const item of items) {
    await db
      .insert(curriculumItems)
      .values({
        curriculumId,
        weekNo: item.weekNo,
        sessionNo: item.sessionNo,
        position: item.position,
        entityType: item.entityType,
        entityId: item.entityId,
        isRequired: item.isRequired,
      })
      .onConflictDoUpdate({
        target: [
          curriculumItems.curriculumId,
          curriculumItems.weekNo,
          curriculumItems.sessionNo,
          curriculumItems.position,
        ],
        set: {
          entityType: item.entityType,
          entityId: item.entityId,
          isRequired: item.isRequired,
        },
      });
  }
  const existing = await db
    .select({
      id: curriculumItems.id,
      weekNo: curriculumItems.weekNo,
      sessionNo: curriculumItems.sessionNo,
      position: curriculumItems.position,
    })
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, curriculumId));
  const stale = findStaleItemIds(existing, items);
  if (stale.length > 0) {
    await db.delete(curriculumItems).where(inArray(curriculumItems.id, stale));
  }
  return items.length;
}

/**
 * Gieo `curriculum_items` thẳng từ sổ cầu. Mã nội dung được tra ra id, không
 * có bước chọn: mã nào chưa gieo thì ném lỗi thay vì bỏ qua.
 */
export async function seedCurriculumItems(
  db: OwnerDb,
  ledger: ContentDemandLedger,
  roadmaps: readonly RoadmapSeed[] = ALL_ROADMAPS
): Promise<{ itemsCount: number }> {
  const plan = planCurriculumItems(ledger);
  const resolved = resolveCurriculumItems(plan, await loadIdsByCode(db, plan));
  let itemsCount = 0;
  for (const roadmap of roadmaps) {
    const code = curriculumCodeForRoadmap(roadmap.code);
    const curriculumId = await findCurriculumId(db, code);
    if (curriculumId === undefined) {
      throw new Error(
        `Chương trình ${code} chưa được gieo; chạy bước lộ trình trước bước item`
      );
    }
    itemsCount += await writeItemsForCurriculum(
      db,
      curriculumId,
      resolved.filter((item) => item.curriculumCode === code)
    );
  }
  return { itemsCount };
}
