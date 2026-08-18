import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { managers, users } from "./identity.ts";

export const entitlementGroupEnum = pgEnum("entitlement_group", [
  "content",
  "account",
  "report",
  "creator",
  "ai",
]);

export const packageStatusEnum = pgEnum("package_status", [
  "active",
  "retired",
]);

export const entitlementSourceEnum = pgEnum("entitlement_source", [
  "package_order",
  "manual_grant",
  "trial",
  "promo",
]);

export const entitlementStatusEnum = pgEnum("entitlement_status", [
  "pending",
  "soft_unlock",
  "active",
  "grace_period",
  "expired",
  "cancelled",
]);

export const paymentOrderStatusEnum = pgEnum("payment_order_status", [
  "draft",
  "pending",
  "pending_proof",
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "expired",
  "cancelled",
]);

export const entitlementKeys = pgTable("entitlement_keys", {
  key: varchar("key", { length: 60 }).primaryKey(),
  group: entitlementGroupEnum("group").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  isMvp: boolean("is_mvp").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const packages = pgTable("packages", {
  code: varchar("code", { length: 40 }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  audience: varchar("audience", { length: 100 }).notNull(),
  description: text("description"),
  isPublic: boolean("is_public").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  status: packageStatusEnum("status").notNull().default("active"),
  offers: jsonb("offers").notNull(),
  quotas: jsonb("quotas"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const packageEntitlements = pgTable(
  "package_entitlements",
  {
    packageCode: varchar("package_code", { length: 40 })
      .notNull()
      .references(() => packages.code, { onDelete: "cascade" }),
    entitlementKey: varchar("entitlement_key", { length: 60 })
      .notNull()
      .references(() => entitlementKeys.key, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.packageCode, table.entitlementKey] }),
  ]
);

export const entitlements = pgTable(
  "entitlements",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entitlementKey: varchar("entitlement_key", { length: 60 })
      .notNull()
      .references(() => entitlementKeys.key),
    source: entitlementSourceEnum("source").notNull(),
    sourceRef: uuid("source_ref"),
    status: entitlementStatusEnum("status").notNull().default("pending"),
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    grantedByManagerId: bigint("granted_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    grantReason: text("grant_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_entitlements_user_status_expires").on(
      table.userId,
      table.status,
      table.expiresAt
    ),
  ]
);

export const paymentOrders = pgTable(
  "payment_orders",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    uuid: uuid("uuid").defaultRandom().notNull().unique(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    packageCode: varchar("package_code", { length: 40 })
      .notNull()
      .references(() => packages.code),
    offerCode: varchar("offer_code", { length: 40 }).notNull(),
    amountVnd: bigint("amount_vnd", { mode: "number" }).notNull(),
    currency: varchar("currency", { length: 3 }).notNull().default("VND"),
    status: paymentOrderStatusEnum("status").notNull().default("pending"),
    transferNote: varchar("transfer_note", { length: 100 }).unique(),
    bankTxnRef: varchar("bank_txn_ref", { length: 100 }),
    proofPath: text("proof_path"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedByManagerId: bigint("reviewed_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    adminNote: text("admin_note"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_payment_orders_transfer_note").on(table.transferNote),
    index("idx_payment_orders_bank_txn_ref").on(table.bankTxnRef),
    index("idx_payment_orders_status_submitted_at").on(
      table.status,
      table.submittedAt
    ),
    index("idx_payment_orders_user_id_status").on(table.userId, table.status),
  ]
);

export const quotaUsage = pgTable(
  "quota_usage",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quotaKey: varchar("quota_key", { length: 60 }).notNull(),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    used: integer("used").notNull().default(0),
    limitSnapshot: integer("limit_snapshot").notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("quota_usage_user_key_period_unique").on(
      table.userId,
      table.quotaKey,
      table.periodStart
    ),
  ]
);

export const recurringSubscriptionStatusEnum = pgEnum(
  "recurring_subscription_status",
  ["active", "past_due", "cancelled", "expired"]
);

export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    provider: varchar("provider", { length: 30 }).notNull(),
    providerEventId: varchar("provider_event_id", { length: 120 })
      .notNull()
      .unique(),
    orderId: bigint("order_id", { mode: "number" }).references(
      () => paymentOrders.id,
      { onDelete: "set null" }
    ),
    orderUuid: uuid("order_uuid").notNull(),
    amountVnd: bigint("amount_vnd", { mode: "number" }).notNull(),
    status: varchar("status", { length: 30 }).notNull(),
    rawPayload: jsonb("raw_payload"),
    reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("idx_payment_transactions_provider_event").on(
      table.provider,
      table.providerEventId
    ),
    index("idx_payment_transactions_order_uuid").on(table.orderUuid),
    index("idx_payment_transactions_created_at").on(table.createdAt),
  ]
);

export const recurringSubscriptions = pgTable(
  "recurring_subscriptions",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    packageCode: varchar("package_code", { length: 40 })
      .notNull()
      .references(() => packages.code),
    offerCode: varchar("offer_code", { length: 40 }).notNull(),
    billingPeriod: varchar("billing_period", { length: 20 }).notNull(),
    priceVnd: bigint("price_vnd", { mode: "number" }).notNull(),
    autoRenew: boolean("auto_renew").notNull().default(true),
    status: recurringSubscriptionStatusEnum("status")
      .notNull()
      .default("active"),
    currentPeriodStart: timestamp("current_period_start", {
      withTimezone: true,
    }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", {
      withTimezone: true,
    }).notNull(),
    nextBillingAt: timestamp("next_billing_at", { withTimezone: true }),
    dunningAttempts: integer("dunning_attempts").notNull().default(0),
    lastDunningAt: timestamp("last_dunning_at", { withTimezone: true }),
    consentTermsVersion: varchar("consent_terms_version", {
      length: 40,
    }).notNull(),
    consentSnapshot: jsonb("consent_snapshot"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: varchar("cancelled_by", { length: 30 }),
    cancelReason: text("cancel_reason"),
    cancelNote: text("cancel_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_recurring_subscriptions_user_status").on(
      table.userId,
      table.status
    ),
    index("idx_recurring_subscriptions_next_billing").on(table.nextBillingAt),
  ]
);
