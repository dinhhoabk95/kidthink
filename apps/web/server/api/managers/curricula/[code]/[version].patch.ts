import { curricula, getOwnerDb, writeAudit } from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

const patchCurriculumSchema = z.object({
  expected_version: z.number().int({
    message: "Bắt buộc truyền expected_version để kiểm soát đồng thời",
  }),
  title: z.string().min(1, "Tiêu đề không được để trống").optional(),
  description_vi: z.string().nullable().optional(),
  program_type: z.enum(["age_based", "journey"]).optional(),
  target_age_min: z.number().int().min(3).max(6).nullable().optional(),
  target_age_max: z.number().int().min(3).max(6).nullable().optional(),
  duration_weeks: z.number().int().min(1).max(52).optional(),
  sessions_per_week: z.number().int().min(1).max(7).optional(),
  access_tier: z.enum(["free", "login", "standard", "premium"]).optional(),
});

function buildCurriculumPatchPayload(
  data: z.infer<typeof patchCurriculumSchema>
): Partial<typeof curricula.$inferInsert> {
  const updatePayload: Partial<typeof curricula.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (data.title !== undefined) {
    updatePayload.titleVi = data.title;
  }
  if (data.description_vi !== undefined) {
    updatePayload.descriptionVi = data.description_vi;
  }
  if (data.program_type !== undefined) {
    updatePayload.programType = data.program_type;
  }
  if (data.target_age_min !== undefined) {
    updatePayload.targetAgeMin = data.target_age_min;
  }
  if (data.target_age_max !== undefined) {
    updatePayload.targetAgeMax = data.target_age_max;
  }
  if (data.duration_weeks !== undefined) {
    updatePayload.durationWeeks = data.duration_weeks;
  }
  if (data.sessions_per_week !== undefined) {
    updatePayload.sessionsPerWeek = data.sessions_per_week;
  }
  if (data.access_tier !== undefined) {
    updatePayload.accessTier = data.access_tier;
  }

  return updatePayload;
}

async function getExistingCurriculumForPatch(
  db: ReturnType<typeof getOwnerDb>,
  code: string,
  version: number,
  expectedVersion: number
) {
  const [existing] = await db
    .select()
    .from(curricula)
    .where(
      and(eq(curricula.code, code), eq(curricula.contentVersion, version))
    );

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "CURRICULUM_NOT_FOUND",
      message: `Không tìm thấy chương trình ${code} version ${version}`,
    });
  }

  if (existing.contentVersion !== expectedVersion) {
    throw createError({
      statusCode: 409,
      statusMessage: "VERSION_CONFLICT",
      message: `Xung đột phiên bản: version hiện tại là ${existing.contentVersion}, nhưng bạn đang sửa trên version ${expectedVersion}`,
    });
  }

  return existing;
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
      (event as { _body?: unknown })._body ??
      (await readBody(event).catch(() => ({}))) ??
      {};
    const parsed = patchCurriculumSchema.safeParse(rawBody);
    if (!parsed.success) {
      throw createError({
        statusCode: 422,
        statusMessage: "VALIDATION_FAILED",
        message: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ",
      });
    }

    const data = parsed.data;
    const db = getOwnerDb();
    const managerId = session.manager_id || session.id || 1;

    const existing = await getExistingCurriculumForPatch(
      db,
      code,
      version,
      data.expected_version
    );

    const updatePayload = buildCurriculumPatchPayload(data);

    const [updated] = await db
      .update(curricula)
      .set(updatePayload)
      .where(eq(curricula.id, existing.id))
      .returning();

    await writeAudit(db, {
      action: "content_created",
      actor_type: "manager",
      actor_id: managerId,
      entity_type: "curriculum",
      entity_id: String(updated.id),
      after_data: {
        code: updated.code,
        version: updated.contentVersion,
        changes: Object.keys(updatePayload),
      },
    });

    return updated;
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
