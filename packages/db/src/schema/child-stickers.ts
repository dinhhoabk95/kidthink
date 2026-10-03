import {
  bigint,
  index,
  pgTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { childProfiles } from "./child.ts";
import { childLessonPlays } from "./child-lesson-plays.ts";

/**
 * Sticker trẻ nhận khi đóng một lượt học (`sticker-album.md` §7.1).
 *
 * Chỉ INSERT (`BR-STK-02`): `emoji` và `label` được chụp lúc trao để đổi danh
 * mục không đổi sticker đã có; xoá lượt học thì `child_lesson_play_id` thành
 * `null` thay vì xoá sticker.
 */
export const childStickers = pgTable(
  "child_stickers",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    childProfileId: bigint("child_profile_id", { mode: "number" })
      .notNull()
      .references(() => childProfiles.id, { onDelete: "cascade" }),
    childLessonPlayId: bigint("child_lesson_play_id", {
      mode: "number",
    }).references(() => childLessonPlays.id, { onDelete: "set null" }),
    themeCode: varchar("theme_code", { length: 30 }).notNull(),
    emoji: varchar("emoji", { length: 16 }).notNull(),
    label: varchar("label", { length: 100 }).notNull(),
    awardedAt: timestamp("awarded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Một sticker cho mỗi lượt học — `BR-STK-01`.
    unique("uq_child_stickers_play").on(
      table.childProfileId,
      table.childLessonPlayId
    ),
    index("idx_child_stickers_child").on(table.childProfileId),
  ]
);
