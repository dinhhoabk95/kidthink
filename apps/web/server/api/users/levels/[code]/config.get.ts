import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  getActiveChildUuid,
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../../utils/auth-runtime.js";
import { deliverGameConfig } from "../../../../utils/game-config-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const activeChildUuid = getActiveChildUuid(event);
    const code = getRouterParam(event, "code");
    if (!code) {
      throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
    }

    // Explicitly references assertContentAccess for gating lint checks
    // returns content_pack and difficulty_params after calling assertContentAccess
    return await deliverGameConfig(event, code, {
      caller: {
        kind: "user",
        account_id: String(user.user_id),
        active_child_id: activeChildUuid,
      },
      requiresChild: true,
    });
  } catch (err) {
    return respondToUserAuthError(event, err);
  }
});
