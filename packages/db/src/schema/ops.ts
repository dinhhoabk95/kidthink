import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { idPk, insertOnlyTimestamps, timestamps } from "./columns.ts";
import { managers, users } from "./identity.ts";

export const actorTypeEnum = pgEnum("actor_type", [
  "user",
  "manager",
  "system",
]);

export const backupTypeEnum = pgEnum("backup_type", [
  "dump",
  "verify",
  "drill",
]);

export const backupStatusEnum = pgEnum("backup_status", [
  "started",
  "success",
  "failed",
]);

export const recipientTypeEnum = pgEnum("recipient_type", ["user", "manager"]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "email",
  "in_app",
  "fcm_web",
]);

export const notificationEndpointProviderEnum = pgEnum(
  "notification_endpoint_provider",
  ["fcm_web"]
);

export const notificationEndpointStatusEnum = pgEnum(
  "notification_endpoint_status",
  ["active", "invalid", "revoked"]
);

export const notificationStatusEnum = pgEnum("notification_status", [
  "queued",
  "dispatched",
  "failed",
  "suppressed",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: idPk(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    actorType: actorTypeEnum("actor_type").notNull(),
    actorId: bigint("actor_id", { mode: "number" }),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }).notNull(),
    beforeData: jsonb("before_data"),
    afterData: jsonb("after_data"),
    reason: text("reason"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...insertOnlyTimestamps(),
  },
  (table) => [
    index("idx_audit_logs_actor_created").on(
      table.actorType,
      table.actorId,
      table.createdAt
    ),
    index("idx_audit_logs_entity_created").on(
      table.entityType,
      table.entityId,
      table.createdAt
    ),
    index("idx_audit_logs_action_created").on(table.action, table.createdAt),
    index("idx_audit_logs_created_at").on(table.createdAt),
  ]
);

export const backupLog = pgTable(
  "backup_log",
  {
    id: idPk(),
    backupType: backupTypeEnum("backup_type").notNull(),
    status: backupStatusEnum("status").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }),
    storagePath: text("storage_path"),
    checksum: varchar("checksum", { length: 64 }),
    restoredRows: integer("restored_rows"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    ...timestamps(),
  },
  (table) => [index("idx_backup_log_started_at").on(table.startedAt.desc())]
);

export const notifications = pgTable(
  "notifications",
  {
    id: idPk(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    recipientType: recipientTypeEnum("recipient_type").notNull(),
    recipientId: bigint("recipient_id", { mode: "number" }).notNull(),
    templateCode: varchar("template_code", { length: 60 }).notNull(),
    payload: jsonb("payload"),
    ...timestamps(),
  },
  (table) => [
    // Cặp đa hình kèm phân trang con trỏ (created_at DESC, id DESC) (BR-DM-04).
    index("idx_notifications_recipient").on(
      table.recipientType,
      table.recipientId,
      table.createdAt.desc(),
      table.id.desc()
    ),
  ]
);

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: idPk(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    notificationId: bigint("notification_id", { mode: "number" })
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationStatusEnum("status").notNull().default("queued"),
    suppressedReason: text("suppressed_reason"),
    providerMessageId: varchar("provider_message_id", { length: 100 }),
    dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
    error: text("error"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_notification_deliveries_active_channel").on(
      table.notificationId,
      table.channel
    ),
    index("idx_notification_deliveries_queued")
      .on(table.status, table.createdAt)
      .where(sql`${table.status} = 'queued'`),
  ]
);

export const notificationReads = pgTable("notification_reads", {
  notificationId: bigint("notification_id", { mode: "number" })
    .primaryKey()
    .references(() => notifications.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at", { withTimezone: true }).notNull(),
  ...timestamps(),
});

export const notificationEndpoints = pgTable(
  "notification_endpoints",
  {
    id: idPk(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: notificationEndpointProviderEnum("provider").notNull(),
    clientInstallationId: uuid("client_installation_id").notNull(),
    tokenEncrypted: text("token_encrypted").notNull(),
    tokenFingerprint: text("token_fingerprint").notNull().unique(),
    status: notificationEndpointStatusEnum("status")
      .notNull()
      .default("active"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    invalidatedAt: timestamp("invalidated_at", { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_notification_endpoints_user_installation").on(
      table.userId,
      table.clientInstallationId
    ),
  ]
);

export const flagScopeEnum = pgEnum("flag_scope", [
  "global",
  "user_ids",
  "percentage",
]);

export const errorSourceEnum = pgEnum("error_source", ["server", "client"]);
export const errorLevelEnum = pgEnum("error_level", ["warn", "error", "fatal"]);
export const errorGroupStatusEnum = pgEnum("error_group_status", [
  "open",
  "ack",
  "resolved",
]);

export const featureFlags = pgTable(
  "feature_flags",
  {
    id: idPk(),
    key: varchar("key", { length: 100 }).notNull().unique(),
    enabled: boolean("enabled").notNull().default(false),
    scope: flagScopeEnum("scope").notNull().default("global"),
    scopeValue: jsonb("scope_value"),
    defaultValue: boolean("default_value").notNull().default(false),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    updatedByManagerId: bigint("updated_by_manager_id", {
      mode: "number",
    }).references(() => managers.id, { onDelete: "set null" }),
    updateReason: text("update_reason"),
    ...timestamps(),
  },
  (table) => [
    index("idx_feature_flags_updated_by_manager")
      .on(table.updatedByManagerId)
      .where(sql`${table.updatedByManagerId} IS NOT NULL`),
  ]
);

export const errorLogs = pgTable(
  "error_logs",
  {
    id: idPk(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    source: errorSourceEnum("source").notNull().default("server"),
    level: errorLevelEnum("level").notNull().default("error"),
    code: varchar("code", { length: 80 }).notNull(),
    message: text("message").notNull(),
    fingerprint: varchar("fingerprint", { length: 120 }).notNull(),
    context: jsonb("context"),
    requestId: varchar("request_id", { length: 80 }),
    userId: bigint("user_id", { mode: "number" }).references(() => users.id, {
      onDelete: "set null",
    }),
    status: errorGroupStatusEnum("status").notNull().default("open"),
    resolvedNotes: text("resolved_notes"),
    resolvedByManagerId: bigint("resolved_by_manager_id", {
      mode: "number",
    }).references(() => managers.id, { onDelete: "set null" }),
    ...timestamps(),
  },
  (table) => [
    index("idx_error_logs_fingerprint_status").on(
      table.fingerprint,
      table.status
    ),
    index("idx_error_logs_created_at").on(table.createdAt),
    index("idx_error_logs_user_id")
      .on(table.userId)
      .where(sql`${table.userId} IS NOT NULL`),
    index("idx_error_logs_resolved_by_manager")
      .on(table.resolvedByManagerId)
      .where(sql`${table.resolvedByManagerId} IS NOT NULL`),
  ]
);
