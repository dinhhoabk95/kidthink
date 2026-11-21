import {
  getOwnerDb,
  userAccounts,
  users,
  userTwoFactors,
  userVerifications,
} from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { and, desc, eq, gt, like } from "drizzle-orm";
import { defineApiRoute } from "#server/utils/define-api-route";

interface PendingEmailPayload {
  userId?: number;
  newEmail?: string;
}

function parsePendingEmailForUser(
  rawValue: string,
  targetUserId: number
): string | null {
  try {
    const parsed = JSON.parse(rawValue) as PendingEmailPayload;
    if (
      parsed.userId === targetUserId &&
      typeof parsed.newEmail === "string" &&
      parsed.newEmail.length > 0
    ) {
      return parsed.newEmail;
    }
  } catch {
    return null;
  }
  return null;
}

export default defineApiRoute({
  auth: "user",
  handler: async ({ auth }) => {
    const userId = Number(auth.user_id);
    const db = getOwnerDb();

    const [userRow] = await db
      .select({
        uuid: users.uuid,
        email: users.email,
        displayName: users.displayName,
        status: users.status,
        emailVerified: users.emailVerified,
        twoFactorEnabled: users.twoFactorEnabled,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRow) {
      throw new NotFoundError("NOT_FOUND");
    }

    const [credRow] = await db
      .select({ password: userAccounts.password })
      .from(userAccounts)
      .where(
        and(
          eq(userAccounts.userId, userId),
          eq(userAccounts.providerId, "credential")
        )
      )
      .limit(1);

    const [twoFactorRow] = await db
      .select({
        verified: userTwoFactors.verified,
        updatedAt: userTwoFactors.updatedAt,
      })
      .from(userTwoFactors)
      .where(eq(userTwoFactors.userId, userId))
      .limit(1);

    const verificationRows = await db
      .select({ value: userVerifications.value })
      .from(userVerifications)
      .where(
        and(
          like(userVerifications.identifier, "email_change:%"),
          gt(userVerifications.expiresAt, new Date())
        )
      )
      .orderBy(desc(userVerifications.createdAt))
      .limit(10);

    let pendingEmail: string | null = null;
    for (const row of verificationRows) {
      const candidate = parsePendingEmailForUser(row.value, userId);
      if (candidate) {
        pendingEmail = candidate;
        break;
      }
    }

    const isTwoFactorEnabled = Boolean(
      userRow.twoFactorEnabled && (twoFactorRow?.verified ?? true)
    );

    return {
      uuid: userRow.uuid,
      email: userRow.email,
      display_name: userRow.displayName,
      status: userRow.status,
      email_verified: userRow.emailVerified,
      has_password: Boolean(credRow?.password || userRow.passwordHash),
      two_factor_enabled: isTwoFactorEnabled,
      two_factor_confirmed_at:
        isTwoFactorEnabled && twoFactorRow?.updatedAt
          ? twoFactorRow.updatedAt.toISOString()
          : null,
      pending_email: pendingEmail,
    };
  },
});
