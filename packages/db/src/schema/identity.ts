import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { idPk, insertOnlyTimestamps, timestamps } from "./columns.ts";

export const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

export const userStatusEnum = pgEnum("user_status", [
  "pending_verification",
  "active",
  "suspended",
  "deleted",
]);

export const managerRoleEnum = pgEnum("manager_role", ["super_admin"]);

export const accountTypeEnum = pgEnum("account_type", ["user", "manager"]);

export const authMethodEnum = pgEnum("auth_method", ["password", "social"]);

export const verificationPurposeEnum = pgEnum("verification_purpose", [
  "email_verify",
  "password_reset",
]);

export const socialProviderEnum = pgEnum("social_provider", [
  "google",
  "facebook",
]);

export const consentTypeEnum = pgEnum("consent_type", [
  "terms",
  "privacy",
  "child_data",
]);

export const consentActionEnum = pgEnum("consent_action", [
  "accepted",
  "withdrawn",
]);

export const users = pgTable(
  "users",
  {
    id: idPk(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    email: citext("email").notNull().unique(),
    passwordHash: text("password_hash"),
    displayName: varchar("display_name", { length: 60 }).notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
    status: userStatusEnum("status").notNull().default("pending_verification"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    sessionVersion: integer("session_version").notNull().default(0),
    suspendedReason: text("suspended_reason"),
    purgeAt: timestamp("purge_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index("idx_users_status_purge_at")
      .on(table.status, table.purgeAt)
      .where(sql`${table.purgeAt} IS NOT NULL`),
  ]
);

export const managers = pgTable("managers", {
  id: idPk(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  email: citext("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 60 }).notNull(),
  emailVerified: boolean("email_verified").notNull().default(true),
  image: text("image"),
  role: managerRoleEnum("role").notNull(),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  sessionVersion: integer("session_version").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  ...timestamps(),
});

export const userAccounts = pgTable(
  "user_accounts",
  {
    id: idPk(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password_hash"),
    emailAtProvider: citext("email_at_provider"),
    emailVerifiedAtProvider: boolean("email_verified_at_provider")
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

export const userSessions = pgTable(
  "user_sessions",
  {
    id: idPk(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    authMethod: text("auth_method").notNull().default("password"),
    reauthAt: timestamp("reauth_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [index("idx_user_sessions_user_id").on(table.userId)]
);

export const userVerifications = pgTable(
  "user_verifications",
  {
    id: idPk(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps(),
  },
  (table) => [index("idx_user_verifications_identifier").on(table.identifier)]
);

export const userTwoFactors = pgTable(
  "user_two_factors",
  {
    id: idPk(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: boolean("verified").default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    unique("user_two_factors_user_unique").on(table.userId),
    index("idx_user_two_factors_secret").on(table.secret),
  ]
);

export const userPasskeys = pgTable(
  "user_passkeys",
  {
    id: idPk(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull().unique(),
    counter: integer("counter").notNull().default(0),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull().default(false),
    transports: text("transports"),
    aaguid: text("aaguid"),
    ...timestamps(),
  },
  (table) => [index("idx_user_passkeys_user_id").on(table.userId)]
);

export const managerAccounts = pgTable(
  "manager_accounts",
  {
    id: idPk(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: bigint("manager_id", { mode: "number" })
      .notNull()
      .references(() => managers.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
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

export const managerSessions = pgTable(
  "manager_sessions",
  {
    id: idPk(),
    userId: bigint("manager_id", { mode: "number" })
      .notNull()
      .references(() => managers.id, { onDelete: "cascade" }),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    authMethod: text("auth_method").notNull().default("password"),
    reauthAt: timestamp("reauth_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [index("idx_manager_sessions_manager_id").on(table.userId)]
);

export const managerVerifications = pgTable(
  "manager_verifications",
  {
    id: idPk(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ...timestamps(),
  },
  (table) => [
    index("idx_manager_verifications_identifier").on(table.identifier),
  ]
);

export const managerTwoFactors = pgTable(
  "manager_two_factors",
  {
    id: idPk(),
    userId: bigint("manager_id", { mode: "number" })
      .notNull()
      .references(() => managers.id, { onDelete: "cascade" }),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    verified: boolean("verified").default(true),
    failedVerificationCount: integer("failed_verification_count").default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    unique("manager_two_factors_manager_unique").on(table.userId),
    index("idx_manager_two_factors_secret").on(table.secret),
  ]
);

export const managerPasskeys = pgTable(
  "manager_passkeys",
  {
    id: idPk(),
    name: text("name"),
    publicKey: text("public_key").notNull(),
    userId: bigint("manager_id", { mode: "number" })
      .notNull()
      .references(() => managers.id, { onDelete: "cascade" }),
    credentialID: text("credential_id").notNull().unique(),
    counter: integer("counter").notNull().default(0),
    deviceType: text("device_type").notNull(),
    backedUp: boolean("backed_up").notNull().default(false),
    transports: text("transports"),
    aaguid: text("aaguid"),
    ...timestamps(),
  },
  (table) => [index("idx_manager_passkeys_manager_id").on(table.userId)]
);

export const consentLogs = pgTable(
  "consent_logs",
  {
    id: idPk(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    consentType: consentTypeEnum("consent_type").notNull(),
    action: consentActionEnum("action").notNull().default("accepted"),
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

export const consentRequirements = pgTable("consent_requirements", {
  consentType: consentTypeEnum("consent_type").primaryKey(),
  reconsentRequiredAt: timestamp("reconsent_required_at", {
    withTimezone: true,
  }),
  notice: varchar("notice", { length: 500 }),
  ...timestamps(),
});

export const mfaRecoveryStatusEnum = pgEnum("mfa_recovery_status", [
  "pending_verification",
  "waiting",
  "completed",
  "cancelled",
  "expired",
]);

export const mfaRecoveryRequests = pgTable(
  "mfa_recovery_requests",
  {
    id: idPk(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: mfaRecoveryStatusEnum("status")
      .notNull()
      .default("pending_verification"),
    requestedByManagerId: bigint("requested_by_manager_id", { mode: "number" })
      .notNull()
      .references(() => managers.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    verificationTokenHash: text("verification_token_hash"),
    verificationTokenExpiresAt: timestamp("verification_token_expires_at", {
      withTimezone: true,
    }),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    eligibleAt: timestamp("eligible_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedByManagerId: bigint("completed_by_manager_id", {
      mode: "number",
    }).references(() => managers.id, { onDelete: "set null" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
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
