import { getOwnerDb } from "@mindkid/db";
import { allowedTiers } from "@mindkid/shared";
import { getDailyAdventure } from "#server/services/index.js";
import { requireOwnedActiveChild } from "#server/utils/active-child-runtime";
import { getOrSetGuestDeviceId } from "#server/utils/auth-runtime";
import { defineApiRoute } from "#server/utils/define-api-route";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

/** Chuyến phiêu lưu một chạm hợp ZPD — `daily-adventure-flow.md` §8. */
export default defineApiRoute({
  auth: "user",
  async handler({ event, auth }) {
    const db = getOwnerDb();
    const userId = Number(auth.user_id);
    const [child, activeKeys] = await Promise.all([
      requireOwnedActiveChild(event, db, userId),
      resolveUserActiveEntitlements(userId),
    ]);

    const userAllowedTiers = await allowedTiers(
      {
        kind: "user",
        user_id: String(userId),
        active_child_id: String(child.id),
      },
      activeKeys
    );

    return await getDailyAdventure(db, {
      userId,
      childId: child.id,
      childUuid: child.uuid,
      childDisplayName: child.displayName,
      allowedTiers: userAllowedTiers,
      guestDeviceId: getOrSetGuestDeviceId(event),
    });
  },
});
