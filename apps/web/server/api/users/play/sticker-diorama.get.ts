import { getOwnerDb } from "@mindkid/db";
import { StickerDioramaQuerySchema } from "@mindkid/shared";
import { getStickerDiorama } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

/** Đọc bố cục bày sticker bối cảnh của trẻ — `sticker-diorama.md` §8. */
export default defineApiRoute({
  auth: "user",
  query: StickerDioramaQuerySchema,
  async handler({ event, auth, query }) {
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(
      event,
      db,
      Number(auth.user_id)
    );
    return await getStickerDiorama(db, {
      childId: child.id,
      themeCode: query.theme,
    });
  },
});
