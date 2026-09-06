import { isOAuthProvider } from "@mindkid/auth";
import { auditLogs, getOwnerDb, socialIdentities, users } from "@mindkid/db";
import { NotFoundError } from "@mindkid/errors/common";
import { LastLoginMethodError } from "@mindkid/errors/social";
import { eq } from "drizzle-orm";
import { defineEventHandler, getHeader, getRouterParam } from "h3";
import {
  getVerifiedRemoteIp,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { requireReauth } from "#server/utils/reauth-runtime";

export default defineEventHandler(async (event) => {
  const userSession = await requireWebUserSession(event);
  const userId = Number(userSession.user_id);

  // BR-SLK-01: Reauth within 5 minutes is required for unlinking
  await requireReauth(event);

  const rawProvider = getRouterParam(event, "provider") || "";
  if (!isOAuthProvider(rawProvider)) {
    throw new NotFoundError("Không tìm thấy nhà cung cấp.");
  }

  const db = getOwnerDb();
  const remoteIp = getVerifiedRemoteIp(event);
  const userAgent = getHeader(event, "user-agent") || "unknown";

  // D-IM & BR-SLK-04: Lock users row inside transaction to prevent race conditions
  const result = await db.transaction(async (tx) => {
    // 1. Lock user row with FOR UPDATE
    const [user] = await tx
      .select({
        id: users.id,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");

    if (!user) {
      throw new NotFoundError();
    }

    // 2. Fetch current social identities for this user
    const userIdentities = await tx
      .select()
      .from(socialIdentities)
      .where(eq(socialIdentities.userId, userId));

    const targetIdentity = userIdentities.find(
      (si) => si.provider === rawProvider
    );
    if (!targetIdentity) {
      throw new NotFoundError("Tài khoản chưa liên kết với nhà cung cấp này.");
    }

    const hasPassword = Boolean(user.passwordHash);
    const remainingIdentitiesCount = userIdentities.length - 1;
    const loginMethodsLeft = (hasPassword ? 1 : 0) + remainingIdentitiesCount;

    // BR-SLK-04: NEVER remove the last login method
    if (loginMethodsLeft < 1) {
      throw new LastLoginMethodError(
        "Không thể gỡ phương thức đăng nhập cuối cùng. Vui lòng đặt mật khẩu trước khi gỡ."
      );
    }

    // BR-SLK-10: Hard delete identity
    await tx
      .delete(socialIdentities)
      .where(eq(socialIdentities.id, targetIdentity.id));

    // BR-SLK-05: Audit log (with provider, WITHOUT provider_user_id)
    await tx.insert(auditLogs).values({
      actorType: "user",
      actorId: userId,
      action: "social_identity.unlinked",
      entityType: "social_identity",
      entityId: String(targetIdentity.id),
      afterData: { provider: rawProvider },
      ipAddress: remoteIp,
      userAgent,
    });

    return { loginMethodsLeft };
  });

  return {
    ok: true,
    login_methods_left: result.loginMethodsLeft,
  };
});
