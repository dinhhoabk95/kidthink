import crypto from "node:crypto";
import { writeAudit } from "@mindkid/audit";
import {
  getAuthRedisClient,
  getDummyPasswordHash,
  MfaAttemptGuard,
  verifyBetterAuthTotp,
  verifyPassword,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  ACTOR_TYPE,
  CHILD_STATUS_CODEC,
  CONSENT_ACTION_CODEC,
  CONSENT_TYPE_CODEC,
  MFA_RECOVERY_STATUS,
  MFA_RECOVERY_STATUS_CODEC,
  USER_STATUS,
  USER_STATUS_CODEC,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import {
  AccountPurgedError,
  AccountSuspendedError,
  UserAlreadyDeletedError,
} from "@mindkid/errors/account";
import {
  InvalidCredentialsError,
  MfaLockedError,
  MfaRequiredError,
  RestrictedModeError,
  TokenExpiredError,
} from "@mindkid/errors/auth";
import {
  InternalError,
  NotFoundError,
  ValidationError,
} from "@mindkid/errors/common";
import { InvalidStatusTransitionError } from "@mindkid/errors/content";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { PACKAGE_CATALOG } from "@mindkid/shared";
import { revokeAllBetterAuthSessions } from "#server/utils/better-auth";
import { useOwnerRepositories } from "#server/utils/repositories";
import { revokeAllUserSessions } from "#server/utils/session-revocation";

export interface AccountDeleteSummaryResult {
  readonly child_profiles_count: number;
  readonly active_subscription_days: number;
  readonly grace_period_days: 30;
  readonly lost_data_items: readonly string[];
  readonly retained_legal_items: readonly string[];
}

export interface RequestAccountDeletionResult {
  readonly purge_at: string;
  readonly grace_period_days: 30;
  readonly message: string;
}

export interface AccountDeletionStatusResult {
  readonly status: string;
  readonly purge_at: string | null;
  readonly is_pending_deletion: boolean;
}

export interface UserDataExportResult {
  readonly exported_at: string;
  readonly user: {
    readonly uuid: string;
    readonly email: string;
    readonly display_name: string;
    readonly status: string;
    readonly created_at: string;
  };
  readonly child_profiles: ReadonlyArray<{
    readonly uuid: string;
    readonly display_name: string;
    readonly birth_year: number;
    readonly avatar_id: string;
    readonly status: string;
    readonly created_at: string;
  }>;
  readonly consents: ReadonlyArray<{
    readonly consent_type: string;
    readonly action: string;
    readonly created_at: string;
  }>;
}

export interface MfaRecoveryListItem {
  readonly uuid: string;
  readonly status: string;
  readonly reason: string;
  readonly email_verified_at: string | null;
  readonly eligible_at: string;
  readonly completed_at: string | null;
  readonly cancelled_at: string | null;
  readonly requested_at: string;
}

export interface CreateMfaRecoveryResult {
  readonly success: true;
  readonly request: {
    readonly uuid: string;
    readonly status: string;
    readonly eligible_at: string;
    readonly requested_at: string;
  };
  readonly verification_token?: string;
}

export async function getAccountDeletionSummary(
  userId: number
): Promise<AccountDeleteSummaryResult> {
  const repos = useOwnerRepositories();
  const now = new Date();
  const [childCount, activePackages] = await Promise.all([
    repos.childProfiles.countActiveByUser(userId),
    repos.entitlements.listActiveForUser(userId, now),
  ]);

  let maxDaysRemaining = 0;
  for (const pkg of activePackages) {
    if (!pkg.expiresAt) {
      maxDaysRemaining = 365;
      break;
    }
    const days = Math.ceil(
      (pkg.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (days > maxDaysRemaining) {
      maxDaysRemaining = days;
    }
  }

  return {
    child_profiles_count: Number(childCount),
    active_subscription_days: maxDaysRemaining,
    grace_period_days: 30,
    lost_data_items: [
      `${childCount} hồ sơ bé và toàn bộ tiến độ học tập, huy hiệu`,
      "Lịch sử các phiên chơi tương tác và báo cáo phân tích",
      `Quyền truy cập gói học còn lại (${maxDaysRemaining > 0 ? `${maxDaysRemaining} ngày` : "không có gói đang hoạt động"})`,
    ],
    retained_legal_items: [
      "Lịch sử giao dịch thanh toán (theo Luật Kế toán và thuế, thông tin cá nhân được ẩn danh)",
      "Bản ghi đồng ý pháp lý (theo Nghị định 13/2023/NĐ-CP, không chứa thông tin của trẻ)",
      "Nhật ký kiểm toán hệ thống (theo Luật An ninh mạng)",
    ],
  };
}

export async function requestAccountDeletion(input: {
  readonly userId: number;
  readonly ipAddress: string;
  readonly userAgent: string | null;
}): Promise<RequestAccountDeletionResult> {
  const repos = useOwnerRepositories();
  const currentUser = await repos.users.findById(input.userId);

  if (!currentUser) {
    throw new NotFoundError("NOT_FOUND");
  }
  if (currentUser.status === USER_STATUS.DELETED) {
    throw new UserAlreadyDeletedError("Tài khoản đã trong trạng thái chờ xoá.");
  }

  const now = new Date();
  const { scheduledPurgeAt } = await repos.users.requestDeletion(
    input.userId,
    now
  );

  await repos.auditLogs.transaction(async (tx) => {
    await writeAudit(tx, {
      actor_type: "user",
      actor_id: input.userId,
      action: "user_deleted",
      entity_type: "user",
      entity_id: String(input.userId),
      before_data: { status: USER_STATUS_CODEC.toLabel(currentUser.status) },
      after_data: {
        status: "deleted",
        purge_at: scheduledPurgeAt.toISOString(),
      },
      reason: "Người dùng yêu cầu xoá tài khoản",
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });
  });

  await revokeAllUserSessions(input.userId);

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: input.userId,
    code: "account_deletion_confirmation",
    to: currentUser.email,
    payload: {
      purge_at: scheduledPurgeAt.toISOString(),
      grace_period_days: 30,
      cancel_url: "/me/settings/delete/cancel",
    },
  });

  return {
    purge_at: scheduledPurgeAt.toISOString(),
    grace_period_days: 30,
    message:
      "Yêu cầu xoá tài khoản đã được ghi nhận. Toàn bộ phiên đăng nhập đã được thu hồi. Bạn có 30 ngày để huỷ yêu cầu này.",
  };
}

async function resolveMaxActiveChildrenForUser(
  userId: number,
  now: Date
): Promise<number> {
  const repos = useOwnerRepositories();
  const activeEntitlements = await repos.entitlements.listActiveForUser(
    userId,
    now
  );
  const activeKeys = new Set(
    activeEntitlements.map((row) => row.entitlementKey)
  );
  let maxActiveChildren = 1;

  for (const pkg of Object.values(PACKAGE_CATALOG)) {
    const childQuota = pkg.quotas.child_profiles;
    if (!childQuota) {
      continue;
    }
    const hasAllEntitlements = pkg.entitlements.every((key) =>
      activeKeys.has(key)
    );
    if (hasAllEntitlements) {
      maxActiveChildren = Math.max(maxActiveChildren, childQuota);
    }
  }

  if (activeKeys.has("play_premium_games")) {
    maxActiveChildren = Math.max(
      maxActiveChildren,
      PACKAGE_CATALOG["PKG-premium"]?.quotas.child_profiles ?? 5
    );
  } else if (activeKeys.has("play_standard_games")) {
    maxActiveChildren = Math.max(
      maxActiveChildren,
      PACKAGE_CATALOG["PKG-standard"]?.quotas.child_profiles ?? 3
    );
  }

  return maxActiveChildren;
}

export async function verifyCancelDeletionCredentials(
  email: string,
  password: string | undefined,
  totp?: string
): Promise<number> {
  if (!password) {
    throw new InvalidCredentialsError();
  }
  const repos = useOwnerRepositories();
  const now = new Date();
  const foundUser = await repos.users.findForAuthByEmail(
    email.trim().toLowerCase()
  );

  const isEligibleForCancel =
    foundUser !== null &&
    foundUser.status === USER_STATUS.DELETED &&
    foundUser.purgeAt !== null &&
    foundUser.purgeAt.getTime() > now.getTime();

  if (!isEligibleForCancel) {
    await verifyPassword(password, getDummyPasswordHash()).catch(() => false);
    throw new InvalidCredentialsError();
  }

  let storedHash = foundUser.passwordHash ?? null;
  if (!storedHash) {
    const cred = await repos.authAccounts.findUserCredentialAccountForAuth(
      foundUser.id
    );
    storedHash = cred?.password ?? null;
  }

  if (!storedHash) {
    await verifyPassword(password, getDummyPasswordHash()).catch(() => false);
    throw new InvalidCredentialsError();
  }

  const isValid = await verifyPassword(password, storedHash);
  if (!isValid) {
    throw new InvalidCredentialsError();
  }

  if (foundUser.twoFactorEnabled) {
    const attemptGuard = new MfaAttemptGuard(getAuthRedisClient());
    await attemptGuard.assertNotLocked("user", foundUser.id, now);

    const mfa = await repos.authAccounts.findUserTwoFactorForAuth(foundUser.id);
    if (!(mfa?.secret && mfa.verified !== false && totp)) {
      throw new InvalidCredentialsError();
    }

    const ok = await verifyBetterAuthTotp({
      storedSecret: mfa.secret,
      rootSecret: requireEnv("NUXT_SESSION_PASSWORD"),
      namespace: "user",
      code: totp,
      nowMs: now.getTime(),
    });
    if (!ok) {
      const failure = await attemptGuard.recordFailure(
        "user",
        foundUser.id,
        now
      );
      if (failure.locked) {
        throw new MfaLockedError();
      }
      throw new InvalidCredentialsError();
    }
    await attemptGuard.reset("user", foundUser.id);
  }

  return foundUser.id;
}

export async function cancelAccountDeletion(targetUserId: number): Promise<{
  readonly status: "active" | "pending_verification";
  readonly message: string;
}> {
  const repos = useOwnerRepositories();
  const account = await repos.users.findById(targetUserId);

  if (!account) {
    throw new NotFoundError("NOT_FOUND");
  }
  if (account.status === USER_STATUS.SUSPENDED) {
    throw new AccountSuspendedError();
  }
  if (account.status !== USER_STATUS.DELETED) {
    throw new InvalidStatusTransitionError(
      "Tài khoản không ở trạng thái chờ xoá."
    );
  }

  const now = new Date();
  if (!account.purgeAt || account.purgeAt.getTime() <= now.getTime()) {
    throw new AccountPurgedError();
  }

  const maxActiveChildren = await resolveMaxActiveChildrenForUser(
    targetUserId,
    now
  );
  const restored = await repos.users.cancelDeletion(
    targetUserId,
    now,
    maxActiveChildren
  );
  if (!restored) {
    throw new InvalidStatusTransitionError(
      "Tài khoản không ở trạng thái chờ xoá."
    );
  }

  return {
    status:
      restored.status === USER_STATUS.ACTIVE
        ? "active"
        : "pending_verification",
    message:
      "Đã huỷ yêu cầu xoá tài khoản thành công. Tài khoản của bạn đã được kích hoạt lại.",
  };
}

export async function getAccountDeletionStatus(
  userId: number
): Promise<AccountDeletionStatusResult> {
  const repos = useOwnerRepositories();
  const account = await repos.users.findById(userId);
  if (!account) {
    throw new NotFoundError("NOT_FOUND");
  }

  return {
    status: USER_STATUS_CODEC.toLabel(account.status),
    purge_at: account.purgeAt ? account.purgeAt.toISOString() : null,
    is_pending_deletion: account.status === USER_STATUS.DELETED,
  };
}

export async function exportUserPersonalData(
  userId: number
): Promise<UserDataExportResult> {
  const repos = useOwnerRepositories();
  const [user, children, consents] = await Promise.all([
    repos.users.findById(userId),
    repos.childProfiles.listAllByUser(userId),
    repos.consents.listByUser(userId),
  ]);

  if (!user) {
    throw new NotFoundError("NOT_FOUND");
  }

  return {
    exported_at: new Date().toISOString(),
    user: {
      uuid: user.uuid,
      email: user.email,
      display_name: user.displayName,
      status: USER_STATUS_CODEC.toLabel(user.status),
      created_at: user.createdAt.toISOString(),
    },
    child_profiles: children.map((c) => ({
      uuid: c.uuid,
      display_name: c.displayName,
      birth_year: c.birthYear,
      avatar_id: c.avatarId,
      status: CHILD_STATUS_CODEC.toLabel(c.status),
      created_at: c.createdAt.toISOString(),
    })),
    consents: consents.map((cs) => ({
      consent_type: CONSENT_TYPE_CODEC.toLabel(cs.consentType),
      action: CONSENT_ACTION_CODEC.toLabel(cs.action),
      created_at: cs.createdAt.toISOString(),
    })),
  };
}

export async function verifyMfaRecoveryToken(input: {
  readonly token: string;
  readonly ipAddress: string;
  readonly userAgent: string;
}): Promise<{ readonly success: true; readonly message: string }> {
  const tokenHash = crypto
    .createHash("sha256")
    .update(input.token)
    .digest("hex");
  const repos = useOwnerRepositories();
  const now = new Date();

  const matchingReq = await repos.mfaRecovery.findByTokenHash(tokenHash);
  if (matchingReq?.status !== MFA_RECOVERY_STATUS.PENDING_VERIFICATION) {
    throw new TokenExpiredError("Mã xác thực không hợp lệ hoặc đã hết hạn");
  }
  if (
    !matchingReq.verificationTokenExpiresAt ||
    matchingReq.verificationTokenExpiresAt.getTime() <= now.getTime()
  ) {
    throw new TokenExpiredError("Mã xác thực không hợp lệ hoặc đã hết hạn");
  }

  await repos.mfaRecovery.markEmailVerified(matchingReq.id, now);
  await repos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.USER,
    actorId: matchingReq.userId,
    action: "mfa.recovery_email_verified",
    entityType: "user",
    entityId: String(matchingReq.userId),
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    message:
      "Email đã được xác thực thành công. Yêu cầu khôi phục MFA sẽ sẵn sàng xử lý sau 48 giờ kể từ lúc tạo.",
  };
}

export async function listUserMfaRecoveryRequests(
  userUuid: string
): Promise<{ readonly requests: readonly MfaRecoveryListItem[] }> {
  const repos = useOwnerRepositories();
  const targetUser = await repos.users.findByUuid(userUuid);
  if (!targetUser) {
    throw new NotFoundError();
  }

  const requests = await repos.mfaRecovery.listByUser(targetUser.id);
  return {
    requests: requests.map((r) => ({
      uuid: r.uuid,
      status: MFA_RECOVERY_STATUS_CODEC.toLabel(r.status),
      reason: r.reason,
      email_verified_at: r.emailVerifiedAt?.toISOString() || null,
      eligible_at: r.eligibleAt.toISOString(),
      completed_at: r.completedAt?.toISOString() || null,
      cancelled_at: r.cancelledAt?.toISOString() || null,
      requested_at: r.createdAt.toISOString(),
    })),
  };
}

export async function createUserMfaRecoveryRequest(input: {
  readonly userUuid: string;
  readonly managerId: number;
  readonly reason: string;
  readonly ipAddress: string;
  readonly userAgent: string;
}): Promise<CreateMfaRecoveryResult> {
  const repos = useOwnerRepositories();
  const targetUser = await repos.users.findByUuid(input.userUuid);
  if (!targetUser) {
    throw new NotFoundError();
  }
  if (targetUser.status === USER_STATUS.DELETED) {
    throw new UserAlreadyDeletedError();
  }

  const [mfa, existingRequests] = await Promise.all([
    repos.authAccounts.findUserTwoFactor(targetUser.id),
    repos.mfaRecovery.listByUser(targetUser.id),
  ]);

  if (!(targetUser.twoFactorEnabled || mfa)) {
    throw new MfaRequiredError(
      "Tài khoản người dùng này chưa bật xác thực hai lớp"
    );
  }

  const activeReq = existingRequests.find(
    (r) =>
      r.status === MFA_RECOVERY_STATUS.PENDING_VERIFICATION ||
      r.status === MFA_RECOVERY_STATUS.WAITING
  );
  if (activeReq) {
    throw new ValidationError(
      "Đang có một yêu cầu khôi phục MFA đang chờ xử lý"
    );
  }

  const now = new Date();
  const eligibleAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const tokenExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const createdRequest = await repos.mfaRecovery.createRequest({
    userId: targetUser.id,
    status: MFA_RECOVERY_STATUS.PENDING_VERIFICATION,
    requestedByManagerId: input.managerId,
    reason: input.reason,
    verificationTokenHash: tokenHash,
    verificationTokenExpiresAt: tokenExpiresAt,
    eligibleAt,
    createdAt: now,
  });

  if (!createdRequest) {
    throw new InternalError("Tạo yêu cầu khôi phục thất bại");
  }

  await repos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.MANAGER,
    actorId: input.managerId,
    action: "mfa.recovery_requested",
    entityType: "user",
    entityId: targetUser.uuid,
    reason: input.reason,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    request: {
      uuid: createdRequest.uuid,
      status: MFA_RECOVERY_STATUS_CODEC.toLabel(createdRequest.status),
      eligible_at: createdRequest.eligibleAt.toISOString(),
      requested_at: createdRequest.createdAt.toISOString(),
    },
    ...(process.env.NODE_ENV === "test"
      ? { verification_token: rawToken }
      : {}),
  };
}

export async function cancelUserMfaRecoveryRequest(input: {
  readonly userUuid: string;
  readonly reqUuid: string;
  readonly managerId: number;
  readonly ipAddress: string;
  readonly userAgent: string;
}): Promise<{ readonly success: true; readonly status: "cancelled" }> {
  const repos = useOwnerRepositories();
  const targetUser = await repos.users.findByUuid(input.userUuid);
  if (!targetUser) {
    throw new NotFoundError();
  }

  const recoveryReq = await repos.mfaRecovery.findByUuidForUser(
    input.reqUuid,
    targetUser.id
  );
  if (!recoveryReq) {
    throw new NotFoundError();
  }
  if (
    recoveryReq.status !== MFA_RECOVERY_STATUS.PENDING_VERIFICATION &&
    recoveryReq.status !== MFA_RECOVERY_STATUS.WAITING
  ) {
    throw new InvalidStatusTransitionError(
      "Yêu cầu khôi phục đã hoàn tất hoặc đã bị huỷ"
    );
  }

  const now = new Date();
  await repos.mfaRecovery.markCancelled(recoveryReq.id, now);
  await repos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.MANAGER,
    actorId: input.managerId,
    action: "mfa.recovery_cancelled",
    entityType: "user",
    entityId: targetUser.uuid,
    reason: recoveryReq.reason,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    status: "cancelled",
  };
}

export async function completeUserMfaRecoveryRequest(input: {
  readonly userUuid: string;
  readonly reqUuid: string;
  readonly managerId: number;
  readonly ipAddress: string;
  readonly userAgent: string;
}): Promise<{ readonly success: true; readonly status: "completed" }> {
  const repos = useOwnerRepositories();
  const targetUser = await repos.users.findByUuid(input.userUuid);
  if (!targetUser) {
    throw new NotFoundError();
  }

  const recoveryReq = await repos.mfaRecovery.findByUuidForUser(
    input.reqUuid,
    targetUser.id
  );
  if (!recoveryReq) {
    throw new NotFoundError();
  }
  if (recoveryReq.status === MFA_RECOVERY_STATUS.PENDING_VERIFICATION) {
    throw new RestrictedModeError(
      "Người dùng chưa xác thực email cho yêu cầu khôi phục này"
    );
  }
  if (recoveryReq.status !== MFA_RECOVERY_STATUS.WAITING) {
    throw new InvalidStatusTransitionError(
      "Yêu cầu khôi phục đã hoàn tất hoặc đã bị huỷ"
    );
  }

  const now = new Date();
  if (now.getTime() < recoveryReq.eligibleAt.getTime()) {
    throw new ValidationError("Chưa đủ 48 giờ chờ kể từ thời điểm tạo yêu cầu");
  }

  await repos.mfaRecovery.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    await txRepos.users.disableTwoFactorAndBumpSession(targetUser.id, now);
    await txRepos.mfaRecovery.markCompleted(
      recoveryReq.id,
      input.managerId,
      now
    );
    await txRepos.auditLogs.insertLog({
      actorType: ACTOR_TYPE.MANAGER,
      actorId: input.managerId,
      action: "mfa.recovery_completed",
      entityType: "user",
      entityId: targetUser.uuid,
      reason: recoveryReq.reason,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
    await revokeAllBetterAuthSessions("user", targetUser.id, {
      tx,
      incrementSessionVersion: false,
    });
  });

  return {
    success: true,
    status: "completed",
  };
}

export async function resetManagerMfa(input: {
  readonly targetUuid: string;
  readonly actorManagerId: number;
  readonly ipAddress: string;
  readonly userAgent: string;
}): Promise<{ readonly success: true; readonly mfa_enabled: false }> {
  const repos = useOwnerRepositories();
  const target = await repos.managers.findByUuid(input.targetUuid);
  if (!target) {
    throw new NotFoundError();
  }
  if (target.id === input.actorManagerId) {
    throw new ValidationError(
      "Không thể tự đặt lại xác thực hai lớp của chính mình."
    );
  }
  if (!target.mfaEnabled) {
    throw new ValidationError(
      "Manager này chưa bật xác thực hai lớp, không có gì để đặt lại."
    );
  }

  await revokeAllBetterAuthSessions("manager", target.id);

  await repos.managers.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    await txRepos.managers.resetMfa(target.id);
    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: input.actorManagerId,
      action: "manager_mfa_reset",
      entity_type: "manager",
      entity_id: target.id.toString(),
      after_data: { target_manager_uuid: target.uuid },
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });
  });

  return { success: true, mfa_enabled: false };
}
