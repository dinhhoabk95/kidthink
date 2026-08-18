import { getOwnerDb, socialIdentities } from "@mindkid/db";
import { eq } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "../../../utils/auth-runtime.js";
import { maskEmail } from "../../guest/auth/oauth/[provider]/callback.get.js";

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const db = getOwnerDb();
  const rows = await db
    .select({
      provider: socialIdentities.provider,
      emailAtProvider: socialIdentities.emailAtProvider,
      linkedAt: socialIdentities.linkedAt,
    })
    .from(socialIdentities)
    .where(eq(socialIdentities.userId, userId));

  // BR-SLK-09: Return provider, masked_email, linked_at; NEVER return provider_user_id
  const items = rows.map((row) => ({
    provider: row.provider,
    masked_email: maskEmail(row.emailAtProvider),
    linked_at: row.linkedAt.toISOString(),
  }));

  return { items };
});
