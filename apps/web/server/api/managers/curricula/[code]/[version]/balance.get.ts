import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  getOwnerDb,
  lessons,
} from "@mindkid/db";
import {
  type CurriculumItemMetadata,
  calculateCurriculumBalance,
} from "@mindkid/shared";
import { and, asc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const LES_COMPETENCY_REGEX = /LES-(C[1-6])/i;
const GL_COMPETENCY_REGEX = /GL-(C[1-6])/i;

async function fetchLessonMeta(
  db: ReturnType<typeof getOwnerDb>,
  entityId: number
) {
  const [les] = await db
    .select({
      code: lessons.code,
      title: lessons.title,
      status: lessons.status,
      estimatedMinutes: lessons.estimatedMinutes,
    })
    .from(lessons)
    .where(eq(lessons.entityId, entityId))
    .orderBy(lessons.contentVersion)
    .limit(1);

  if (!les) {
    return {};
  }
  const match = les.code.match(LES_COMPETENCY_REGEX);
  return {
    codeStr: les.code,
    titleViStr: les.title,
    statusStr: les.status,
    minsNum: les.estimatedMinutes ?? 20,
    compStr: match?.[1] ? match[1].toUpperCase() : undefined,
  };
}

async function fetchGameLevelMeta(
  db: ReturnType<typeof getOwnerDb>,
  entityId: number
) {
  const [lvl] = await db
    .select({
      code: gameLevels.code,
      title: gameLevels.title,
      status: gameLevels.status,
      difficulty: gameLevels.difficulty,
    })
    .from(gameLevels)
    .where(eq(gameLevels.entityId, entityId))
    .orderBy(gameLevels.contentVersion)
    .limit(1);

  if (!lvl) {
    return {};
  }
  const match = lvl.code.match(GL_COMPETENCY_REGEX);
  return {
    codeStr: lvl.code,
    titleViStr: lvl.title,
    statusStr: lvl.status,
    diffNum: lvl.difficulty ?? 1,
    minsNum: 10,
    compStr: match?.[1] ? match[1].toUpperCase() : undefined,
  };
}

interface ResolvedMeta {
  codeStr?: string;
  titleViStr?: string;
  statusStr?: string;
  compStr?: string;
  diffNum?: number;
  minsNum?: number;
}

async function resolveCurriculumItemMetadata(
  db: ReturnType<typeof getOwnerDb>,
  it: typeof curriculumItems.$inferSelect
): Promise<CurriculumItemMetadata> {
  let resolved: ResolvedMeta = {};
  if (it.entityType === "lesson") {
    resolved = await fetchLessonMeta(db, it.entityId);
  } else if (it.entityType === "game_level") {
    resolved = await fetchGameLevelMeta(db, it.entityId);
  }

  return {
    week_no: it.weekNo,
    session_no: it.sessionNo,
    position: it.position,
    entity_type: it.entityType as "lesson" | "game_level",
    entity_id: it.entityId,
    code: resolved.codeStr,
    title: resolved.titleViStr,
    status: resolved.statusStr,
    competency_code: resolved.compStr,
    difficulty: resolved.diffNum,
    estimated_minutes: resolved.minsNum,
    is_required: it.isRequired,
  };
}

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");
  const version = Number(versionParam) || 1;

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "BAD_REQUEST",
      message: "Thiếu tham số mã chương trình",
    });
  }

  const db = getOwnerDb();
  const [curr] = await db
    .select()
    .from(curricula)
    .where(
      and(eq(curricula.code, code), eq(curricula.contentVersion, version))
    );

  if (!curr) {
    throw createError({
      statusCode: 404,
      statusMessage: "CURRICULUM_NOT_FOUND",
      message: `Không tìm thấy chương trình ${code} version ${version}`,
    });
  }

  const weeks = await db
    .select()
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.curriculumId, curr.id))
    .orderBy(asc(curriculumWeeks.weekNo));

  const rawItems = await db
    .select()
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, curr.id))
    .orderBy(
      asc(curriculumItems.weekNo),
      asc(curriculumItems.sessionNo),
      asc(curriculumItems.position)
    );

  const balanceItemsPayload: CurriculumItemMetadata[] = [];
  for (const it of rawItems) {
    const meta = await resolveCurriculumItemMetadata(db, it);
    balanceItemsPayload.push(meta);
  }

  const balanceReport = calculateCurriculumBalance({
    code: curr.code,
    program_type: curr.programType,
    duration_weeks: curr.durationWeeks,
    sessions_per_week: curr.sessionsPerWeek,
    title: curr.title,
    target_age_min: curr.targetAgeMin,
    target_age_max: curr.targetAgeMax,
    status: curr.status,
    items: balanceItemsPayload,
    weeks: weeks.map((w) => ({ week_no: w.weekNo, goal: w.goal })),
  });

  return balanceReport;
});
