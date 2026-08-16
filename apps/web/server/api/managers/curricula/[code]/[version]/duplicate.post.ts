import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  getOwnerDb,
  writeAudit,
} from "@kidthink/db";
import { and, desc, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../../utils/admin-auth-runtime.js";

const duplicateCurriculumSchema = z.object({
  new_code: z
    .string()
    .regex(/^CUR-[A-Za-z0-9_-]+$/, "Mã sai định dạng CUR-xxx")
    .optional(),
  title: z.string().min(1).optional(),
});

const CUR_CODE_REGEX = /^CUR-(\d{3})$/;

async function generateNextCurriculumCode(
  db: ReturnType<typeof getOwnerDb>
): Promise<string> {
  const rows = await db
    .select({ code: curricula.code })
    .from(curricula)
    .orderBy(desc(curricula.id))
    .limit(500);

  const existingCodes = new Set(rows.map((r) => r.code));
  let maxNum = 0;
  for (const r of rows) {
    const match = r.code.match(CUR_CODE_REGEX);
    if (match) {
      const num = Number.parseInt(match[1], 10);
      if (!Number.isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  let nextNum = maxNum + 1;
  while (existingCodes.has(`CUR-${nextNum.toString().padStart(3, "0")}`)) {
    nextNum++;
  }
  return `CUR-${nextNum.toString().padStart(3, "0")}`;
}

async function copyWeeksAndItems(
  db: ReturnType<typeof getOwnerDb>,
  sourceId: number,
  newCurriculumId: number
) {
  const sourceWeeks = await db
    .select()
    .from(curriculumWeeks)
    .where(eq(curriculumWeeks.curriculumId, sourceId));

  for (const wk of sourceWeeks) {
    await db.insert(curriculumWeeks).values({
      curriculumId: newCurriculumId,
      weekNo: wk.weekNo,
      goal: wk.goal,
    });
  }

  const sourceItems = await db
    .select()
    .from(curriculumItems)
    .where(eq(curriculumItems.curriculumId, sourceId));

  for (const it of sourceItems) {
    await db.insert(curriculumItems).values({
      curriculumId: newCurriculumId,
      weekNo: it.weekNo,
      sessionNo: it.sessionNo,
      position: it.position,
      entityType: it.entityType,
      entityId: it.entityId,
      isRequired: it.isRequired,
    });
  }
}

async function createDuplicateRecord(
  db: ReturnType<typeof getOwnerDb>,
  source: typeof curricula.$inferSelect,
  newTitle: string,
  requestedCode: string | undefined,
  managerId: number
) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    const newCode = requestedCode || (await generateNextCurriculumCode(db));
    const newEntityId = Date.now() + Math.floor(Math.random() * 100_000);

    try {
      const [created] = await db
        .insert(curricula)
        .values({
          entityId: newEntityId,
          code: newCode,
          contentVersion: 1,
          programType: source.programType,
          targetAgeMin: source.targetAgeMin,
          targetAgeMax: source.targetAgeMax,
          durationWeeks: source.durationWeeks,
          sessionsPerWeek: source.sessionsPerWeek,
          titleVi: newTitle,
          descriptionVi: source.descriptionVi,
          accessTier: source.accessTier,
          status: "draft",
          origin: "human",
          authoredIn: "studio",
          createdByManagerId: managerId,
        })
        .returning();

      return created;
    } catch (err: unknown) {
      lastErr = err;
      if (
        (err as { code?: string })?.code === "23505" &&
        !requestedCode &&
        attempt < 4
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export default defineEventHandler(async (event) => {
  try {
    const session = await requireManagerSession(event);
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

    const rawBody =
      (event.context?.body as unknown) ??
      (event as Record<string, unknown>)._body ??
      (await readBody(event).catch(() => ({}))) ??
      {};
    const parsed = duplicateCurriculumSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw createError({
        statusCode: 422,
        statusMessage: "VALIDATION_FAILED",
        message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ",
      });
    }

    const db = getOwnerDb();
    const managerId = session.manager_id || session.id || 1;

    const [source] = await db
      .select()
      .from(curricula)
      .where(
        and(eq(curricula.code, code), eq(curricula.contentVersion, version))
      );

    if (!source) {
      throw createError({
        statusCode: 404,
        statusMessage: "CURRICULUM_NOT_FOUND",
        message: `Không tìm thấy chương trình ${code} version ${version}`,
      });
    }

    const newTitle = parsed.data.title || `${source.titleVi} (Bản sao)`;
    const created = await createDuplicateRecord(
      db,
      source,
      newTitle,
      parsed.data.new_code,
      managerId
    );

    await copyWeeksAndItems(db, source.id, created.id);

    await writeAudit(db, {
      action: "content_created",
      actor_type: "manager",
      actor_id: managerId,
      entity_type: "curriculum",
      entity_id: String(created.id),
      after_data: {
        source_code: source.code,
        source_version: source.contentVersion,
        new_code: created.code,
        new_version: created.contentVersion,
      },
    });

    setResponseStatus(event, 201);
    return created;
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
