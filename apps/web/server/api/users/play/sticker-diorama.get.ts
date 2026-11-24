import { NoActiveChildError } from "@mindkid/errors/child";
import { StickerDioramaQuerySchema } from "@mindkid/shared";
import { deleteCookie, getCookie } from "h3";
import { getChildStickerDioramaExperience } from "#server/services/play-experience-service";
import { defineApiRoute } from "#server/utils/define-api-route";

/** Đọc bố cục bày sticker bối cảnh của trẻ — `sticker-diorama.md` §8. */
export default defineApiRoute({
  auth: "user",
  query: StickerDioramaQuerySchema,
  async handler({ event, auth, query }) {
    const candidateUuid = getCookie(event, "active_child_id");
    try {
      return await getChildStickerDioramaExperience(
        Number(auth.user_id),
        candidateUuid,
        query.theme
      );
    } catch (err) {
      if (err instanceof NoActiveChildError && candidateUuid) {
        deleteCookie(event, "active_child_id", { path: "/" });
      }
      throw err;
    }
  },
});
