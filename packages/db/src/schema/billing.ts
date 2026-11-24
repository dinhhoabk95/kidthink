import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  ENTITLEMENT_STATUS,
  type EntitlementGroup,
  type EntitlementSource,
  type EntitlementStatus,
  PACKAGE_STATUS,
  PAYMENT_ORDER_STATUS,
  type PackageStatus,
  type PaymentOrderStatus,
  RECURRING_SUBSCRIPTION_STATUS,
  type RecurringSubscriptionStatus,
} from "#src/constants/billing-ops-enums";
import type { JsonRecord, JsonValue } from "#src/constants/json";
import {
  idPk,
  nowTimestampMs,
  timestampMs,
  timestamps,
  uuidCol,
} from "./columns.ts";
import { managers, users } from "./identity.ts";

export const entitlementKeys = sqliteTable("entitlement_keys", {
  key: text("key").primaryKey(),
  group: integer("group").$type<EntitlementGroup>().notNull(),
  label: text("label").notNull(),
  description: text("description"),
  isMvp: integer("is_mvp", { mode: "boolean" }).notNull().default(true),
  ...timestamps(),
});

export const packages = sqliteTable("packages", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  audience: text("audience").notNull(),
  description: text("description"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  isFeatured: integer("is_featured", { mode: "boolean" })
    .notNull()
    .default(false),
  status: integer("status")
    .$type<PackageStatus>()
    .notNull()
    .default(PACKAGE_STATUS.ACTIVE),
  offers: text("offers", { mode: "json" }).$type<JsonValue>().notNull(),
  quotas: text("quotas", { mode: "json" }).$type<JsonRecord>(),
  ...timestamps(),
});

export const entitlements = sqliteTable(
  "entitlements",
  {
    id: idPk(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entitlementKey: text("entitlement_key")
      .notNull()
      .references(() => entitlementKeys.key, { onDelete: "restrict" }),
    source: integer("source").$type<EntitlementSource>().notNull(),
    sourceRef: text("source_ref"),
    status: integer("status")
      .$type<EntitlementStatus>()
      .notNull()
      .default(ENTITLEMENT_STATUS.PENDING),
    grantedAt: nowTimestampMs("granted_at"),
    expiresAt: timestampMs("expires_at"),
    grantedByManagerId: integer("granted_by_manager_id").references(
      () => managers.id,
      { onDelete: "set null" }
    ),
    grantReason: text("grant_reason"),
    ...timestamps(),
  },
  (table) => [
    index("idx_entitlements_user_status_expires").on(
      table.userId,
      table.status,
      table.expiresAt
    ),
    index("idx_entitlements_status_expires_at").on(
      table.status,
      table.expiresAt
    ),
    index("idx_entitlements_entitlement_key").on(table.entitlementKey),
    index("idx_entitlements_granted_by_manager")
      .on(table.grantedByManagerId)
      .where(sql`${table.grantedByManagerId} IS NOT NULL`),
    uniqueIndex("uq_entitlements_user_key_live")
      .on(table.userId, table.entitlementKey)
      .where(sql`${table.status} IN (2, 3, 4)`),
  ]
);

export const paymentOrders = sqliteTable(
  "payment_orders",
  {
    id: idPk(),
    uuid: uuidCol("uuid").unique(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    packageCode: text("package_code")
      .notNull()
      .references(() => packages.code, { onDelete: "restrict" }),
    offerCode: text("offer_code").notNull(),
    amountVnd: integer("amount_vnd").notNull(),
    currency: text("currency").notNull().default("VND"),
    status: integer("status")
      .$type<PaymentOrderStatus>()
      .notNull()
      .default(PAYMENT_ORDER_STATUS.PENDING),
    transferNote: text("transfer_note").unique(),
    bankTxnRef: text("bank_txn_ref"),
    proofPath: text("proof_path"),
    submittedAt: timestampMs("submitted_at"),
    reviewedAt: timestampMs("reviewed_at"),
    reviewedByManagerId: integer("reviewed_by_manager_id").references(
      () => managers.id,
      { onDelete: "set null" }
    ),
    adminNote: text("admin_note"),
    expiresAt: timestampMs("expires_at"),
    ...timestamps(),
  },
  (table) => [
    index("idx_payment_orders_bank_txn_ref")
      .on(table.bankTxnRef)
      .where(sql`${table.bankTxnRef} IS NOT NULL`),
    index("idx_payment_orders_status_submitted_at").on(
      table.status,
      table.submittedAt
    ),
    index("idx_payment_orders_user_id_status").on(table.userId, table.status),
    index("idx_payment_orders_status_expires_at").on(
      table.status,
      table.expiresAt
    ),
    index("idx_payment_orders_package_code").on(table.packageCode),
    index("idx_payment_orders_reviewed_by_manager")
      .on(table.reviewedByManagerId)
      .where(sql`${table.reviewedByManagerId} IS NOT NULL`),
    uniqueIndex("uq_payment_orders_user_pkg_open")
      .on(table.userId, table.packageCode)
      .where(sql`${table.status} IN (1, 2, 3, 4)`),
  ]
);

export const quotaUsage = sqliteTable(
  "quota_usage",
  {
    id: idPk(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quotaKey: text("quota_key").notNull(),
    periodStart: timestampMs("period_start").notNull(),
    used: integer("used").notNull().default(0),
    limitSnapshot: integer("limit_snapshot").notNull(),
    periodEnd: timestampMs("period_end").notNull(),
    ...timestamps(),
  },
  (table) => [
    unique("quota_usage_user_key_period_unique").on(
      table.userId,
      table.quotaKey,
      table.periodStart
    ),
  ]
);

export const paymentTransactions = sqliteTable(
  "payment_transactions",
  {
    id: idPk(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    orderId: integer("order_id").references(() => paymentOrders.id, {
      onDelete: "set null",
    }),
    orderUuid: text("order_uuid").notNull(),
    amountVnd: integer("amount_vnd").notNull(),
    status: text("status").notNull(),
    rawPayload: text("raw_payload", { mode: "json" }).$type<JsonRecord>(),
    reconciledAt: timestampMs("reconciled_at"),
    ...timestamps(),
  },
  (table) => [
    uniqueIndex("idx_payment_transactions_provider_event").on(
      table.provider,
      table.providerEventId
    ),
    index("idx_payment_transactions_order_id")
      .on(table.orderId)
      .where(sql`${table.orderId} IS NOT NULL`),
    index("idx_payment_transactions_order_uuid").on(table.orderUuid),
    index("idx_payment_transactions_created_at").on(table.createdAt),
  ]
);

export const recurringSubscriptions = sqliteTable(
  "recurring_subscriptions",
  {
    id: idPk(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    packageCode: text("package_code")
      .notNull()
      .references(() => packages.code, { onDelete: "restrict" }),
    offerCode: text("offer_code").notNull(),
    billingPeriod: text("billing_period").notNull(),
    priceVnd: integer("price_vnd").notNull(),
    autoRenew: integer("auto_renew", { mode: "boolean" })
      .notNull()
      .default(false),
    status: integer("status")
      .$type<RecurringSubscriptionStatus>()
      .notNull()
      .default(RECURRING_SUBSCRIPTION_STATUS.ACTIVE),
    currentPeriodStart: timestampMs("current_period_start").notNull(),
    currentPeriodEnd: timestampMs("current_period_end").notNull(),
    nextBillingAt: timestampMs("next_billing_at"),
    dunningAttempts: integer("dunning_attempts").notNull().default(0),
    lastDunningAt: timestampMs("last_dunning_at"),
    consentTermsVersion: text("consent_terms_version").notNull(),
    consentSnapshot: text("consent_snapshot", {
      mode: "json",
    }).$type<JsonRecord>(),
    cancelledAt: timestampMs("cancelled_at"),
    cancelledBy: text("cancelled_by"),
    cancelReason: text("cancel_reason"),
    cancelNote: text("cancel_note"),
    ...timestamps(),
  },
  (table) => [
    index("idx_recurring_subscriptions_user_status").on(
      table.userId,
      table.status
    ),
    index("idx_recurring_subscriptions_status_next_billing_at").on(
      table.status,
      table.nextBillingAt
    ),
    index("idx_recurring_subscriptions_package_code").on(table.packageCode),
  ]
);
