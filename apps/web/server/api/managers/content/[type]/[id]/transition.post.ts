import {
  activities,
  type ContentLifecycleStatus,
  curricula,
  gameLevels,
  getOwnerDb,
  lessons,
  type ManagerRole,
  seoPages,
  transitionContentStatus,
} from "@mindkid/db";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";
import { verifyPreviewToken } from "#server/utils/preview-token";

const VALID_TYPES = [
  "game_level",
  "lesson",
  "activity",
  "curriculum",
  "worksheet",
  "seo_page",
];

const GAME_LEVEL_CHECKLIST_GROUPS = [
  "pedagogy",
  "content",
  "language",
  "imagery",
  "safety",
  "technical",
];

const LESSON_ACTIVITY_CHECKLIST_GROUPS = [
  "pedagogy",
  "child_language",
  "material_safety",
  "home_feasibility",
  "observational_assessment",
  "lifecycle_references",
];

function validateChecklist(
  entityType: string,
  checklist?: Record<string, boolean>
): void {
  if (!checklist || typeof checklist !== "object") {
    throw createError({
      statusCode: 422,
      statusMessage: "CHECKLIST_REQUIRED",
      message:
        "Duyệt nội dung bắt buộc hoàn thành 6 nhóm checklist duyệt (BR-CRQ-07)",
    });
  }
  const requiredGroups =
    entityType === "lesson" || entityType === "activity"
      ? LESSON_ACTIVITY_CHECKLIST_GROUPS
      : GAME_LEVEL_CHECKLIST_GROUPS;

  for (const grp of requiredGroups) {
    if (!checklist[grp]) {
      throw createError({
        statusCode: 422,
        statusMessage: "CHECKLIST_INCOMPLETE",
        message: `Checklist duyệt thiếu nhóm bắt buộc '${grp}' (BR-CRQ-07)`,
      });
    }
  }
}

async function resolveEntityVersion(
  entityType: string,
  entityId: number
): Promise<number> {
  const db = getOwnerDb();
  if (entityType === "game_level") {
    const [row] = await db
      .select({ version: gameLevels.contentVersion })
      .from(gameLevels)
      .where(eq(gameLevels.id, entityId));
    return row?.version ?? 1;
  }
  if (entityType === "lesson") {
    const [row] = await db
      .select({ version: lessons.contentVersion })
      .from(lessons)
      .where(eq(lessons.id, entityId));
    return row?.version ?? 1;
  }
  if (entityType === "activity") {
    const [row] = await db
      .select({ version: activities.contentVersion })
      .from(activities)
      .where(eq(activities.id, entityId));
    return row?.version ?? 1;
  }
  if (entityType === "seo_page") {
    const [row] = await db
      .select({ version: seoPages.contentVersion })
      .from(seoPages)
      .where(eq(seoPages.id, entityId));
    return row?.version ?? 1;
  }
  if (entityType === "curriculum") {
    const [row] = await db
      .select({ version: curricula.contentVersion })
      .from(curricula)
      .where(eq(curricula.id, entityId));
    return row?.version ?? 1;
  }
  return 1;
}

async function ensureApprovalRequirements(options: {
  checklist?: Record<string, boolean>;
  previewToken?: string;
  typeParam: string;
  id: number;
  expectedVersion?: number;
  managerId: number;
}): Promise<void> {
  validateChecklist(options.typeParam, options.checklist);

  const entityVersion =
    options.expectedVersion ??
    (await resolveEntityVersion(options.typeParam, options.id));

  const isPreviewValid = verifyPreviewToken(options.previewToken, {
    entityType: options.typeParam,
    id: options.id,
    version: entityVersion,
    managerId: options.managerId,
  });

  if (!isPreviewValid) {
    throw createError({
      statusCode: 422,
      statusMessage: "PREVIEW_TOKEN_REQUIRED",
      message:
        "Duyệt nội dung bắt buộc mở preview trước khi duyệt (BR-CRQ-02, D-KG)",
    });
  }
}

import { z } from "zod";

const transitionBodySchema = z.object({
  to_status: z.enum([
    "draft",
    "in_review",
    "approved",
    "published",
    "archived",
    "rejected",
  ]),
  reason: z.string().optional(),
  expected_version: z.number().int().positive().optional(),
  checklist: z.record(z.boolean()).optional(),
  preview_token: z.string().optional(),
});

async function parseTransitionBody(event: H3Event) {
  const raw =
    ((event.context as Record<string, unknown>)?.body as unknown) ||
    ((event as Record<string, unknown>)._body as unknown) ||
    (await readBody(event).catch(() => ({})));
  const parsed = transitionBodySchema.parse(raw);
  return {
    toStatus: parsed.to_status as ContentLifecycleStatus,
    reason: parsed.reason,
    expectedVersion: parsed.expected_version,
    checklist: parsed.checklist,
    previewToken: parsed.preview_token,
  };
}

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);
  const typeParam = getRouterParam(event, "type");
  const idParam = getRouterParam(event, "id");
  const id = Number(idParam);

  if (!(typeParam && VALID_TYPES.includes(typeParam) && id) || id <= 0) {
    throw createError({
      statusCode: 404,
      statusMessage: "ENTITY_NOT_FOUND",
      message: `Unknown content entity '${typeParam}' with id '${idParam}'`,
    });
  }

  const { toStatus, reason, expectedVersion, checklist, previewToken } =
    await parseTransitionBody(event);

  const managerRole = (manager.role || "content_reviewer") as ManagerRole;
  const managerId = manager.manager_id || manager.id || 1;

  // BR-CRQ-07 & D-KG: When transitioning in_review -> approved, verify checklist + preview_token
  if (toStatus === "approved") {
    await ensureApprovalRequirements({
      checklist,
      previewToken,
      typeParam,
      id,
      expectedVersion,
      managerId,
    });
  }

  const result = await transitionContentStatus({
    entityType: typeParam as
      | "game_level"
      | "lesson"
      | "activity"
      | "curriculum"
      | "worksheet",
    entityDbId: id,
    toStatus,
    actorManagerId: managerId,
    actorRole: managerRole,
    reason,
    expectedVersion,
  });

  return {
    success: true,
    status: result.status,
    content_version: result.contentVersion,
    review_log_id: result.reviewLogId,
  };
});
