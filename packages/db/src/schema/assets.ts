import {
  bigint,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { managers } from "./identity.ts";

/**
 * Ảnh và asset tham chiếu của nội dung. Tách khỏi `content.ts` khi file đó chạm
 * trần 400 dòng của `BR-DM-11`; ranh giới theo domain — `content.ts` giữ lesson /
 * activity / worksheet, file này giữ tài sản nhị phân mà chúng trỏ tới.
 */

export const imageOwnerTypeEnum = pgEnum("image_owner_type", [
  "game_level",
  "lesson",
  "activity",
  "worksheet",
  "payment_order",
  "payment_proof",
  "custom_game",
  "user_avatar",
  "manager_avatar",
]);

export const imageVisibilityEnum = pgEnum("image_visibility", [
  "public",
  "private",
]);

export const imageStatusEnum = pgEnum("image_status", [
  "active",
  "orphan",
  "archived",
]);

export const contentImages = pgTable(
  "content_images",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    ownerType: imageOwnerTypeEnum("owner_type").notNull(),
    ownerId: bigint("owner_id", { mode: "number" }).notNull(),
    storagePath: text("storage_path").notNull(),
    thumbPath: text("thumb_path"),
    width: integer("width"),
    height: integer("height"),
    bytes: integer("bytes"),
    mime: varchar("mime", { length: 50 }),
    altText: text("alt_text"),
    visibility: imageVisibilityEnum("visibility").notNull().default("public"),
    status: imageStatusEnum("status").notNull().default("active"),
    uploadedByManagerId: bigint("uploaded_by_manager_id", {
      mode: "number",
    }).references(() => managers.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Cặp đa hình: index, không khoá ngoại (BR-DM-04). Không UNIQUE — một owner
    // có nhiều ảnh.
    index("idx_content_images_owner").on(table.ownerType, table.ownerId),
  ]
);

export const contentAssetRefs = pgTable(
  "content_asset_refs",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    entityType: varchar("entity_type", { length: 50 }).notNull(),
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    assetKind: varchar("asset_kind", { length: 50 }).notNull(),
    assetRef: text("asset_ref").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_content_asset_refs_asset_ref").on(table.assetRef),
    // UNIQUE đã mở đầu bằng (entity_type, entity_id) nên cặp đa hình có index.
    unique("content_asset_refs_unique").on(
      table.entityType,
      table.entityId,
      table.assetKind,
      table.assetRef
    ),
  ]
);

export type ContentImage = typeof contentImages.$inferSelect;
export type NewContentImage = typeof contentImages.$inferInsert;
export type ContentAssetRef = typeof contentAssetRefs.$inferSelect;
export type NewContentAssetRef = typeof contentAssetRefs.$inferInsert;
