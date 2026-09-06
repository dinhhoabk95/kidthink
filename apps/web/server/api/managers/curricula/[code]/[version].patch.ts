import { writeAudit } from "@mindkid/audit";
import { curricula, getOwnerDb } from "@mindkid/db";
import { InternalError, ValidationError } from "@mindkid/errors/common";
import { VersionConflictError } from "@mindkid/errors/content";
import { CurriculumNotFoundError } from "@mindkid/errors/curriculum";
import { and, eq } from "drizzle-orm";
import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const patchCurriculumSchema = z.object({
  expected_version: z.number().int({
    message: "Bắt buộc truyền expected_version để kiểm soát đồng thời",
  }),
  title: z.string().min(1, "Tiêu đề không được để trống").optional(),
  description: z.string().nullable().optional(),
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
    updatePayload.title = data.title;
  }
  if (data.description !== undefined) {
    updatePayload.description = data.description;
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
    throw new CurriculumNotFoundError(
      `Không tìm thấy chương trình ${code} version ${version}`
    );
  }

  if (existing.contentVersion !== expectedVersion) {
    throw new VersionConflictError(
      `Xung đột phiên bản: version hiện tại là ${existing.contentVersion}`
    );
  }

  return existing;
}

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");
  const version = Number(versionParam) || 1;

  if (!code) {
    throw new ValidationError("Thiếu tham số mã chương trình");
  }

  const rawBody =
    (event.context?.body as unknown) ??
    (event as { _body?: unknown })._body ??
    (await readBody(event).catch(() => ({}))) ??
    {};
  const parsed = patchCurriculumSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ"
    );
  }

  const data = parsed.data;
  const db = getOwnerDb();
  const managerId = session.manager_id;

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

  if (!updated) {
    throw new InternalError("Cập nhật chương trình thất bại");
  }

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
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
  });

  return updated;
});
