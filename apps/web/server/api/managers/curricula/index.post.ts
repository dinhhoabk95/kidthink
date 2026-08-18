import {
  curricula,
  curriculumItems,
  curriculumWeeks,
  getOwnerDb,
  writeAudit,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { z } from "zod";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

const createCurriculumSchema = z.object({
  code: z
    .string()
    .regex(/^CUR-[A-Za-z0-9_-]+$/, "Mã sai định dạng CUR-xxx")
    .optional(),
  program_type: z.enum(["age_based", "journey"]).default("age_based"),
  target_age_min: z.number().int().min(3).max(6).nullable().optional(),
  target_age_max: z.number().int().min(3).max(6).nullable().optional(),
  duration_weeks: z.number().int().min(1).max(52).default(8),
  sessions_per_week: z.number().int().min(1).max(7).default(3),
  title: z.string().min(1, "Tiêu đề không được để trống"),
  description: z.string().nullable().optional(),
  access_tier: z
    .enum(["free", "login", "standard", "premium"])
    .default("standard"),
  weeks: z
    .array(
      z.object({
        week_no: z.number().int().positive(),
        goal: z.string().min(1),
      })
    )
    .optional(),
  items: z
    .array(
      z.object({
        week_no: z.number().int().positive(),
        session_no: z.number().int().positive(),
        position: z.number().int().positive(),
        entity_type: z.enum(["lesson", "game_level"]),
        entity_id: z.number().int().positive(),
        is_required: z.boolean().default(true),
      })
    )
    .optional(),
});

const CUR_CODE_REGEX = /^CUR-(\d+)$/;

async function generateNextCurriculumCode(
  db: ReturnType<typeof getOwnerDb>
): Promise<string> {
  const rows = await db.select({ code: curricula.code }).from(curricula);

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
  while (true) {
    const candidate = `CUR-${nextNum.toString().padStart(3, "0")}`;
    const [existing] = await db
      .select({ id: curricula.id })
      .from(curricula)
      .where(eq(curricula.code, candidate))
      .limit(1);
    if (!existing) {
      return candidate;
    }
    nextNum++;
  }
}

async function insertInitialWeeks(
  db: ReturnType<typeof getOwnerDb>,
  curriculumId: number,
  weeks?: z.infer<typeof createCurriculumSchema>["weeks"]
) {
  if (!weeks || weeks.length === 0) {
    return;
  }
  await db.insert(curriculumWeeks).values(
    weeks.map((wk) => ({
      curriculumId,
      weekNo: wk.week_no,
      goal: wk.goal,
    }))
  );
}

async function insertInitialItems(
  db: ReturnType<typeof getOwnerDb>,
  curriculumId: number,
  items?: z.infer<typeof createCurriculumSchema>["items"]
) {
  if (!items || items.length === 0) {
    return;
  }
  await db.insert(curriculumItems).values(
    items.map((item) => ({
      curriculumId,
      weekNo: item.week_no,
      sessionNo: item.session_no,
      position: item.position,
      entityType: item.entity_type,
      entityId: item.entity_id,
      isRequired: item.is_required,
    }))
  );
}

async function createCurriculumRecord(
  db: ReturnType<typeof getOwnerDb>,
  data: z.infer<typeof createCurriculumSchema>,
  managerId: number
) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = data.code || (await generateNextCurriculumCode(db));
    const entityId = Date.now() + Math.floor(Math.random() * 100_000);

    try {
      const [created] = await db
        .insert(curricula)
        .values({
          entityId,
          code,
          contentVersion: 1,
          programType: data.program_type,
          targetAgeMin: data.target_age_min ?? null,
          targetAgeMax: data.target_age_max ?? null,
          durationWeeks: data.duration_weeks,
          sessionsPerWeek: data.sessions_per_week,
          title: data.title,
          description: data.description ?? null,
          accessTier: data.access_tier,
          status: "draft",
          origin: "human",
          authoredIn: "studio",
          createdByManagerId: managerId,
        })
        .returning();

      await insertInitialWeeks(db, created.id, data.weeks);
      await insertInitialItems(db, created.id, data.items);

      return created;
    } catch (err: unknown) {
      lastErr = err;
      const errCode =
        (err as { code?: string })?.code ||
        (err as { cause?: { code?: string } })?.cause?.code;
      if (errCode === "23505" && !data.code && attempt < 4) {
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const rawBody =
    (event.context?.body as unknown) ??
    (event as Record<string, unknown>)._body ??
    (await readBody(event).catch(() => ({}))) ??
    {};

  const parsed = createCurriculumSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ",
    });
  }

  const db = getOwnerDb();
  const data = parsed.data;
  const managerId = session.manager_id || session.id || 1;

  const created = await createCurriculumRecord(db, data, managerId);

  await writeAudit(db, {
    action: "content_created",
    actor_type: "manager",
    actor_id: managerId,
    entity_type: "curriculum",
    entity_id: String(created.id),
    after_data: {
      code: created.code,
      version: created.contentVersion,
      title: created.title,
      program_type: created.programType,
    },
  });

  setResponseStatus(event, 201);
  return created;
});
