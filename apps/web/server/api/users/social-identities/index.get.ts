import { getOwnerDb, userAccounts } from "@mindkid/db";
import { and, eq, inArray } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export function maskEmail(email: string | null | undefined): string | null {
  if (!email) {
    return null;
  }
  const [local, domain] = email.split("@");
  if (!(local && domain)) {
    return null;
  }
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}***@${domain}`;
}

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  const db = getOwnerDb();
  const rows = await db
    .select({
      providerId: userAccounts.providerId,
      emailAtProvider: userAccounts.emailAtProvider,
      createdAt: userAccounts.createdAt,
    })
    .from(userAccounts)
    .where(
      and(
        eq(userAccounts.userId, userId),
        inArray(userAccounts.providerId, ["google", "facebook"])
      )
    );

  const items = rows.map((row) => ({
    provider: row.providerId,
    masked_email: maskEmail(row.emailAtProvider),
    linked_at: row.createdAt.toISOString(),
  }));

  return { items };
});
