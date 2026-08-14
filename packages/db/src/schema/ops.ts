import {
  bigint,
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
import { contentLifecycleStatusEnum } from "./game.ts";
import { managerRoleEnum, managers, users } from "./identity.ts";

export const actorTypeEnum = pgEnum("actor_type", [
  "user",
  "manager",
  "system",
]);

export const reviewEntityTypeEnum = pgEnum("review_entity_type", [
  "game_level",
  "lesson",
  "activity",
  "curriculum",
  "worksheet",
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
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
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
  ]
);

export const contentReviewLog = pgTable("content_review_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  entityType: reviewEntityTypeEnum("entity_type").notNull(),
  entityId: bigint("entity_id", { mode: "number" }).notNull(),
  contentVersion: integer("content_version").notNull(),
  fromStatus: contentLifecycleStatusEnum("from_status").notNull(),
  toStatus: contentLifecycleStatusEnum("to_status").notNull(),
  actorManagerId: bigint("actor_manager_id", {
    mode: "number",
  }).references(() => managers.id),
  actorRole: managerRoleEnum("actor_role"),
  reason: text("reason"),
  checklistSnapshot: jsonb("checklist_snapshot"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contentSeedBatches = pgTable("content_seed_batches", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  batchCode: varchar("batch_code", { length: 60 }).notNull().unique(),
  kind: varchar("kind", { length: 40 }).notNull(),
  gitSha: varchar("git_sha", { length: 40 }),
  prUrl: varchar("pr_url", { length: 255 }),
  approvedByManagerId: bigint("approved_by_manager_id", {
    mode: "number",
  }).references(() => managers.id),
  rowsInserted: integer("rows_inserted").notNull().default(0),
  gateResults: jsonb("gate_results"),
  seededAt: timestamp("seeded_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const backupLog = pgTable("backup_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  backupType: backupTypeEnum("backup_type").notNull(),
  status: backupStatusEnum("status").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  storagePath: text("storage_path"),
  checksum: varchar("checksum", { length: 64 }),
  restoredRows: integer("restored_rows"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notifications = pgTable("notifications", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  uuid: uuid("uuid").defaultRandom().notNull().unique(),
  recipientType: recipientTypeEnum("recipient_type").notNull(),
  recipientId: bigint("recipient_id", { mode: "number" }).notNull(),
  templateCode: varchar("template_code", { length: 60 }).notNull(),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notificationDeliveries = pgTable(
  "notification_deliveries",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_notification_deliveries_active_channel").on(
      table.notificationId,
      table.channel
    ),
  ]
);

export const notificationReads = pgTable("notification_reads", {
  notificationId: bigint("notification_id", { mode: "number" })
    .primaryKey()
    .references(() => notifications.id, { onDelete: "cascade" }),
  readAt: timestamp("read_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notificationEndpoints = pgTable(
  "notification_endpoints",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_notification_endpoints_user_installation").on(
      table.userId,
      table.clientInstallationId
    ),
  ]
);
