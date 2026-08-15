import {
  type ContentLifecycleStatus,
  type ManagerRole,
  transitionContentStatus,
} from "@kidthink/db";
import { createError, defineEventHandler, getRouterParam, readBody } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../../utils/admin-auth-runtime.js";

const VALID_TYPES = [
  "game_level",
  "lesson",
  "activity",
  "curriculum",
  "worksheet",
];

const REQUIRED_CHECKLIST_GROUPS = [
  "pedagogy",
  "content",
  "language",
  "imagery",
  "safety",
  "technical",
];

function validateChecklist(checklist?: Record<string, boolean>): void {
  if (!checklist || typeof checklist !== "object") {
    throw createError({
      statusCode: 422,
      statusMessage: "CHECKLIST_REQUIRED",
      message:
        "Duyệt nội dung bắt buộc hoàn thành 6 nhóm checklist duyệt (BR-CRQ-07)",
    });
  }
  for (const grp of REQUIRED_CHECKLIST_GROUPS) {
    if (!checklist[grp]) {
      throw createError({
        statusCode: 422,
        statusMessage: "CHECKLIST_INCOMPLETE",
        message: `Checklist duyệt thiếu nhóm bắt buộc '${grp}' (BR-CRQ-07)`,
      });
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
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

    const body =
      (event.context?.body as Record<string, unknown>) ||
      ((event as Record<string, unknown>)._body as Record<string, unknown>) ||
      (await readBody(event).catch(() => ({})));
    const toStatus = body?.to_status as ContentLifecycleStatus;
    const reason = typeof body?.reason === "string" ? body.reason : undefined;
    const expectedVersion =
      typeof body?.expected_version === "number"
        ? body.expected_version
        : undefined;
    const checklist = body?.checklist as Record<string, boolean> | undefined;

    // BR-CRQ-07: When transitioning in_review -> approved, verify 6-group checklist
    if (toStatus === "approved") {
      validateChecklist(checklist);
    }

    const managerRole = (manager.role || "content_reviewer") as ManagerRole;
    const managerId = manager.manager_id || manager.id || 1;

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
  } catch (err) {
    const errorObj = err as {
      statusCode?: number;
      code?: string;
      message?: string;
      details?: unknown;
    };
    if (errorObj?.statusCode && errorObj?.code) {
      throw createError({
        statusCode: errorObj.statusCode,
        statusMessage: errorObj.code,
        message: errorObj.message,
        data: errorObj.details,
      });
    }
    return respondToManagerAuthError(event, err);
  }
});
