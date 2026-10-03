import { getOwnerDb } from "@mindkid/db";
import { isValidThemeCode } from "@mindkid/shared";
import { z } from "zod";
import { loadStickerAlbum } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

const QuerySchema = z.object({
  theme: z
    .string()
    .refine(isValidThemeCode, "theme phải là một mã chủ đề trong registry.")
    .optional(),
});

/** Album sticker của trẻ đang hoạt động — `sticker-album.md` §8, `BR-STK-07`. */
export default defineApiRoute({
  auth: "user",
  query: QuerySchema,
  async handler({ event, auth, query }) {
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(
      event,
      db,
      Number(auth.user_id)
    );

    return await loadStickerAlbum(db, {
      childId: child.id,
      themeCode: query.theme,
    });
  },
});
