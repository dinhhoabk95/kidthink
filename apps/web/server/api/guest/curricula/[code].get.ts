import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  getOwnerDb,
  lessons,
} from "@mindkid/db";
import { ContentArchivedError } from "@mindkid/errors/content";
import { CurriculumNotFoundError } from "@mindkid/errors/curriculum";
import {
  type AccessTier,
  COMPETENCY_LABELS,
  type ProgramAlternativeSuggestion,
  type ProgramCompetencyShare,
  type RawCurriculumItemRecord,
  toProgramDetailPublic,
} from "@mindkid/shared";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { defineEventHandler, getRouterParam, setHeader } from "h3";

const CURRICULUM_CODE_REGEX = /^CUR-[A-Za-z0-9_-]+$/;
const COMPETENCY_REGEX = /^(?:GL-|LES-)?(C[1-6])/i;
const ALL_COMPETENCIES = ["C1", "C2", "C3", "C4", "C5", "C6"];

async function loadGameLevelsMap(
  db: ReturnType<typeof getOwnerDb>,
  entityIds: number[]
): Promise<
  Map<number, { code: string; title: string; accessTier: AccessTier }>
> {
  const map = new Map<
    number,
    { code: string; title: string; accessTier: AccessTier }
  >();
  if (entityIds.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      entityId: gameLevels.entityId,
      code: gameLevels.code,
      title: gameLevels.title,
      accessTier: gameLevels.accessTier,
    })
    .from(gameLevels)
    .where(
      and(
        inArray(gameLevels.entityId, entityIds),
        eq(gameLevels.status, "published")
      )
    );

  for (const row of rows) {
    map.set(row.entityId, {
      code: row.code,
      title: row.title,
      accessTier: row.accessTier as AccessTier,
    });
  }
  return map;
}

async function loadLessonsMap(
  db: ReturnType<typeof getOwnerDb>,
  entityIds: number[]
): Promise<
  Map<
    number,
    {
      code: string;
      title: string;
      accessTier: AccessTier;
      estimatedMinutes?: number | null;
    }
  >
> {
  const map = new Map<
    number,
    {
      code: string;
      title: string;
      accessTier: AccessTier;
      estimatedMinutes?: number | null;
    }
  >();
  if (entityIds.length === 0) {
    return map;
  }

  const rows = await db
    .select({
      entityId: lessons.entityId,
      code: lessons.code,
      title: lessons.title,
      accessTier: lessons.accessTier,
      estimatedMinutes: lessons.estimatedMinutes,
    })
    .from(lessons)
    .where(
      and(inArray(lessons.entityId, entityIds), eq(lessons.status, "published"))
    );

  for (const row of rows) {
    map.set(row.entityId, {
      code: row.code,
      title: row.title,
      accessTier: row.accessTier as AccessTier,
      estimatedMinutes: row.estimatedMinutes,
    });
  }
  return map;
}

async function handleArchivedCurriculum(
  db: ReturnType<typeof getOwnerDb>,
  curriculumCode: string
): Promise<never> {
  const alternativeRows = await db
    .select({
      code: curricula.code,
      title: curricula.title,
      accessTier: curricula.accessTier,
      targetAgeMin: curricula.targetAgeMin,
      targetAgeMax: curricula.targetAgeMax,
    })
    .from(curricula)
    .where(
      and(eq(curricula.status, "published"), ne(curricula.code, curriculumCode))
    )
    .orderBy(asc(curricula.targetAgeMin), asc(curricula.code))
    .limit(3);

  const suggestions: ProgramAlternativeSuggestion[] = alternativeRows.map(
    (alt) => ({
      code: alt.code,
      title: alt.title,
      access_tier: alt.accessTier as AccessTier,
      target_age: {
        min: alt.targetAgeMin ?? 3,
        max: alt.targetAgeMax ?? 6,
      },
    })
  );

  throw new ContentArchivedError("Chương trình học này đã ngừng phát hành.", {
    curriculum_code: curriculumCode,
    suggestions,
  });
}

function resolveSingleItem(
  item: {
    weekNo: number;
    sessionNo: number;
    position: number;
    entityType: string;
    entityId: number;
  },
  defaultTier: AccessTier,
  gameLevelsMap: Map<
    number,
    { code: string; title: string; accessTier: AccessTier }
  >,
  lessonsMap: Map<
    number,
    {
      code: string;
      title: string;
      accessTier: AccessTier;
      estimatedMinutes?: number | null;
    }
  >
): RawCurriculumItemRecord {
  if (item.entityType === "game_level") {
    const gl = gameLevelsMap.get(item.entityId);
    return {
      weekNo: item.weekNo,
      sessionNo: item.sessionNo,
      position: item.position,
      entityType: item.entityType,
      code: gl?.code || "",
      title: gl?.title || "",
      estimatedMinutes: 10,
      accessTier: gl?.accessTier || defaultTier,
    };
  }

  const les = lessonsMap.get(item.entityId);
  return {
    weekNo: item.weekNo,
    sessionNo: item.sessionNo,
    position: item.position,
    entityType: item.entityType,
    code: les?.code || "",
    title: les?.title || "",
    estimatedMinutes: les?.estimatedMinutes || 20,
    accessTier: les?.accessTier || defaultTier,
  };
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!(code && CURRICULUM_CODE_REGEX.test(code))) {
    throw new CurriculumNotFoundError(code);
  }

  setHeader(event, "Cache-Control", "public, max-age=600");

  const db = getOwnerDb();

  const [curriculum] = await db
    .select({
      id: curricula.id,
      code: curricula.code,
      title: curricula.title,
      description: curricula.description,
      programType: curricula.programType,
      targetAgeMin: curricula.targetAgeMin,
      targetAgeMax: curricula.targetAgeMax,
      durationWeeks: curricula.durationWeeks,
      sessionsPerWeek: curricula.sessionsPerWeek,
      accessTier: curricula.accessTier,
      status: curricula.status,
    })
    .from(curricula)
    .where(eq(curricula.code, code));

  if (!curriculum || curriculum.status === "draft") {
    throw new CurriculumNotFoundError(code);
  }

  if (curriculum.status === "archived") {
    await handleArchivedCurriculum(db, curriculum.code);
  }

  const rawWeeks = await db
    .select({
      weekNo: curriculumWeeks.weekNo,
      goal: curriculumWeeks.goal,
    })
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.curriculumId, curriculum.id))
    .orderBy(asc(curriculumWeeks.weekNo));

  const rawItems = await db
    .select({
      id: curriculumItems.id,
      weekNo: curriculumItems.weekNo,
      sessionNo: curriculumItems.sessionNo,
      position: curriculumItems.position,
      entityType: curriculumItems.entityType,
      entityId: curriculumItems.entityId,
    })
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, curriculum.id))
    .orderBy(
      asc(curriculumItems.weekNo),
      asc(curriculumItems.sessionNo),
      asc(curriculumItems.position)
    );

  const gameLevelIds = rawItems
    .filter((i) => i.entityType === "game_level")
    .map((i) => i.entityId);
  const lessonIds = rawItems
    .filter((i) => i.entityType === "lesson")
    .map((i) => i.entityId);

  const [gameLevelsMap, lessonsMap] = await Promise.all([
    loadGameLevelsMap(db, gameLevelIds),
    loadLessonsMap(db, lessonIds),
  ]);

  const defaultTier = curriculum.accessTier as AccessTier;
  const competencyCounts = new Map<string, number>();
  let totalCountedItems = 0;

  const resolvedItems: RawCurriculumItemRecord[] = rawItems.map((item) => {
    const resolved = resolveSingleItem(
      item,
      defaultTier,
      gameLevelsMap,
      lessonsMap
    );
    if (resolved.code) {
      const match = resolved.code.match(COMPETENCY_REGEX);
      const matchedComp = match?.[1];
      if (matchedComp) {
        const comp = matchedComp.toUpperCase();
        competencyCounts.set(comp, (competencyCounts.get(comp) || 0) + 1);
        totalCountedItems++;
      }
    }
    return resolved;
  });

  const competencyDistribution: ProgramCompetencyShare[] = [];
  for (const comp of ALL_COMPETENCIES) {
    const count = competencyCounts.get(comp) || 0;
    const share = totalCountedItems > 0 ? count / totalCountedItems : 0;
    competencyDistribution.push({
      code: comp,
      label: COMPETENCY_LABELS[comp] || comp,
      share: Number(share.toFixed(3)),
    });
  }

  return toProgramDetailPublic({
    curriculum,
    weeks: rawWeeks,
    items: resolvedItems,
    competencyDistribution,
  });
});
