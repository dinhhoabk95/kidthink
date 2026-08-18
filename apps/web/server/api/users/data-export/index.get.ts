import { childProfiles, consentLogs, getOwnerDb, users } from "@mindkid/db";
import { eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  setHeader,
  setResponseStatus,
} from "h3";

import { requireWebUserSession } from "../../../utils/auth-runtime.js";
import { requireReauth } from "../../../utils/reauth-runtime.js";

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  // Require reauth (≤ 5 min)
  requireReauth(event);

  const db = getOwnerDb();
  const [userRows, children, consents] = await Promise.all([
    db
      .select({
        id: users.id,
        uuid: users.uuid,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        uuid: childProfiles.uuid,
        displayName: childProfiles.displayName,
        birthYear: childProfiles.birthYear,
        avatarId: childProfiles.avatarId,
        status: childProfiles.status,
        createdAt: childProfiles.createdAt,
      })
      .from(childProfiles)
      .where(eq(childProfiles.userId, userId)),
    db
      .select({
        consentType: consentLogs.consentType,
        action: consentLogs.action,
        createdAt: consentLogs.createdAt,
      })
      .from(consentLogs)
      .where(eq(consentLogs.userId, userId)),
  ]);
  const user = userRows[0];

  if (!user) {
    setResponseStatus(event, 404);
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  setHeader(event, "Content-Type", "application/json");
  setHeader(
    event,
    "Content-Disposition",
    'attachment; filename="mindkid-data-export.json"'
  );

  return {
    exported_at: new Date().toISOString(),
    user: {
      uuid: user.uuid,
      email: user.email,
      display_name: user.displayName,
      status: user.status,
      created_at: user.createdAt.toISOString(),
    },
    child_profiles: children.map((c) => ({
      uuid: c.uuid,
      display_name: c.displayName,
      birth_year: c.birthYear,
      avatar_id: c.avatarId,
      status: c.status,
      created_at: c.createdAt.toISOString(),
    })),
    consents: consents.map((cs) => ({
      consent_type: cs.consentType,
      action: cs.action,
      created_at: cs.createdAt.toISOString(),
    })),
  };
});
