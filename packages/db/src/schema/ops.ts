import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  type ActorType,
  NOTIFICATION_ENDPOINT_STATUS,
  NOTIFICATION_STATUS,
  type NotificationChannel,
  type NotificationEndpointProvider,
  type NotificationEndpointStatus,
  type NotificationStatus,
  type RecipientType,
} from "#src/constants/billing-ops-enums";
import type { JsonRecord } from "#src/constants/json";
import {
  idPk,
  insertOnlyTimestamps,
  timestampMs,
  timestamps,
  uuidCol,
} from "./columns.ts";
import { users } from "./identity.ts";

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    actorType: integer("actor_type").$type<ActorType>().notNull(),
    actorId: integer("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    beforeData: text("before_data", { mode: "json" }).$type<JsonRecord>(),
    afterData: text("after_data", { mode: "json" }).$type<JsonRecord>(),
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

export const notifications = sqliteTable(
  "notifications",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    recipientType: integer("recipient_type").$type<RecipientType>().notNull(),
    recipientId: integer("recipient_id").notNull(),
    templateCode: text("template_code").notNull(),
    payload: text("payload", { mode: "json" }).$type<JsonRecord>(),
    ...timestamps(),
  },
  (table) => [
    index("idx_notifications_recipient").on(
      table.recipientType,
      table.recipientId,
      table.createdAt,
      table.id
    ),
  ]
);

export const notificationDeliveries = sqliteTable(
  "notification_deliveries",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    notificationId: integer("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    channel: integer("channel").$type<NotificationChannel>().notNull(),
    status: integer("status")
      .$type<NotificationStatus>()
      .notNull()
      .default(NOTIFICATION_STATUS.QUEUED),
    suppressedReason: text("suppressed_reason"),
    providerMessageId: text("provider_message_id"),
    dispatchedAt: timestampMs("dispatched_at"),
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
      .where(sql.raw(`"status" = ${NOTIFICATION_STATUS.QUEUED}`)),
  ]
);

export const notificationReads = sqliteTable("notification_reads", {
  notificationId: integer("notification_id")
    .primaryKey()
    .references(() => notifications.id, { onDelete: "cascade" }),
  readAt: timestampMs("read_at").notNull(),
  ...timestamps(),
});

export const notificationEndpoints = sqliteTable(
  "notification_endpoints",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: integer("provider")
      .$type<NotificationEndpointProvider>()
      .notNull(),
    clientInstallationId: text("client_installation_id").notNull(),
    tokenEncrypted: text("token_encrypted").notNull(),
    tokenFingerprint: text("token_fingerprint").notNull().unique(),
    status: integer("status")
      .$type<NotificationEndpointStatus>()
      .notNull()
      .default(NOTIFICATION_ENDPOINT_STATUS.ACTIVE),
    lastSeenAt: timestampMs("last_seen_at"),
    invalidatedAt: timestampMs("invalidated_at"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_notification_endpoints_user_installation").on(
      table.userId,
      table.clientInstallationId
    ),
  ]
);
