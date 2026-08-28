import {
  activities,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  isEnabled as isFeatureEnabled,
  writeAudit,
} from "@mindkid/db";
import {
  resolveActivityRefType,
  updateActivityFormSchema,
} from "@mindkid/shared";
import { and, eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import type { z } from "zod";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

type UpdateActivityInput = z.infer<typeof updateActivityFormSchema>;

async function validateActivityPatch(
  db: ReturnType<typeof getOwnerDb>,
  targetKind: string,
  data: UpdateActivityInput,
  existingRefId: number | null
) {
  if (targetKind === "worksheet") {
    const isWorksheetEnabled = await isFeatureEnabled("worksheet_activity");
    if (!isWorksheetEnabled) {
      throw createError({
        statusCode: 422,
        statusMessage: "WORKSHEET_ACTIVITY_DISABLED",
        message: "Tính năng hoạt động worksheet hiện đang bị khoá ở MVP (D-LN)",
      });
    }
  }

  if (targetKind === "digital_game") {
    const refId = data.ref_id === undefined ? existingRefId : data.ref_id;
    if (!refId) {
      throw createError({
        statusCode: 422,
        statusMessage: "REFERENCED_LEVEL_REQUIRED",
        message: "Hoạt động digital_game bắt buộc có ref_id trỏ game level",
      });
    }
    const [level] = await db
      .select({ id: gameLevels.id, status: gameLevels.status })
      .from(gameLevels)
      .where(eq(gameLevels.id, refId))
      .limit(1);

    if (level?.status !== "published") {
      throw createError({
        statusCode: 422,
        statusMessage: "REFERENCED_LEVEL_NOT_PUBLISHED",
        message:
          "Hoạt động digital_game bắt buộc phải liên kết tới game level đã xuất bản (BR-ACA-02)",
      });
    }
  }
}

async function syncActivitySkills(
  db: ReturnType<typeof getOwnerDb>,
  entityId: number,
  skillIds?: number[]
) {
  if (!skillIds || skillIds.length === 0) {
    return;
  }
  await db
    .delete(contentSkillMap)
    .where(
      and(
        eq(contentSkillMap.entityType, "activity"),
        eq(contentSkillMap.entityId, entityId)
      )
    );
  const weightPerSkill = (1.0 / skillIds.length).toFixed(2);
  await db
    .insert(contentSkillMap)
    .values(
      skillIds.map((skillId) => ({
        entityType: "activity" as const,
        entityId,
        skillId,
        weight: weightPerSkill,
      }))
    )
    .onConflictDoNothing();
}

async function handlePublishedActivityFork(
  db: ReturnType<typeof getOwnerDb>,
  existing: typeof activities.$inferSelect,
  targetKind: string,
  data: UpdateActivityInput,
  managerId: number
) {
  const newVersion = existing.contentVersion + 1;
  const refType = resolveActivityRefType(targetKind);
  const refId =
    targetKind === "digital_game" ? data.ref_id || existing.refId : null;

  const [created] = await db
    .insert(activities)
    .values({
      entityId: existing.entityId,
      code: existing.code,
      contentVersion: newVersion,
      kind: targetKind as typeof activities.$inferSelect.kind,
      title: data.title || existing.title,
      instruction: data.instruction || existing.instruction,
      materials:
        data.materials === undefined ? existing.materials : data.materials,
      estimatedMinutes:
        data.estimated_minutes === undefined
          ? existing.estimatedMinutes
          : data.estimated_minutes,
      refType: refType as typeof activities.$inferSelect.refType,
      refId,
      accessTier: data.access_tier || existing.accessTier,
      status: "draft",
      origin: existing.origin,
      authoredIn: "studio",
      createdByManagerId: managerId,
    })
    .returning();

  await syncActivitySkills(db, existing.entityId, data.skill_ids);

  await writeAudit(db, {
    actorType: "manager",
    actorId: managerId,
    action: "create",
    entityType: "activity",
    entityId: String(created.id),
    beforeState: existing,
    afterState: created,
    reason: `Manager created new draft version ${newVersion} from published activity`,
  });

  return created;
}

async function handleDraftActivityUpdate(
  db: ReturnType<typeof getOwnerDb>,
  existing: typeof activities.$inferSelect,
  data: UpdateActivityInput,
  managerId: number
) {
  const patch: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (data.kind !== undefined) {
    patch.kind = data.kind;
    patch.refType = resolveActivityRefType(data.kind);
  }
  if (data.title !== undefined) {
    patch.title = data.title;
  }
  if (data.instruction !== undefined) {
    patch.instruction = data.instruction;
  }
  if (data.materials !== undefined) {
    patch.materials = data.materials;
  }
  if (data.estimated_minutes !== undefined) {
    patch.estimatedMinutes = data.estimated_minutes;
  }
  if (data.ref_id !== undefined) {
    patch.refId = data.ref_id;
  }
  if (data.access_tier !== undefined) {
    patch.accessTier = data.access_tier;
  }

  const [updated] = await db
    .update(activities)
    .set(patch)
    .where(eq(activities.id, existing.id))
    .returning();

  await syncActivitySkills(db, existing.entityId, data.skill_ids);

  await writeAudit(db, {
    actorType: "manager",
    actorId: managerId,
    action: "update",
    entityType: "activity",
    entityId: String(updated.id),
    beforeState: existing,
    afterState: updated,
    reason: "Manager updated activity via Studio",
  });

  return updated;
}

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  const versionParam = getRouterParam(event, "version");

  if (!(code && versionParam)) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const version = Number(versionParam);
  if (!Number.isInteger(version) || version <= 0) {
    throw createError({ statusCode: 400, statusMessage: "INVALID_VERSION" });
  }

  const rawBody = await readBody(event);
  const parsed = updateActivityFormSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const data = parsed.data;
  const db = getOwnerDb();

  const [existing] = await db
    .select()
    .from(activities)
    .where(
      and(eq(activities.code, code), eq(activities.contentVersion, version))
    )
    .limit(1);

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: "ACTIVITY_NOT_FOUND",
      message: `Activity ${code} version ${version} not found`,
    });
  }

  if (
    data.expected_version !== undefined &&
    data.expected_version !== existing.contentVersion
  ) {
    throw createError({
      statusCode: 409,
      statusMessage: "VERSION_CONFLICT",
      message: `Expected version ${data.expected_version} but found ${existing.contentVersion}`,
    });
  }

  const targetKind = data.kind || existing.kind;
  await validateActivityPatch(db, targetKind, data, existing.refId);

  if (existing.status === "published") {
    return await handlePublishedActivityFork(
      db,
      existing,
      targetKind,
      data,
      session.manager_id
    );
  }

  return await handleDraftActivityUpdate(
    db,
    existing,
    data,
    session.manager_id
  );
});
