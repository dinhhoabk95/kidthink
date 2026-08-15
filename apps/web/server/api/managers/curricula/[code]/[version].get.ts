import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  gameLevels,
  getOwnerDb,
  lessons,
} from "@kidthink/db";
import {
  type CurriculumItemMetadata,
  calculateCurriculumBalance,
} from "@kidthink/shared";
import { and, asc, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

const LES_COMPETENCY_REGEX = /LES-(C[1-6])/i;
const GL_COMPETENCY_REGEX = /GL-(C[1-6])/i;

async function enrichCurriculumItem(
  db: ReturnType<typeof getOwnerDb>,
  it: typeof curriculumItems.$inferSelect
) {
  let codeStr: string | undefined;
  let titleViStr: string | undefined;
  let statusStr: string | undefined;
  let compStr: string | undefined;
  let diffNum: number | undefined;
  let minsNum: number | undefined;

  if (it.entityType === "lesson") {
    const [les] = await db
      .select({
        code: lessons.code,
        titleVi: lessons.titleVi,
        status: lessons.status,
        estimatedMinutes: lessons.estimatedMinutes,
      })
      .from(lessons)
      .where(eq(lessons.entityId, it.entityId))
      .orderBy(lessons.contentVersion)
      .limit(1);

    if (les) {
      codeStr = les.code;
      titleViStr = les.titleVi;
      statusStr = les.status;
      minsNum = les.estimatedMinutes ?? 20;
      const match = les.code.match(LES_COMPETENCY_REGEX);
      if (match) {
        compStr = match[1].toUpperCase();
      }
    }
  } else if (it.entityType === "game_level") {
    const [lvl] = await db
      .select({
        code: gameLevels.code,
        titleVi: gameLevels.titleVi,
        status: gameLevels.status,
        difficulty: gameLevels.difficulty,
      })
      .from(gameLevels)
      .where(eq(gameLevels.entityId, it.entityId))
      .orderBy(gameLevels.contentVersion)
      .limit(1);

    if (lvl) {
      codeStr = lvl.code;
      titleViStr = lvl.titleVi;
      statusStr = lvl.status;
      diffNum = lvl.difficulty ?? 1;
      minsNum = 10;
      const match = lvl.code.match(GL_COMPETENCY_REGEX);
      if (match) {
        compStr = match[1].toUpperCase();
      }
    }
  }

  const enriched = {
    ...it,
    code: codeStr,
    title_vi: titleViStr,
    status: statusStr,
    competency_code: compStr,
    difficulty: diffNum,
    estimated_minutes: minsNum,
  };

  const balanceItem: CurriculumItemMetadata = {
    week_no: it.weekNo,
    session_no: it.sessionNo,
    position: it.position,
    entity_type: it.entityType as "lesson" | "game_level",
    entity_id: it.entityId,
    code: codeStr,
    title_vi: titleViStr,
    status: statusStr,
    competency_code: compStr,
    difficulty: diffNum,
    estimated_minutes: minsNum,
    is_required: it.isRequired,
  };

  return { enriched, balanceItem };
}

export default defineEventHandler(async (event) => {
  try {
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

    const enrichedItems: Awaited<
      ReturnType<typeof enrichCurriculumItem>
    >["enriched"][] = [];
    const balanceItemsPayload: CurriculumItemMetadata[] = [];

    for (const it of rawItems) {
      const { enriched, balanceItem } = await enrichCurriculumItem(db, it);
      enrichedItems.push(enriched);
      balanceItemsPayload.push(balanceItem);
    }

    const balanceReport = calculateCurriculumBalance({
      code: curr.code,
      program_type: curr.programType,
      duration_weeks: curr.durationWeeks,
      sessions_per_week: curr.sessionsPerWeek,
      title_vi: curr.titleVi,
      target_age_min: curr.targetAgeMin,
      target_age_max: curr.targetAgeMax,
      status: curr.status,
      items: balanceItemsPayload,
      weeks: weeks.map((w) => ({ week_no: w.weekNo, goal: w.goal })),
    });

    return {
      ...curr,
      weeks,
      items: enrichedItems,
      balance: balanceReport,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
