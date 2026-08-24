import { getOwnerDb, mfaRecoveryCodes, mfaSettings } from "@mindkid/db";
import { and, eq, isNull } from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const session = requireWebUserSession(event);
  const userId = session.user_id;

  const db = getOwnerDb();
  const [setting] = await db
    .select({
      id: mfaSettings.id,
      confirmedAt: mfaSettings.confirmedAt,
    })
    .from(mfaSettings)
    .where(
      and(
        eq(mfaSettings.accountType, "user"),
        eq(mfaSettings.accountId, userId)
      )
    );

  let recoveryCodesRemaining = 0;
  const isEnabled = Boolean(setting?.confirmedAt);

  if (isEnabled) {
    const unusedCodes = await db
      .select({ id: mfaRecoveryCodes.id })
      .from(mfaRecoveryCodes)
      .where(
        and(
          eq(mfaRecoveryCodes.accountType, "user"),
          eq(mfaRecoveryCodes.accountId, userId),
          isNull(mfaRecoveryCodes.usedAt)
        )
      );
    recoveryCodesRemaining = unusedCodes.length;
  }

  return {
    enabled: isEnabled,
    confirmed_at: setting?.confirmedAt
      ? setting.confirmedAt.toISOString()
      : null,
    recovery_codes_remaining: recoveryCodesRemaining,
  };
});
