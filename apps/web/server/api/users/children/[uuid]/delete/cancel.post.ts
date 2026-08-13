import { AppError } from "@kidthink/auth";
import { childProfiles, getOwnerDb } from "@kidthink/db";
import { and, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  setResponseStatus,
} from "h3";
import {
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

    // Ownership check (BR-CPC-09)
    const [child] = await db
      .select()
      .from(childProfiles)
      .where(
        and(eq(childProfiles.uuid, uuid), eq(childProfiles.userId, userId))
      );

    if (!child) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    if (child.status !== "pending_deletion") {
      setResponseStatus(event, 400);
      throw createError({
        statusCode: 400,
        statusMessage: "INVALID_STATUS",
        data: {
          code: "INVALID_STATUS",
          message: "Hồ sơ không ở trạng thái chờ xoá.",
        },
      });
    }

    // BR-CPR-03: Cancelling deletion within 30 days restores profile to archived
    const [updated] = await db
      .update(childProfiles)
      .set({
        status: "archived",
        purgeAt: null,
        updatedAt: new Date(),
      })
      .where(eq(childProfiles.id, child.id))
      .returning();

    return {
      uuid: updated.uuid,
      status: updated.status,
    };
  } catch (err) {
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
