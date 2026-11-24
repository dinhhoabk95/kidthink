import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import {
  AUTH_METHOD,
  type AuthMethod,
  CONSENT_ACTION,
  type ConsentAction,
  type ConsentType,
  type ManagerRole,
  MFA_RECOVERY_STATUS,
  type MfaRecoveryStatus,
  USER_STATUS,
  type UserStatus,
} from "#src/constants/identity-enums";
import {
  citext,
  idPk,
  insertOnlyTimestamps,
  timestampMs,
  timestamps,
  uuidCol,
} from "./columns.ts";

export const users = sqliteTable(
  "users",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    email: citext("email").notNull().unique(),
    passwordHash: text("password_hash"),
    displayName: text("display_name").notNull(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .notNull()
      .default(false),
    image: text("image"),
    twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" })
      .notNull()
      .default(false),
    status: integer("status")
      .$type<UserStatus>()
      .notNull()
      .default(USER_STATUS.PENDING_VERIFICATION),
    emailVerifiedAt: timestampMs("email_verified_at"),
    sessionVersion: integer("session_version").notNull().default(0),
    suspendedReason: text("suspended_reason"),
    purgeAt: timestampMs("purge_at"),
    ...timestamps(),
  },
  (table) => [
    index("idx_users_status_purge_at")
      .on(table.status, table.purgeAt)
      .where(sql`${table.purgeAt} IS NOT NULL`),
  ]
);

export const managers = sqliteTable("managers", {
  id: idPk(),
  uuid: uuidCol("uuid").unique(),
  email: citext("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .notNull()
    .default(true),
  image: text("image"),
  role: integer("role").$type<ManagerRole>().notNull(),
  mfaEnabled: integer("mfa_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  sessionVersion: integer("session_version").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps(),
});

export const userAccounts = sqliteTable(
  "user_accounts",
  {
    id: idPk(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestampMs("access_token_expires_at"),
    refreshTokenExpiresAt: timestampMs("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password_hash"),
    emailAtProvider: citext("email_at_provider"),
    emailVerifiedAtProvider: integer("email_verified_at_provider", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    ...timestamps(),
  },
  (table) => [
    unique("user_accounts_provider_account_unique").on(
      table.providerId,
      table.accountId
    ),
    unique("user_accounts_user_provider_unique").on(
      table.userId,
      table.providerId
    ),
    index("idx_user_accounts_user_id").on(table.userId),
  ]
);

export const userSessions = sqliteTable(
  "user_sessions",
  {
    id: idPk(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestampMs("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    authMethod: integer("auth_method")
      .$type<AuthMethod>()
      .notNull()
      .default(AUTH_METHOD.PASSWORD),
    reauthAt: timestampMs("reauth_at"),
    ...timestamps(),
  },
  (table) => [index("idx_user_sessions_user_id").on(table.userId)]
);

export const userVerifications = sqliteTable(
  "user_verifications",
  {
    id: idPk(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestampMs("expires_at").notNull(),
    ...timestamps(),
  },
  (table) => [index("idx_user_verifications_identifier").on(table.identifier)]
);

export const userTwoFactors = sqliteTable(
  "user_two_factors",
  {
    id: idPk(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: integer("verified", { mode: "boolean" }).default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestampMs("locked_until"),
    ...timestamps(),
  },
  (table) => [
    unique("user_two_factors_user_unique").on(table.userId),
    index("idx_user_two_factors_secret").on(table.secret),
  ]
);

export const userPasskeys = sqliteTable(
  "user_passkeys",
  {
    id: idPk(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull().unique(),
    counter: integer("counter").notNull().default(0),
    deviceType: text("device_type").notNull(),
    backedUp: integer("backed_up", { mode: "boolean" })
      .notNull()
      .default(false),
    transports: text("transports"),
    aaguid: text("aaguid"),
    ...timestamps(),
  },
  (table) => [index("idx_user_passkeys_user_id").on(table.userId)]
);

export const managerAccounts = sqliteTable(
  "manager_accounts",
  {
    id: idPk(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: integer("manager_id")
      .notNull()
      .references(() => managers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestampMs("access_token_expires_at"),
    refreshTokenExpiresAt: timestampMs("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password_hash"),
    ...timestamps(),
  },
  (table) => [
    unique("manager_accounts_provider_account_unique").on(
      table.providerId,
      table.accountId
    ),
    unique("manager_accounts_manager_provider_unique").on(
      table.userId,
      table.providerId
    ),
    index("idx_manager_accounts_manager_id").on(table.userId),
  ]
);

export const managerSessions = sqliteTable(
  "manager_sessions",
  {
    id: idPk(),
    userId: integer("manager_id")
      .notNull()
      .references(() => managers.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestampMs("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    authMethod: integer("auth_method")
      .$type<AuthMethod>()
      .notNull()
      .default(AUTH_METHOD.PASSWORD),
    reauthAt: timestampMs("reauth_at"),
    ...timestamps(),
  },
  (table) => [index("idx_manager_sessions_manager_id").on(table.userId)]
);

export const managerVerifications = sqliteTable(
  "manager_verifications",
  {
    id: idPk(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestampMs("expires_at").notNull(),
    ...timestamps(),
  },
  (table) => [
    index("idx_manager_verifications_identifier").on(table.identifier),
  ]
);

export const managerTwoFactors = sqliteTable(
  "manager_two_factors",
  {
    id: idPk(),
    userId: integer("manager_id")
      .notNull()
      .references(() => managers.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: integer("verified", { mode: "boolean" }).default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestampMs("locked_until"),
    ...timestamps(),
  },
  (table) => [
    unique("manager_two_factors_manager_unique").on(table.userId),
    index("idx_manager_two_factors_secret").on(table.secret),
  ]
);

export const managerPasskeys = sqliteTable(
  "manager_passkeys",
  {
    id: idPk(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: integer("manager_id")
      .notNull()
      .references(() => managers.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull().unique(),
    counter: integer("counter").notNull().default(0),
    deviceType: text("device_type").notNull(),
    backedUp: integer("backed_up", { mode: "boolean" })
      .notNull()
      .default(false),
    transports: text("transports"),
    aaguid: text("aaguid"),
    ...timestamps(),
  },
  (table) => [index("idx_manager_passkeys_manager_id").on(table.userId)]
);

export const consentLogs = sqliteTable(
  "consent_logs",
  {
    id: idPk(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    consentType: integer("consent_type").$type<ConsentType>().notNull(),
    action: integer("action")
      .$type<ConsentAction>()
      .notNull()
      .default(CONSENT_ACTION.ACCEPTED),
    ipAddress: text("ip_address").notNull(),
    userAgent: text("user_agent").notNull(),
    ...insertOnlyTimestamps(),
  },
  (table) => [
    index("idx_consent_logs_user_type_created").on(
      table.userId,
      table.consentType,
      table.createdAt,
      table.id
    ),
  ]
);

export const consentRequirements = sqliteTable("consent_requirements", {
  consentType: integer("consent_type").$type<ConsentType>().primaryKey(),
  reconsentRequiredAt: timestampMs("reconsent_required_at"),
  notice: text("notice"),
  ...timestamps(),
});

export const mfaRecoveryRequests = sqliteTable(
  "mfa_recovery_requests",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: integer("status")
      .$type<MfaRecoveryStatus>()
      .notNull()
      .default(MFA_RECOVERY_STATUS.PENDING_VERIFICATION),
    requestedByManagerId: integer("requested_by_manager_id")
      .notNull()
      .references(() => managers.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    verificationTokenHash: text("verification_token_hash"),
    verificationTokenExpiresAt: timestampMs("verification_token_expires_at"),
    emailVerifiedAt: timestampMs("email_verified_at"),
    eligibleAt: timestampMs("eligible_at").notNull(),
    completedAt: timestampMs("completed_at"),
    completedByManagerId: integer("completed_by_manager_id").references(
      () => managers.id,
      { onDelete: "set null" }
    ),
    cancelledAt: timestampMs("cancelled_at"),
    ...timestamps(),
  },
  (table) => [
    index("idx_mfa_recovery_requests_user_status").on(
      table.userId,
      table.status
    ),
    index("idx_mfa_recovery_requests_token_hash")
      .on(table.verificationTokenHash)
      .where(sql`${table.verificationTokenHash} IS NOT NULL`),
    index("idx_mfa_recovery_requests_requested_by_manager").on(
      table.requestedByManagerId
    ),
    index("idx_mfa_recovery_requests_completed_by_manager")
      .on(table.completedByManagerId)
      .where(sql`${table.completedByManagerId} IS NOT NULL`),
  ]
);
