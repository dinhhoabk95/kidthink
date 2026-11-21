import {
  bigint,
  doublePrecision,
  pgTable,
  smallint,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { idPk, timestamps } from "./columns.ts";

/**
 * Vị trí bày sticker trên bức tranh bối cảnh chủ đề (`sticker-diorama.md` §7.1).
 *
 * Lưu tách biệt hoàn toàn với `child_stickers` (`BR-SDM-01`, `BR-STK-02`) để
 * bày hoặc gỡ sticker trên tranh không bao giờ chạm bảng bộ sưu tập gốc.
 */
export const childStickerPlacements = pgTable(
  "child_sticker_placements",
  {
    id: idPk(),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    themeCode: varchar("theme_code", { length: 30 }).notNull(),
    emoji: varchar("emoji", { length: 16 }).notNull(),
    instanceIndex: smallint("instance_index").notNull(),
    normX: doublePrecision("norm_x").notNull(),
    normY: doublePrecision("norm_y").notNull(),
    scale: doublePrecision("scale").notNull().default(1),
    ...timestamps(),
  },
  (table) => [
    // UNIQUE (child_profile_id, theme_code, emoji, instance_index) đã phủ
    // tiền tố (child_profile_id, theme_code).
    unique("uq_child_sticker_placements_item").on(
      table.childProfileId,
      table.themeCode,
      table.emoji,
      table.instanceIndex
    ),
  ]
);

/**
 * Phụ kiện kỷ niệm Gấu Con đang đội của từng hồ sơ trẻ (`mascot-playroom.md` §7.1).
 *
 * Tách khỏi `child_profiles` để giữ bất biến danh sách trường đóng `BR-CDC-01`
 * (`BR-MPR-01`).
 */
export const childMascotGear = pgTable("child_mascot_gear", {
  childProfileId: bigint("child_profile_id", { mode: "number" })
    .primaryKey()
    .references(() => childProfiles.id, { onDelete: "cascade" }),
  equippedGearCode: varchar("equipped_gear_code", { length: 40 }),
  ...timestamps(),
});
