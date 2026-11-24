import { NoActiveChildError } from "@mindkid/errors/child";
import { isValidThemeCode } from "@mindkid/shared";
import { deleteCookie, getCookie } from "h3";
import { z } from "zod";
import { getChildStickerAlbumExperience } from "#server/services/play-experience-service";
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
    const candidateUuid = getCookie(event, "active_child_id");
    try {
      return await getChildStickerAlbumExperience(
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
