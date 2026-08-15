import {
  activities,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  isEnabled as isFeatureEnabled,
  writeAudit,
} from "@kidthink/db";
import { activityFormSchema } from "@kidthink/shared";
import { eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  readBody,
  setResponseStatus,
} from "h3";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

function generateActivityCode(existingCount: number): string {
  const numStr = String(existingCount + 1).padStart(4, "0");
  return `ACT-${numStr}`;
}

function resolveRefType(kind: string): string | null {
  if (kind === "digital_game") {
    return "game_level";
  }
  if (kind === "worksheet") {
    return "worksheet";
  }
  return null;
}

async function validateActivityCreation(
  db: ReturnType<typeof getOwnerDb>,
  data: { kind: string; ref_id?: number }
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
    throw createError({
      statusCode: 422,
      statusMessage: "VALIDATION_FAILED",
      message: parsed.error.issues.map((i) => i.message).join("; "),
      data: parsed.error.issues,
    });
  }

  const data = parsed.data;
  const db = getOwnerDb();
  await validateActivityCreation(db, data);

  const code = data.code || generateActivityCode(Date.now() % 9000);
  const entityId = Date.now();
  const refType = resolveRefType(data.kind);
  const refId = data.kind === "digital_game" ? data.ref_id : null;

  const [created] = await db
    .insert(activities)
    .values({
      entityId,
      code,
      contentVersion: 1,
      kind: data.kind,
      titleVi: data.title_vi,
      instructionVi: data.instruction_vi,
      materialsVi: data.materials_vi || null,
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

  if (data.skill_ids && data.skill_ids.length > 0) {
    const weightPerSkill = (1.0 / data.skill_ids.length).toFixed(2);
    for (const skillId of data.skill_ids) {
      await db
        .insert(contentSkillMap)
        .values({
          entityType: "activity",
          entityId,
          skillId,
          weight: weightPerSkill,
        })
        .onConflictDoNothing();
    }
  }

  await writeAudit(db, {
    actorType: "manager",
    actorId: session.manager_id,
    action: "create",
    entityType: "activity",
    entityId: String(created.id),
    afterState: created,
    reason: "Manager created activity via Studio",
  });

  setResponseStatus(event, 201);
  return created;
});
