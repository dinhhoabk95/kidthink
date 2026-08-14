import {
  bigint,
  boolean,
  customType,
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
  "child_data_withdrawn",
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

export const activeSessions = pgTable("active_sessions", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  accountType: accountTypeEnum("account_type").notNull(),
  accountId: bigint("account_id", { mode: "number" }).notNull(),
  deviceId: varchar("device_id", { length: 64 }).notNull(),
  remembered: boolean("remembered").notNull().default(false),
  deviceLabel: text("device_label"),
  ipAddress: text("ip_address"),
  authMethod: authMethodEnum("auth_method").notNull(),
  reauthAt: timestamp("reauth_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const mfaSettings = pgTable("mfa_settings", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  accountType: accountTypeEnum("account_type").notNull(),
  accountId: bigint("account_id", { mode: "number" }).notNull(),
  secretEncrypted: text("secret_encrypted").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const mfaRecoveryCodes = pgTable("mfa_recovery_codes", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  accountType: accountTypeEnum("account_type").notNull(),
  accountId: bigint("account_id", { mode: "number" }).notNull(),
  codeHash: text("code_hash").notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  accountType: accountTypeEnum("account_type").notNull(),
  accountId: bigint("account_id", { mode: "number" }).notNull(),
  purpose: verificationPurposeEnum("purpose").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
  policyVersion: varchar("policy_version", { length: 20 }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
