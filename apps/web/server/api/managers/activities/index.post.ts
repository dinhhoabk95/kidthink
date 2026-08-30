import {
  activities,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  isEnabled as isFeatureEnabled,
  writeAudit,
} from "@mindkid/db";
import { activityFormSchema, resolveActivityRefType } from "@mindkid/shared";
import { eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { throwValidationError } from "#server/utils/api-error";

function generateActivityCode(existingCount: number): string {
  const numStr = String(existingCount + 1).padStart(4, "0");
  return `ACT-${numStr}`;
}

async function validateActivityCreation(
  db: ReturnType<typeof getOwnerDb>,
  data: { kind: string; ref_id?: number | null }
) {
  if (data.kind === "worksheet") {
    const isWorksheetEnabled = await isFeatureEnabled("worksheet_activity");
    if (!isWorksheetEnabled) {
      throw createError({
        statusCode: 422,
        statusMessage: "WORKSHEET_ACTIVITY_DISABLED",
        message: "Tính năng hoạt động worksheet hiện đang bị khoá ở MVP (D-LN)",
      });
    }
  }

  if (data.kind === "digital_game" && data.ref_id) {
    const [level] = await db
      .select({ id: gameLevels.id, status: gameLevels.status })
      .from(gameLevels)
      .where(eq(gameLevels.id, data.ref_id))
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

export default defineEventHandler(async (event) => {
  const session = await requireManagerSession(event);
  const rawBody = await readBody(event);

  const parsed = activityFormSchema.safeParse(rawBody);
  if (!parsed.success) {
    throwValidationError(parsed.error);
  }

  const data = parsed.data;
  const db = getOwnerDb();
  await validateActivityCreation(db, data);

  const code = data.code || generateActivityCode(Date.now() % 9000);
  const entityId = Date.now();
  const refType = resolveActivityRefType(data.kind);
  const refId = data.kind === "digital_game" ? data.ref_id : null;

  const [created] = await db
    .insert(activities)
    .values({
      entityId,
      code,
      contentVersion: 1,
      kind: data.kind,
      title: data.title,
      instruction: data.instruction,
      materials: data.materials || null,
      estimatedMinutes: data.estimated_minutes,
      refType,
      refId,
      accessTier: data.access_tier,
      status: "draft",
      origin: "human",
      authoredIn: "studio",
      createdByManagerId: session.manager_id,
    })
    .returning();

  if (!created) {
    throw createError({
      statusCode: 500,
      statusMessage: "ACTIVITY_CREATE_FAILED",
    });
  }

  if (data.skill_ids && data.skill_ids.length > 0) {
    const weightPerSkill = (1.0 / data.skill_ids.length).toFixed(2);
    await db
      .insert(contentSkillMap)
      .values(
        data.skill_ids.map((skillId) => ({
          entityType: "activity" as const,
          entityId,
          skillId,
          weight: weightPerSkill,
        }))
      )
      .onConflictDoNothing();
  }

  await db.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: session.manager_id,
      action: "content_created",
      entity_type: "activity",
      entity_id: String(created.id),
      after_data: created as unknown as Record<string, unknown>,
      reason: "Manager created activity via Studio",
    });
  });

  setResponseStatus(event, 201);
  return created;
});
