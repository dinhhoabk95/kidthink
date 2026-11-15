import { getOwnerDb } from "@mindkid/db";
import { getChildMascotGear } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

/** Đọc phụ kiện kỷ niệm Gấu Con của trẻ đang hoạt động — `mascot-playroom.md` §8. */
export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(
      event,
      db,
      Number(auth.user_id)
    );
    return await getChildMascotGear(db, child.id);
  },
});
