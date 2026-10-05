import { ALL_ROADMAPS, type RoadmapSeed } from "@mindkid/content";
import type { getOwnerDb } from "@mindkid/db";
import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  lessons,
} from "@mindkid/db";
import { and, eq, inArray } from "drizzle-orm";
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
  code: string,
  contentVersion: number
): Promise<number | undefined> {
  const [row] = await db
    .select({ id: curricula.id })
    .from(curricula)
    .where(
      and(
        eq(curricula.code, code),
        eq(curricula.contentVersion, contentVersion)
      )
    )
    .limit(1);
  return row?.id;
}

async function upsertCurriculumRecord(
  db: OwnerDb,
  roadmap: RoadmapSeed,
  idx: number
): Promise<{ curriculumId: number; isNew: boolean }> {
  const cfg = roadmapToCurriculumConfig(roadmap);
  const existing = await findCurriculumId(db, cfg.code, cfg.contentVersion);
  if (existing !== undefined) {
    return { curriculumId: existing, isNew: false };
  }

  const [inserted] = await db
    .insert(curricula)
    .values({
      entityId: idx + 1,
      code: cfg.code,
      contentVersion: cfg.contentVersion,
      programType: cfg.programType,
      targetAgeMin: cfg.targetAgeMin,
      targetAgeMax: cfg.targetAgeMax,
      durationWeeks: cfg.durationWeeks,
      sessionsPerWeek: cfg.sessionsPerWeek,
      title: cfg.title,
      description: cfg.description,
      accessTier: cfg.accessTier,
      status: cfg.status,
      authoredIn: "repo_seed",
      publishedAt: cfg.status === "published" ? new Date() : null,
    })
    .onConflictDoNothing()
    .returning({ id: curricula.id });

  if (inserted?.id) {
    return { curriculumId: inserted.id, isNew: true };
  }
  const found = await findCurriculumId(db, cfg.code, cfg.contentVersion);
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
 * nội dung: bước này không đọc `lessons` hay `game_levels`.
 */
export async function seedRoadmapCurricula(
  db: OwnerDb,
  roadmaps: readonly RoadmapSeed[] = ALL_ROADMAPS
): Promise<{ curriculaCount: number; weeksCount: number }> {
  let curriculaCount = 0;
  let weeksCount = 0;
  for (const [idx, roadmap] of roadmaps.entries()) {
    const { curriculumId, isNew } = await upsertCurriculumRecord(
      db,
      roadmap,
      idx
    );
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
  lesson: Map<string, number>;
  game_level: Map<string, number>;
}> {
  const wanted = (type: CurriculumItemPlan["entityType"]) => [
    ...new Set(
      plan
        .filter((item) => item.entityType === type)
        .map((item) => item.contentCode)
    ),
  ];
  const lessonCodes = wanted("lesson");
  const levelCodes = wanted("game_level");
  const [lessonRows, levelRows] = await Promise.all([
    lessonCodes.length === 0
      ? []
      : db
          .select({ id: lessons.id, code: lessons.code })
          .from(lessons)
          .where(inArray(lessons.code, lessonCodes)),
    levelCodes.length === 0
      ? []
      : db
          .select({ id: gameLevels.id, code: gameLevels.code })
          .from(gameLevels)
          .where(inArray(gameLevels.code, levelCodes)),
  ]);
  return {
    lesson: new Map(lessonRows.map((row) => [row.code, row.id])),
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
    const curriculumId = await findCurriculumId(db, code, roadmap.version);
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
