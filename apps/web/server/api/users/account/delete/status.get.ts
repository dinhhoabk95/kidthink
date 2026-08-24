import { getOwnerDb, users } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { createError, defineEventHandler, setResponseStatus } from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
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
});
