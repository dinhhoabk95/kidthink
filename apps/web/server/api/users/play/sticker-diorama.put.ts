import { NoActiveChildError } from "@mindkid/errors/child";
import { StickerDioramaPutSchema } from "@mindkid/shared";
import { deleteCookie, getCookie } from "h3";
import { saveChildStickerDioramaExperience } from "#server/services/play-experience-service";
import { defineApiRoute } from "#server/utils/define-api-route";

/** Lưu bố cục bày sticker trên một bức tranh chủ đề — `sticker-diorama.md` §8. */
export default defineApiRoute({
  auth: "user",
  body: StickerDioramaPutSchema,
  maxBodyBytes: 16 * 1024,
  async handler({ event, auth, body }) {
    const candidateUuid = getCookie(event, "active_child_id");
    try {
      return await saveChildStickerDioramaExperience(
        Number(auth.user_id),
        candidateUuid,
        body
      );
    } catch (err) {
      if (err instanceof NoActiveChildError && candidateUuid) {
        deleteCookie(event, "active_child_id", { path: "/" });
      }
      throw err;
    }
  },
});
