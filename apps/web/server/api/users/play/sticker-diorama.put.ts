import { getOwnerDb } from "@mindkid/db";
import { StickerDioramaPutSchema } from "@mindkid/shared";
import { saveStickerDiorama } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

/** Lưu bố cục bày sticker trên một bức tranh chủ đề — `sticker-diorama.md` §8. */
export default defineApiRoute({
  auth: "user",
  body: StickerDioramaPutSchema,
  maxBodyBytes: 16 * 1024,
  async handler({ event, auth, body }) {
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(
      event,
      db,
      Number(auth.user_id)
    );
    return await saveStickerDiorama(db, child.id, {
      theme_code: body.theme_code,
      placements: body.placements.map((item) => ({
        emoji: item.emoji,
        instance_index: item.instance_index,
        norm_x: item.norm_x,
        norm_y: item.norm_y,
        scale: item.scale ?? 1,
      })),
    });
  },
});
