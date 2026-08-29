import { gameLevels, getOwnerDb } from "@mindkid/db";
import { CONTENT_THEMES } from "@mindkid/shared";
import { count, eq } from "drizzle-orm";
import { defineEventHandler, setHeader } from "h3";

export default defineEventHandler(async (event) => {
  setHeader(event, "Cache-Control", "public, max-age=3600");

  const db = getOwnerDb();
  const rows = await db
    .select({
      themeId: gameLevels.themeId,
      levelCount: count(),
    })
    .from(gameLevels)
    .where(eq(gameLevels.status, "published"))
    .groupBy(gameLevels.themeId);

  const countMap = new Map<string, number>();
  for (const r of rows) {
    if (r.themeId) {
      countMap.set(r.themeId, Number(r.levelCount));
    }
  }

  const themes = CONTENT_THEMES.filter(
    (t) => (countMap.get(t.code) ?? 0) > 0
  ).map((t) => ({
    code: t.code,
    label_vi: t.label_vi,
    icon_emoji_ref: t.icon_emoji_ref,
    level_count: countMap.get(t.code) ?? 0,
  }));

  return { themes };
});
