import {
  integer,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";
import { childProfiles } from "./child.ts";
import { idPk, timestamps } from "./columns.ts";

export const childStickerPlacements = sqliteTable(
  "child_sticker_placements",
  {
    id: idPk(),
    childProfileId: integer("child_profile_id")
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    themeCode: text("theme_code").notNull(),
    emoji: text("emoji").notNull(),
    instanceIndex: integer("instance_index").notNull(),
    normX: real("norm_x").notNull(),
    normY: real("norm_y").notNull(),
    scale: real("scale").notNull().default(1),
    ...timestamps(),
  },
  (table) => [
    unique("uq_child_sticker_placements_item").on(
      table.childProfileId,
      table.themeCode,
      table.emoji,
      table.instanceIndex
    ),
  ]
);

export const childMascotGear = sqliteTable("child_mascot_gear", {
  childProfileId: integer("child_profile_id")
    .primaryKey()
    .references(() => childProfiles.id, { onDelete: "cascade" }),
  equippedGearCode: text("equipped_gear_code"),
  ...timestamps(),
});
