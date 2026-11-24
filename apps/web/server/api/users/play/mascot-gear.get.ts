import { NoActiveChildError } from "@mindkid/errors/child";
import { deleteCookie, getCookie } from "h3";
import { getChildMascotGearExperience } from "#server/services/play-experience-service";
import { defineApiRoute } from "#server/utils/define-api-route";

/** Đọc phụ kiện kỷ niệm Gấu Con của trẻ đang hoạt động — `mascot-playroom.md` §8. */
export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const candidateUuid = getCookie(event, "active_child_id");
    try {
      return await getChildMascotGearExperience(
        Number(auth.user_id),
        candidateUuid
      );
    } catch (err) {
      if (err instanceof NoActiveChildError && candidateUuid) {
        deleteCookie(event, "active_child_id", { path: "/" });
      }
      throw err;
    }
  },
});
