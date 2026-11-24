import { NoActiveChildError } from "@mindkid/errors/child";
import { deleteCookie, getCookie } from "h3";
import { getChildAdventureExperience } from "#server/services/play-experience-service";
import { getOrSetGuestDeviceId } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const candidateUuid = getCookie(event, "active_child_id");
    try {
      return await getChildAdventureExperience(
        Number(auth.user_id),
        candidateUuid,
        () => getOrSetGuestDeviceId(event)
      );
    } catch (err) {
      if (err instanceof NoActiveChildError && candidateUuid) {
        deleteCookie(event, "active_child_id", { path: "/" });
      }
      throw err;
    }
  },
});
