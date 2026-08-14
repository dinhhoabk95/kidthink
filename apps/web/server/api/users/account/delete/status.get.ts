import { AppError } from "@kidthink/auth";
import { getOwnerDb, users } from "@kidthink/db";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, setResponseStatus } from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const userSession = await requireWebUserSession(event);
    const userId = Number(userSession.user_id);

    const db = getOwnerDb();
    const [account] = await db
      .select({
        id: users.id,
        status: users.status,
        purgeAt: users.purgeAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!account) {
      setResponseStatus(event, 404);
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    return {
      status: account.status,
      purge_at: account.purgeAt ? account.purgeAt.toISOString() : null,
      is_pending_deletion: account.status === "deleted",
    };
  } catch (err: unknown) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: err.toResponse(),
      });
    }
    return respondToUserAuthError(event, err);
  }
});
