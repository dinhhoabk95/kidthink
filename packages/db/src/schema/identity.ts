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

export const managerRoleEnum = pgEnum("manager_role", [
  "super_admin",
  "content_reviewer",
]);

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

export const users = pgTable("users", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  email: citext("email").notNull().unique(),
  passwordHash: text("password_hash"),
  displayName: varchar("display_name", { length: 60 }).notNull(),
  status: userStatusEnum("status").notNull().default("pending_verification"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  sessionVersion: integer("session_version").notNull().default(0),
  suspendedReason: text("suspended_reason"),
  purgeAt: timestamp("purge_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const managers = pgTable("managers", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  email: citext("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: varchar("display_name", { length: 60 }).notNull(),
  role: managerRoleEnum("role").notNull(),
  mfaEnabled: boolean("mfa_enabled").notNull().default(false),
  sessionVersion: integer("session_version").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const activeSessions = pgTable(
  "active_sessions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    accountType: accountTypeEnum("account_type").notNull(),
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    deviceId: varchar("device_id", { length: 64 }).notNull(),
    remembered: boolean("remembered").notNull().default(false),
    deviceLabel: text("device_label"),
    ipAddress: text("ip_address"),
    authMethod: authMethodEnum("auth_method").notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Cặp đa hình: index, không khoá ngoại (BR-DM-04).
    index("idx_active_sessions_account").on(table.accountType, table.accountId),
  ]
);

export const mfaSettings = pgTable(
  "mfa_settings",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    accountType: accountTypeEnum("account_type").notNull(),
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    secretEncrypted: text("secret_encrypted").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // 1–1 với account: code đã tự upsert tay, UNIQUE biến bất biến đó thành ép được.
    unique("mfa_settings_account_unique").on(
      table.accountType,
      table.accountId
    ),
  ]
);

export const mfaRecoveryCodes = pgTable(
  "mfa_recovery_codes",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    accountType: accountTypeEnum("account_type").notNull(),
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    codeHash: text("code_hash").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Cặp đa hình: index, không khoá ngoại (BR-DM-04).
    index("idx_mfa_recovery_codes_account").on(
      table.accountType,
      table.accountId
    ),
  ]
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    accountType: accountTypeEnum("account_type").notNull(),
    accountId: bigint("account_id", { mode: "number" }).notNull(),
    purpose: verificationPurposeEnum("purpose").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Cặp đa hình: index, không khoá ngoại (BR-DM-04).
    index("idx_verification_tokens_account").on(
      table.accountType,
      table.accountId
    ),
  ]
);

export const socialIdentities = pgTable(
  "social_identities",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: socialProviderEnum("provider").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    emailAtProvider: citext("email_at_provider"),
    emailVerifiedAtProvider: boolean("email_verified_at_provider")
      .notNull()
      .default(false),
    displayNameAtProvider: varchar("display_name_at_provider", { length: 60 }),
    linkedAt: timestamp("linked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("social_identities_provider_user_id_unique").on(
      table.provider,
      table.providerUserId
    ),
    unique("social_identities_user_id_provider_unique").on(
      table.userId,
      table.provider
    ),
  ]
);

export const consentLogs = pgTable("consent_logs", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: bigint("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  consentType: consentTypeEnum("consent_type").notNull(),
  action: consentActionEnum("action").notNull().default("accepted"),
  ipAddress: text("ip_address").notNull(),
  userAgent: text("user_agent").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const consentRequirements = pgTable("consent_requirements", {
  consentType: consentTypeEnum("consent_type").primaryKey(),
  reconsentRequiredAt: timestamp("reconsent_required_at", {
    withTimezone: true,
  }),
  notice: varchar("notice", { length: 500 }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
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
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: mfaRecoveryStatusEnum("status")
      .notNull()
      .default("pending_verification"),
    requestedByManagerId: bigint("requested_by_manager_id", { mode: "number" })
      .notNull()
      .references(() => managers.id, { onDelete: "cascade" }),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_mfa_recovery_requests_user_status").on(
      table.userId,
      table.status
    ),
    index("idx_mfa_recovery_requests_token_hash").on(
      table.verificationTokenHash
    ),
  ]
);
