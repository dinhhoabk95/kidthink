import {
  bigint,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { contentLifecycleStatusEnum } from "./game.ts";
import { managerRoleEnum, managers } from "./identity.ts";

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
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "queued",
  "dispatched",
  "failed",
]);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    actorType: actorTypeEnum("actor_type").notNull(),
    actorId: bigint("actor_id", { mode: "number" }).notNull(),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: varchar("entity_id", { length: 100 }).notNull(),
    changes: jsonb("changes"),
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
  recipientType: recipientTypeEnum("recipient_type").notNull(),
  recipientId: bigint("recipient_id", { mode: "number" }).notNull(),
  channel: notificationChannelEnum("channel").notNull(),
  templateCode: varchar("template_code", { length: 60 }).notNull(),
  payload: jsonb("payload"),
  status: notificationStatusEnum("status").notNull().default("queued"),
  dispatchedAt: timestamp("dispatched_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
