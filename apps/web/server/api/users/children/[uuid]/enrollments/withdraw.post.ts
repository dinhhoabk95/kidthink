import { AppError } from "@kidthink/auth";
import {
  auditLogs,
  childProfiles,
  curricula,
  curriculumEnrollments,
  getOwnerDb,
} from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from "h3";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const uuid = getRouterParam(event, "uuid");
    if (!uuid) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    const userId = Number(user.user_id);
    const db = getOwnerDb();

    // 1. Verify child belongs to user (BR-CPC-09 / BR-ERR-05 -> 404)
    const [child] = await db
      .select()
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.uuid, uuid),
          eq(childProfiles.userId, userId),
          eq(childProfiles.status, "active")
        )
      );

    if (!child) {
      setResponseStatus(event, 404);
      throw createError({
        statusCode: 404,
        statusMessage: "NOT_FOUND",
        data: { code: "NOT_FOUND", message: "Không tìm thấy hồ sơ trẻ." },
      });
    }

    // 2. Find active enrollment
    const [activeEnrollment] = await db
      .select({
        id: curriculumEnrollments.id,
        curriculumId: curriculumEnrollments.curriculumId,
        code: curricula.code,
        contentVersion: curricula.contentVersion,
      })
      .from(curriculumEnrollments)
      .innerJoin(
        curricula,
        eq(curricula.id, curriculumEnrollments.curriculumId)
      )
      .where(
        and(
          eq(curriculumEnrollments.childId, child.id),
          eq(curriculumEnrollments.status, "active")
        )
      );

    if (!activeEnrollment) {
      setResponseStatus(event, 404);
      throw createError({
        statusCode: 404,
        statusMessage: "NOT_FOUND",
        data: {
          code: "NOT_FOUND",
          message: "Bé không có lộ trình học nào đang hoạt động.",
        },
      });
    }

    // 3. Mark enrollment as withdrawn (progress is retained)
    const [updated] = await db
      .update(curriculumEnrollments)
      .set({ status: "withdrawn" })
      .where(eq(curriculumEnrollments.id, activeEnrollment.id))
      .returning();

    // 4. Audit log
    await db.insert(auditLogs).values({
      actorType: "user",
      actorId: userId,
      action: "curriculum.withdrawn",
      entityType: "curriculum_enrollment",
      entityId: activeEnrollment.id,
      ipAddress: getVerifiedRemoteIp(event),
      metadata: {
        child_id: child.id,
        child_uuid: child.uuid,
        curriculum_code: activeEnrollment.code,
        curriculum_version: activeEnrollment.contentVersion,
      },
    });

    return {
      status: updated.status,
      enrollment_id: updated.id,
    };
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number };
    if (errorObj?.statusCode) {
      setResponseStatus(event, errorObj.statusCode);
      throw err;
    }
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: { code: err.code, message: err.message },
      });
    }
    return respondToUserAuthError(event, err);
  }
});
