import {
  generateSecureToken,
  getAuthRedisClient,
  hashPassword,
  hashSecureToken,
  MfaAttemptGuard,
  validatePasswordStrength,
  verifyBetterAuthTotp,
  verifyPassword,
} from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  ACTOR_TYPE,
  CHILD_STATUS,
  type ManagerUserSort,
  USER_STATUS_CODEC,
  type UserStatusLabel,
} from "@mindkid/db";
import { createRepositories } from "@mindkid/db/repositories";
import { EmailAlreadyInUseError } from "@mindkid/errors/account";
import {
  InvalidCredentialsError,
  MfaLockedError,
  PasswordAlreadySetError,
  PasswordNotSetError,
  TokenExpiredError,
} from "@mindkid/errors/auth";
import { NotFoundError, ValidationError } from "@mindkid/errors/common";
import { LastLoginMethodError } from "@mindkid/errors/social";
import { dispatchTransactionalEmail } from "@mindkid/notification";
import { allowedTiers, type EntitlementKey } from "@mindkid/shared";
import { buildAccountActionUrl } from "#server/utils/account-action-url";
import { revokeAllBetterAuthSessions } from "#server/utils/better-auth";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { useOwnerRepositories } from "#server/utils/repositories";

export interface ListManagerUsersQuery {
  readonly q?: string;
  readonly status?: UserStatusLabel;
  readonly package_code?: string;
  readonly created_from?: string;
  readonly created_to?: string;
  readonly has_children?: boolean;
  readonly sort: ManagerUserSort;
  readonly limit: number;
  readonly cursor?: string;
}

export interface ManagerUserListItem {
  readonly id: number;
  readonly uuid: string;
  readonly email: string;
  readonly display_name: string;
  readonly status: UserStatusLabel;
  readonly child_count: number;
  readonly active_package: string | null;
  readonly created_at: string;
  readonly last_active_at: string | null;
}

export interface ManagerUsersListResult {
  readonly items: readonly ManagerUserListItem[];
  readonly next_cursor: string | null;
}

export interface UserAccessContextResult {
  readonly has_active_child: boolean;
  readonly active_keys: readonly EntitlementKey[];
  readonly allowed_tiers: readonly string[];
}

export interface UserProfileResult {
  readonly uuid: string;
  readonly email: string;
  readonly display_name: string;
  readonly status: UserStatusLabel;
  readonly email_verified: boolean;
  readonly has_password: boolean;
  readonly two_factor_enabled: boolean;
  readonly two_factor_confirmed_at: string | null;
  readonly pending_email: string | null;
}

export interface RequestEmailChangeInput {
  readonly userId: number;
  readonly newEmail: string;
}

export interface RequestEmailChangeResult {
  readonly pending_email: string;
  readonly expires_at: string;
  readonly message: string;
}

export interface VerifyEmailChangeInput {
  readonly token: string;
  readonly newEmail: string;
}

export interface VerifyEmailChangeResult {
  readonly ok: true;
  readonly email: string;
  readonly message: string;
}

export interface ReauthUserInput {
  readonly userId: number;
  readonly password?: string;
  readonly totp?: string;
  readonly method?: "password" | "totp";
}

export interface SocialIdentityItem {
  readonly provider: string;
  readonly masked_email: string | null;
  readonly linked_at: string;
}

export interface UnlinkSocialIdentityInput {
  readonly userId: number;
  readonly provider: string;
  readonly ipAddress: string;
  readonly userAgent: string;
}

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

export async function listUsersForManager(
  query: ListManagerUsersQuery
): Promise<ManagerUsersListResult> {
  const parsedCursor = query.cursor ? Number(query.cursor) : undefined;
  const validCursor =
    parsedCursor !== undefined &&
    Number.isInteger(parsedCursor) &&
    parsedCursor > 0
      ? parsedCursor
      : undefined;

  const repos = useOwnerRepositories();
  const page = await repos.users.listCursorForManager({
    q: query.q,
    status: query.status ? USER_STATUS_CODEC.toCode(query.status) : undefined,
    packageCode: query.package_code,
    createdFrom: query.created_from,
    createdTo: query.created_to,
    cursor: validCursor,
    sort: query.sort,
    limit: query.limit,
  });

  const nextCursor = page.nextCursor === null ? null : String(page.nextCursor);
  if (page.items.length === 0) {
    return { items: [], next_cursor: nextCursor };
  }

  const userIds = page.items.map((u) => u.id);
  const [childCountMap, activePackageMap, lastActiveMap] = await Promise.all([
    repos.childProfiles.countAllByUsers(userIds),
    repos.entitlements.mapFirstActiveKeyByUsers(userIds),
    repos.users.mapLastActiveByUsers(userIds),
  ]);

  let items: ManagerUserListItem[] = page.items.map((u) => {
    const lastActive = lastActiveMap.get(u.id) ?? u.updatedAt;
    return {
      id: u.id,
      uuid: u.uuid,
      email: u.email,
      display_name: u.displayName,
      status: USER_STATUS_CODEC.toLabel(u.status),
      child_count: childCountMap.get(u.id) ?? 0,
      active_package: activePackageMap.get(u.id) ?? null,
      created_at: u.createdAt.toISOString(),
      last_active_at: lastActive ? lastActive.toISOString() : null,
    };
  });

  if (query.has_children !== undefined) {
    items = items.filter((item) =>
      query.has_children ? item.child_count > 0 : item.child_count === 0
    );
  }

  if (query.sort === "last_active") {
    items = [...items].sort((a, b) => {
      const timeA = a.last_active_at ? new Date(a.last_active_at).getTime() : 0;
      const timeB = b.last_active_at ? new Date(b.last_active_at).getTime() : 0;
      return timeB - timeA;
    });
  }

  return {
    items,
    next_cursor: nextCursor,
  };
}

export async function getUserAccessContext(
  userId: number,
  candidateChildUuid: string | null
): Promise<UserAccessContextResult> {
  const repos = useOwnerRepositories();
  let activeChildUuid: string | null = null;
  if (candidateChildUuid) {
    const ownedChild = await repos.childProfiles.findByUuidForUser(
      candidateChildUuid,
      userId
    );
    if (ownedChild?.status === CHILD_STATUS.ACTIVE) {
      activeChildUuid = ownedChild.uuid;
    }
  }
  const activeKeys = await resolveUserActiveEntitlements(userId);

  return {
    has_active_child: Boolean(activeChildUuid),
    active_keys: activeKeys,
    allowed_tiers: await allowedTiers(
      {
        kind: "user",
        user_id: String(userId),
        active_child_id: activeChildUuid,
      },
      activeKeys
    ),
  };
}

export async function getUserProfile(
  userId: number
): Promise<UserProfileResult> {
  const repos = useOwnerRepositories();
  const now = new Date();

  const [userRow, credRow, twoFactorRow, verificationRows] = await Promise.all([
    repos.users.findForAuthById(userId),
    repos.authAccounts.findUserCredentialAccountForAuth(userId),
    repos.authAccounts.findUserTwoFactor(userId),
    repos.authAccounts.listActiveUserVerificationsByPrefix(
      "email_change:",
      now,
      10
    ),
  ]);

  if (!userRow) {
    throw new NotFoundError("NOT_FOUND");
  }

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
    status: USER_STATUS_CODEC.toLabel(userRow.status),
    email_verified: userRow.emailVerified,
    has_password: Boolean(credRow?.password || userRow.passwordHash),
    two_factor_enabled: isTwoFactorEnabled,
    two_factor_confirmed_at:
      isTwoFactorEnabled && twoFactorRow?.updatedAt
        ? twoFactorRow.updatedAt.toISOString()
        : null,
    pending_email: pendingEmail,
  };
}

export async function updateUserProfile(
  userId: number,
  displayName: string
): Promise<{ readonly display_name: string }> {
  const repos = useOwnerRepositories();
  const updated = await repos.users.updateProfile(userId, { displayName });
  if (!updated) {
    throw new NotFoundError("NOT_FOUND");
  }
  return { display_name: updated.displayName };
}

export async function requestUserEmailChange(
  input: RequestEmailChangeInput
): Promise<RequestEmailChangeResult> {
  const newEmail = input.newEmail.toLowerCase();
  const repos = useOwnerRepositories();

  const currentUser = await repos.users.findById(input.userId);
  if (!currentUser) {
    throw new NotFoundError("NOT_FOUND");
  }
  if (currentUser.email.toLowerCase() === newEmail) {
    throw new ValidationError("Địa chỉ email mới trùng với địa chỉ hiện tại.");
  }

  const existing = await repos.users.findByEmail(newEmail);
  if (existing) {
    throw new EmailAlreadyInUseError();
  }

  const rawToken = generateSecureToken();
  const tokenHash = hashSecureToken(`email_change:${rawToken}:${newEmail}`);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  await repos.authAccounts.createUserVerification({
    identifier: `email_change:${tokenHash}`,
    value: JSON.stringify({ userId: input.userId, newEmail }),
    expiresAt,
    createdAt: now,
  });

  const actionUrl = buildAccountActionUrl("email_change", rawToken, {
    email: newEmail,
  });

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: input.userId,
    code: "email_change_verification",
    to: newEmail,
    payload: {
      new_email: newEmail,
      expires_at: expiresAt.toISOString(),
    },
    secrets: {
      token: rawToken,
      url: actionUrl,
    },
  });

  return {
    pending_email: newEmail,
    expires_at: expiresAt.toISOString(),
    message:
      "Đã gửi mã xác nhận đến địa chỉ email mới. Vui lòng kiểm tra hộp thư trong vòng 24 giờ.",
  };
}

export async function verifyUserEmailChange(
  input: VerifyEmailChangeInput
): Promise<VerifyEmailChangeResult> {
  const newEmail = input.newEmail.trim().toLowerCase();
  const tokenHash = hashSecureToken(`email_change:${input.token}:${newEmail}`);
  const identifier = `email_change:${tokenHash}`;
  const now = new Date();

  const repos = useOwnerRepositories();
  const tokenRecord = await repos.authAccounts.findActiveUserVerification(
    identifier,
    now
  );
  if (!tokenRecord) {
    throw new TokenExpiredError();
  }

  const parsedValue = JSON.parse(tokenRecord.value) as {
    userId: number;
    newEmail: string;
  };
  const userId = Number(parsedValue.userId);

  const currentUser = await repos.users.findById(userId);
  if (!currentUser) {
    throw new TokenExpiredError();
  }
  const oldEmail = currentUser.email;

  const conflict = await repos.users.findByEmail(newEmail);
  if (conflict && conflict.id !== userId) {
    throw new EmailAlreadyInUseError();
  }

  await repos.users.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const deleted = await txRepos.authAccounts.deleteUserVerificationById(
      tokenRecord.id
    );
    if (!deleted) {
      throw new TokenExpiredError();
    }
    await txRepos.users.applyEmailChange(userId, newEmail, now);
    await revokeAllBetterAuthSessions("user", userId, { tx });
  });

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: userId,
    code: "email_changed_old_address_notice",
    to: oldEmail,
    payload: {
      new_email: newEmail,
      timestamp: now.toISOString(),
    },
  });

  return {
    ok: true,
    email: newEmail,
    message: "Cập nhật địa chỉ email thành công.",
  };
}

export async function changeUserPassword(
  userId: number,
  newPassword: string
): Promise<{ readonly ok: true; readonly message: string }> {
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new ValidationError(
      passwordValidation.reason || "Mật khẩu không đủ mạnh."
    );
  }

  const repos = useOwnerRepositories();
  const [account, cred] = await Promise.all([
    repos.users.findForAuthById(userId),
    repos.authAccounts.findUserCredentialAccountForAuth(userId),
  ]);

  if (!account) {
    throw new NotFoundError("NOT_FOUND");
  }
  if (!(cred?.password || account.passwordHash)) {
    throw new PasswordNotSetError();
  }

  const newHash = await hashPassword(newPassword);
  const now = new Date();

  await repos.users.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    await txRepos.users.updatePasswordAndBumpSession(userId, newHash, now);
    await txRepos.authAccounts.upsertUserCredentialAccount(
      userId,
      newHash,
      now
    );
  });

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: userId,
    code: "password_changed_notification",
    to: account.email,
    payload: { timestamp: now.toISOString() },
  });

  return {
    ok: true,
    message:
      "Đổi mật khẩu thành công. Các phiên đăng nhập trên thiết bị khác đã được đăng xuất.",
  };
}

export async function setUserPassword(
  userId: number,
  newPassword: string
): Promise<{ readonly ok: true; readonly message: string }> {
  const passwordValidation = validatePasswordStrength(newPassword);
  if (!passwordValidation.valid) {
    throw new ValidationError(
      passwordValidation.reason || "Mật khẩu không đủ mạnh."
    );
  }

  const repos = useOwnerRepositories();
  const [account, cred] = await Promise.all([
    repos.users.findForAuthById(userId),
    repos.authAccounts.findUserCredentialAccountForAuth(userId),
  ]);

  if (!account) {
    throw new NotFoundError("NOT_FOUND");
  }
  if (cred?.password || account.passwordHash) {
    throw new PasswordAlreadySetError();
  }

  const newHash = await hashPassword(newPassword);
  const now = new Date();

  await repos.users.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    await txRepos.users.updatePasswordHash(userId, newHash, now);
    await txRepos.authAccounts.upsertUserCredentialAccount(
      userId,
      newHash,
      now
    );
  });

  return {
    ok: true,
    message: "Thiết lập mật khẩu thành công.",
  };
}

async function verifyUserTotpReauth(
  userId: number,
  totpCode: string
): Promise<void> {
  const attemptGuard = new MfaAttemptGuard(getAuthRedisClient());
  await attemptGuard.assertNotLocked("user", userId);

  const repos = useOwnerRepositories();
  const mfa = await repos.authAccounts.findUserTwoFactorForAuth(userId);
  if (!mfa?.secret || mfa.verified === false) {
    throw new InvalidCredentialsError();
  }

  const ok = await verifyBetterAuthTotp({
    storedSecret: mfa.secret,
    rootSecret: requireEnv("NUXT_SESSION_PASSWORD"),
    namespace: "user",
    code: totpCode,
  });
  if (!ok) {
    const failure = await attemptGuard.recordFailure("user", userId);
    if (failure.locked) {
      throw new MfaLockedError();
    }
    throw new InvalidCredentialsError();
  }
  await attemptGuard.reset("user", userId);
}

async function verifyUserPasswordReauth(
  password: string | undefined,
  passwordHash: string | null
): Promise<void> {
  if (!password) {
    throw new InvalidCredentialsError();
  }
  if (!passwordHash) {
    throw new PasswordNotSetError();
  }
  const isValid = await verifyPassword(password, passwordHash);
  if (!isValid) {
    throw new InvalidCredentialsError();
  }
}

export async function verifyUserReauthCredentials(
  input: ReauthUserInput
): Promise<void> {
  const repos = useOwnerRepositories();
  const [account, cred] = await Promise.all([
    repos.users.findForAuthById(input.userId),
    repos.authAccounts.findUserCredentialAccountForAuth(input.userId),
  ]);

  if (!account) {
    throw new InvalidCredentialsError();
  }

  const effectiveHash = cred?.password ?? account.passwordHash;
  if (account.twoFactorEnabled) {
    if (input.password !== undefined || input.method === "password") {
      await verifyUserPasswordReauth(input.password, effectiveHash);
    }
    if (!input.totp) {
      throw new InvalidCredentialsError();
    }
    await verifyUserTotpReauth(input.userId, input.totp);
    return;
  }

  if (input.method === "totp") {
    if (!input.totp) {
      throw new InvalidCredentialsError();
    }
    await verifyUserTotpReauth(input.userId, input.totp);
    return;
  }

  if (input.totp) {
    await verifyUserTotpReauth(input.userId, input.totp);
    return;
  }
  await verifyUserPasswordReauth(input.password, effectiveHash);
}

export async function listUserSocialIdentities(
  userId: number
): Promise<{ readonly items: readonly SocialIdentityItem[] }> {
  const repos = useOwnerRepositories();
  const rows = await repos.authAccounts.listSocialAccountsForUser(userId, [
    "google",
    "facebook",
  ]);
  return {
    items: rows.map((row) => ({
      provider: row.providerId,
      masked_email: maskEmail(row.emailAtProvider),
      linked_at: row.createdAt.toISOString(),
    })),
  };
}

export async function unlinkUserSocialIdentity(
  input: UnlinkSocialIdentityInput
): Promise<{ readonly ok: true; readonly login_methods_left: number }> {
  const repos = useOwnerRepositories();
  const result = await repos.users.transaction(async (tx) => {
    const txRepos = createRepositories(tx);
    const user = await txRepos.users.findByIdForUpdate(input.userId);
    if (!user) {
      throw new NotFoundError();
    }

    const [accounts, passkeyCount] = await Promise.all([
      txRepos.authAccounts.listUserAccounts(input.userId),
      txRepos.authAccounts.countUserPasskeys(input.userId),
    ]);

    const targetAccount = accounts.find((a) => a.providerId === input.provider);
    if (!targetAccount) {
      throw new NotFoundError("Tài khoản chưa liên kết với nhà cung cấp này.");
    }

    const remainingAccounts = accounts.filter(
      (a) => a.id !== targetAccount.id
    ).length;
    const loginMethodsLeft = remainingAccounts + passkeyCount;

    if (loginMethodsLeft < 1) {
      throw new LastLoginMethodError(
        "Không thể gỡ phương thức đăng nhập cuối cùng. Vui lòng đặt mật khẩu trước khi gỡ."
      );
    }

    await txRepos.authAccounts.deleteUserAccountById(
      targetAccount.id,
      input.userId
    );

    await txRepos.auditLogs.insertLog({
      actorType: ACTOR_TYPE.USER,
      actorId: input.userId,
      action: "social_identity.unlinked",
      entityType: "social_identity",
      entityId: String(targetAccount.id),
      afterData: { provider: input.provider },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return { loginMethodsLeft, email: user.email };
  });

  await dispatchTransactionalEmail({
    recipientType: "user",
    recipientId: input.userId,
    code: "social_identity_unlinked",
    to: result.email,
    payload: {
      provider: input.provider,
    },
  });

  return {
    ok: true,
    login_methods_left: result.loginMethodsLeft,
  };
}
