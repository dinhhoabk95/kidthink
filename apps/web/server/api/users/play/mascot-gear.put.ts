import { getOwnerDb } from "@mindkid/db";
import { MascotGearPutSchema } from "@mindkid/shared";
import { updateChildMascotGear } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";

/** Đội hoặc tháo phụ kiện kỷ niệm Gấu Con — `mascot-playroom.md` §8. */
export default defineApiRoute({
  auth: "user",
  body: MascotGearPutSchema,
  maxBodyBytes: 16 * 1024,
  async handler({ event, auth, body }) {
    const db = getOwnerDb();
    const child = await requireOwnedActiveChild(
      event,
      db,
      Number(auth.user_id)
    );
    return await updateChildMascotGear(db, child.id, body);
  },
});
