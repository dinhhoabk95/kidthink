import { writeAudit } from "@mindkid/audit";
import {
  getAuthRedisClient,
  MfaAttemptGuard,
  verifyBetterAuthTotp,
  verifyPassword,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  ACTOR_TYPE,
  CHILD_STATUS_CODEC,
  ENTITLEMENT_SOURCE_CODEC,
  ENTITLEMENT_STATUS,
  ENTITLEMENT_STATUS_CODEC,
  type EntitlementEntity,
  type ManagerEntity,
  PAYMENT_ORDER_STATUS_CODEC,
  type PaymentOrderStatusLabel,
  USER_STATUS,
  USER_STATUS_CODEC,
  type UserStatusLabel,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { UserAlreadyDeletedError } from "@mindkid/errors/account";
import { InvalidCredentialsError, MfaLockedError } from "@mindkid/errors/auth";
import { InternalError, NotFoundError } from "@mindkid/errors/common";
import { InvalidStatusTransitionError } from "@mindkid/errors/content";
import { projectChildForAdmin } from "@mindkid/shared";
import {
  getUserAuth,
  revokeAllBetterAuthSessions,
} from "#server/utils/better-auth";
import { useOwnerRepositories } from "#server/utils/repositories";

export interface ReauthManagerInput {
  readonly managerId: number;
  readonly password?: string;
  readonly totp?: string;
}

export interface ManagerUserEntitlementItem {
  readonly id: number;
  readonly key: string;
  readonly source: string;
  readonly status: string;
  readonly expires_at: string | null;
  readonly granted_at: string;
  readonly grant_reason: string | null;
  readonly granted_by: string;
}

export interface ManagerUserPaymentItem {
  readonly id: number;
  readonly uuid: string;
  readonly package_code: string;
  readonly offer_code: string;
  readonly amount_vnd: number;
  readonly status: PaymentOrderStatusLabel;
  readonly transfer_note: string | null;
  readonly bank_txn_ref: string | null;
  readonly created_at: string;
  readonly submitted_at: string | null;
  readonly reviewed_at: string | null;
  readonly admin_note: string | null;
}

export interface ManagerUserDetailResult {
  readonly account: {
    readonly id: number;
    readonly uuid: string;
    readonly email: string;
    readonly display_name: string;
    readonly status: UserStatusLabel;
    readonly email_verified: boolean;
    readonly email_verified_at: string | null;
    readonly mfa_enabled: boolean;
    readonly suspended_reason: string | null;
    readonly purge_at: string | null;
    readonly active_session_count: number;
    readonly created_at: string;
    readonly last_active_at: string | null;
  };
  readonly child_profiles: ReturnType<typeof projectChildForAdmin>[];
  readonly entitlements: {
    readonly active: readonly ManagerUserEntitlementItem[];
    readonly history: readonly ManagerUserEntitlementItem[];
  };
  readonly payments: readonly ManagerUserPaymentItem[];
}

export interface ManagerUserActionInput {
  readonly userUuid: string;
  readonly managerId: number;
  readonly reason: string;
  readonly ipAddress: string;
  readonly userAgent: string;
}

async function verifyManagerTotpReauth(
  managerId: number,
  totpCode: string
): Promise<void> {
  const attemptGuard = new MfaAttemptGuard(getAuthRedisClient());
  await attemptGuard.assertNotLocked("manager", managerId);

  const repos = useOwnerRepositories();
  const mfa = await repos.authAccounts.findManagerTwoFactorForAuth(managerId);
  if (!mfa?.secret) {
    throw new InvalidCredentialsError();
  }

  const ok = await verifyBetterAuthTotp({
    storedSecret: mfa.secret,
    rootSecret: requireEnv("NUXT_SESSION_PASSWORD"),
    namespace: "manager",
    code: totpCode,
  });
  if (!ok) {
    const failure = await attemptGuard.recordFailure("manager", managerId);
    if (failure.locked) {
      throw new MfaLockedError();
    }
    throw new InvalidCredentialsError();
  }
  await attemptGuard.reset("manager", managerId);
}

async function verifyManagerPasswordReauth(
  password: string | undefined,
  passwordHash: string | null
): Promise<void> {
  if (!(password && passwordHash)) {
    throw new InvalidCredentialsError();
  }
  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid) {
    throw new InvalidCredentialsError();
  }
}

export async function verifyManagerReauthCredentials(
  input: ReauthManagerInput
): Promise<void> {
  const repos = useOwnerRepositories();
  const [manager, cred] = await Promise.all([
    repos.managers.findForAuthById(input.managerId),
    repos.authAccounts.findManagerCredentialAccountForAuth(input.managerId),
  ]);

  if (!manager?.isActive) {
    throw new InvalidCredentialsError();
  }

  const effectiveHash = cred?.password ?? manager.passwordHash;
  if (input.totp) {
    await verifyManagerTotpReauth(input.managerId, input.totp);
    return;
  }
  await verifyManagerPasswordReauth(input.password, effectiveHash);
}

function formatEntitlementItem(
  e: EntitlementEntity,
  managerMap: ReadonlyMap<number, ManagerEntity>
): ManagerUserEntitlementItem {
  const granter = e.grantedByManagerId
    ? managerMap.get(e.grantedByManagerId)
    : undefined;
  return {
    id: e.id,
    key: e.entitlementKey,
    source: ENTITLEMENT_SOURCE_CODEC.toLabel(e.source),
    status: ENTITLEMENT_STATUS_CODEC.toLabel(e.status),
    expires_at: e.expiresAt ? e.expiresAt.toISOString() : null,
    granted_at: e.grantedAt.toISOString(),
    grant_reason: e.grantReason ?? null,
    granted_by:
      granter?.displayName ||
      granter?.email ||
      (e.grantedByManagerId ? `Manager #${e.grantedByManagerId}` : "Hệ thống"),
  };
}

export async function getManagerUserDetail(input: {
  readonly userUuid: string;
  readonly managerId: number;
  readonly ipAddress: string;
  readonly userAgent: string;
}): Promise<ManagerUserDetailResult> {
  const repos = useOwnerRepositories();
  const targetUser = await repos.users.findByUuid(input.userUuid);
  if (!targetUser) {
    throw new NotFoundError();
  }

  const now = new Date();
  const [sessionStats, childRows, userEntitlements, allManagers, orders] =
    await Promise.all([
      repos.users.countActiveSessions(targetUser.id, now),
      repos.childProfiles.listAllByUser(targetUser.id),
      repos.entitlements.listAllForUser(targetUser.id),
      repos.managers.listAll(),
      repos.orders.listByUser(targetUser.id, 100),
    ]);

  const lastActiveAt = sessionStats.lastUsedAt
    ? sessionStats.lastUsedAt.toISOString()
    : targetUser.updatedAt.toISOString();

  const account = {
    id: targetUser.id,
    uuid: targetUser.uuid,
    email: targetUser.email,
    display_name: targetUser.displayName,
    status: USER_STATUS_CODEC.toLabel(targetUser.status),
    email_verified: targetUser.emailVerifiedAt !== null,
    email_verified_at: targetUser.emailVerifiedAt
      ? targetUser.emailVerifiedAt.toISOString()
      : null,
    mfa_enabled: Boolean(targetUser.twoFactorEnabled),
    suspended_reason: targetUser.suspendedReason ?? null,
    purge_at: targetUser.purgeAt ? targetUser.purgeAt.toISOString() : null,
    active_session_count: sessionStats.activeCount,
    created_at: targetUser.createdAt.toISOString(),
    last_active_at: lastActiveAt,
  };

  const sortedChildren = [...childRows].sort((a, b) => b.id - a.id);
  const projectedChildren = sortedChildren.map((c) =>
    projectChildForAdmin({
      ...c,
      status: CHILD_STATUS_CODEC.toLabel(c.status),
    })
  );

  if (projectedChildren.length > 0) {
    await repos.auditLogs.insertLog({
      actorType: ACTOR_TYPE.MANAGER,
      actorId: input.managerId,
      action: "manager.child_profiles.viewed",
      entityType: "user",
      entityId: targetUser.uuid,
      reason: "Manager viewed user details containing child profiles",
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });
  }

  const managerMap = new Map<number, ManagerEntity>();
  for (const m of allManagers) {
    managerMap.set(m.id, m);
  }

  const activeEntitlements = userEntitlements
    .filter(
      (e) =>
        (e.status === ENTITLEMENT_STATUS.ACTIVE ||
          e.status === ENTITLEMENT_STATUS.SOFT_UNLOCK) &&
        (!e.expiresAt || e.expiresAt.getTime() > now.getTime())
    )
    .map((e) => formatEntitlementItem(e, managerMap));

  const historyEntitlements = userEntitlements
    .filter(
      (e) =>
        (e.status !== ENTITLEMENT_STATUS.ACTIVE &&
          e.status !== ENTITLEMENT_STATUS.SOFT_UNLOCK) ||
        (e.expiresAt && e.expiresAt.getTime() <= now.getTime())
    )
    .map((e) => formatEntitlementItem(e, managerMap));

  const payments: ManagerUserPaymentItem[] = orders.map((o) => ({
    id: o.id,
    uuid: o.uuid,
    package_code: o.packageCode,
    offer_code: o.offerCode,
    amount_vnd: Number(o.amountVnd),
    status: PAYMENT_ORDER_STATUS_CODEC.toLabel(o.status),
    transfer_note: o.transferNote ?? null,
    bank_txn_ref: o.bankTxnRef ?? null,
    created_at: o.createdAt.toISOString(),
    submitted_at: o.submittedAt ? o.submittedAt.toISOString() : null,
    reviewed_at: o.reviewedAt ? o.reviewedAt.toISOString() : null,
    admin_note: o.adminNote ?? null,
  }));

  return {
    account,
    child_profiles: projectedChildren,
    entitlements: {
      active: activeEntitlements,
      history: historyEntitlements,
    },
    payments,
  };
}

export async function suspendUserByManager(
  input: ManagerUserActionInput
): Promise<{ readonly success: true; readonly status: UserStatusLabel }> {
  const repos = useOwnerRepositories();
  const targetUser = await repos.users.findByUuid(input.userUuid);
  if (!targetUser) {
    throw new NotFoundError();
  }
  if (targetUser.status === USER_STATUS.DELETED) {
    throw new UserAlreadyDeletedError();
  }

  const now = new Date();
  const updatedUser = await repos.users.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const row = await txRepos.users.suspendUser(
      targetUser.id,
      input.reason,
      now
    );
    if (!row) {
      throw new InternalError("Đình chỉ tài khoản thất bại");
    }

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: input.managerId,
      action: "user_suspended",
      entity_type: "user",
      entity_id: targetUser.uuid,
      before_data: { status: USER_STATUS_CODEC.toLabel(targetUser.status) },
      after_data: { status: USER_STATUS_CODEC.toLabel(row.status) },
      reason: input.reason,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });

    return row;
  });

  await revokeAllBetterAuthSessions("user", targetUser.id, {
    incrementSessionVersion: false,
  }).catch(() => null);

  return {
    success: true,
    status: USER_STATUS_CODEC.toLabel(updatedUser.status),
  };
}

export async function reactivateUserByManager(
  input: ManagerUserActionInput
): Promise<{ readonly success: true; readonly status: UserStatusLabel }> {
  const repos = useOwnerRepositories();
  const targetUser = await repos.users.findByUuid(input.userUuid);
  if (!targetUser) {
    throw new NotFoundError();
  }
  if (targetUser.status === USER_STATUS.DELETED) {
    throw new UserAlreadyDeletedError();
  }
  if (targetUser.status !== USER_STATUS.SUSPENDED) {
    throw new InvalidStatusTransitionError(
      "Chỉ có thể kích hoạt lại tài khoản đang bị tạm khoá."
    );
  }

  const targetStatus =
    targetUser.emailVerified || targetUser.emailVerifiedAt !== null
      ? USER_STATUS.ACTIVE
      : USER_STATUS.PENDING_VERIFICATION;

  const now = new Date();
  const updatedUser = await repos.users.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const row = await txRepos.users.reactivateUser(
      targetUser.id,
      targetStatus,
      now
    );
    if (!row) {
      throw new InvalidStatusTransitionError(
        "Trạng thái tài khoản vừa thay đổi, không thể kích hoạt lại."
      );
    }

    await writeAudit(tx, {
      actor_type: "manager",
      actor_id: input.managerId,
      action: "user_reactivated",
      entity_type: "user",
      entity_id: targetUser.uuid,
      before_data: { status: USER_STATUS_CODEC.toLabel(targetUser.status) },
      after_data: { status: USER_STATUS_CODEC.toLabel(row.status) },
      reason: input.reason,
      ip_address: input.ipAddress,
      user_agent: input.userAgent,
    });

    return row;
  });

  return {
    success: true,
    status: USER_STATUS_CODEC.toLabel(updatedUser.status),
  };
}

export async function sendUserPasswordResetByManager(input: {
  readonly userUuid: string;
  readonly managerId: number;
  readonly ipAddress: string;
  readonly userAgent: string;
}): Promise<{ readonly success: true; readonly message: string }> {
  const repos = useOwnerRepositories();
  const targetUser = await repos.users.findByUuid(input.userUuid);
  if (!targetUser) {
    throw new NotFoundError();
  }
  if (targetUser.status === USER_STATUS.DELETED) {
    throw new UserAlreadyDeletedError();
  }

  await getUserAuth().api.requestPasswordReset({
    body: {
      email: targetUser.email,
      redirectTo: "/reset-password",
    },
  });

  await repos.auditLogs.insertLog({
    actorType: ACTOR_TYPE.MANAGER,
    actorId: input.managerId,
    action: "manager.user.send_password_reset",
    entityType: "user",
    entityId: targetUser.uuid,
    reason: "Manager requested password reset link for user",
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
  });

  return {
    success: true,
    message: "Password reset link sent to user email",
  };
}
