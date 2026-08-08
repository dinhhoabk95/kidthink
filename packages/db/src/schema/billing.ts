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
  "pending_proof",
  "submitted",
  "approved",
  "rejected",
  "expired",
  "cancelled",
]);

export const entitlementKeys = pgTable("entitlement_keys", {
  key: varchar("key", { length: 60 }).primaryKey(),
  group: entitlementGroupEnum("group").notNull(),
  labelVi: varchar("label_vi", { length: 100 }).notNull(),
  descriptionVi: text("description_vi"),
  isMvp: boolean("is_mvp").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const packages = pgTable("packages", {
  code: varchar("code", { length: 40 }).primaryKey(),
  nameVi: varchar("name_vi", { length: 100 }).notNull(),
  audienceVi: varchar("audience_vi", { length: 100 }).notNull(),
  descriptionVi: text("description_vi"),
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

export const paymentOrders = pgTable("payment_orders", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
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
  status: paymentOrderStatusEnum("status").notNull().default("pending_proof"),
  transferNote: varchar("transfer_note", { length: 100 }),
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
});

export const quotaUsage = pgTable(
  "quota_usage",
  {
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
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.quotaKey, table.periodStart] }),
  ]
);
