import { getOwnerDb } from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { isValidThemeCode } from "@mindkid/shared";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { loadStickerAlbum } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { requireWebUserSession } from "#server/utils/auth-runtime";

const QuerySchema = z.object({
  theme: z.string().refine(isValidThemeCode).optional(),
});

/** Album sticker của trẻ đang hoạt động — `sticker-album.md` §8, `BR-STK-07`. */
export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const query = QuerySchema.safeParse(getQuery(event));
  if (!query.success) {
    throw ValidationError.field(
      "theme",
      "theme phải là một mã chủ đề trong registry."
    );
  }
  const db = getOwnerDb();
  const child = await requireOwnedActiveChild(event, db, Number(user.user_id));

  return loadStickerAlbum(db, {
    childId: child.id,
    themeCode: query.data.theme,
  });
});
