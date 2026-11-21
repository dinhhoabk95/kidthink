import {
  auditLogs,
  getOwnerDb,
  userAccounts,
  userPasskeys,
  users,
} from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { LastLoginMethodError } from "@mindkid/errors/social";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { count, eq } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

const ALLOWED_PROVIDERS = new Set(["google", "facebook"]);

export default defineEventHandler(async (event) => {
  const userSession = requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  requireReauth(event);

  const rawProvider = getRouterParam(event, "provider") || "";
  if (!ALLOWED_PROVIDERS.has(rawProvider)) {
    throw new NotFoundError("Không tìm thấy nhà cung cấp.");
  }

  const db = getOwnerDb();
  const remoteIp = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") || "unknown";

  const result = await db.transaction(async (tx) => {
    const [user] = await tx
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");

    if (!user) {
      throw new NotFoundError();
    }

    const accounts = await tx
      .select()
      .from(userAccounts)
      .where(eq(userAccounts.userId, userId));

    const [pkRow] = await tx
      .select({ cnt: count(userPasskeys.id) })
      .from(userPasskeys)
      .where(eq(userPasskeys.userId, userId));

    const targetAccount = accounts.find((a) => a.providerId === rawProvider);
    if (!targetAccount) {
      throw new NotFoundError("Tài khoản chưa liên kết với nhà cung cấp này.");
    }

    const hasCredentialRow = accounts.some(
      (a) => a.providerId === "credential" && Boolean(a.password)
    );
    const hasLegacyPassword = !hasCredentialRow && Boolean(user.passwordHash);
    const remainingAccounts = accounts.filter(
      (a) => a.id !== targetAccount.id
    ).length;
    const loginMethodsLeft =
      remainingAccounts + (hasLegacyPassword ? 1 : 0) + Number(pkRow?.cnt ?? 0);

    if (loginMethodsLeft < 1) {
      throw new LastLoginMethodError(
        "Không thể gỡ phương thức đăng nhập cuối cùng. Vui lòng đặt mật khẩu trước khi gỡ."
      );
    }

    await tx.delete(userAccounts).where(eq(userAccounts.id, targetAccount.id));

    await tx.insert(auditLogs).values({
      actorType: "user",
      actorId: userId,
      action: "social_identity.unlinked",
      entityType: "social_identity",
      entityId: String(targetAccount.id),
      afterData: { provider: rawProvider },
      ipAddress: remoteIp,
      userAgent,
    });

    return { loginMethodsLeft, email: user.email };
  });

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: userId,
    code: "social_identity_unlinked",
    to: result.email,
    payload: {
      provider: rawProvider,
    },
  });

  return {
    ok: true,
    login_methods_left: result.loginMethodsLeft,
  };
});
