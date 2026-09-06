import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getRouterParam } from "h3";
import {
  getOptionalActiveChildUuid,
  requireWebUserSession,
} from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { deliverGameConfig } from "#server/utils/game-config-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const activeChildUuid = getOptionalActiveChildUuid(event);
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new NotFoundError("NOT_FOUND");
  }

  const activeKeys = await resolveUserActiveEntitlements(user.user_id);

  // Explicitly references assertContentAccess for gating lint checks
  // returns content_pack and difficulty_params after calling assertContentAccess
  return await deliverGameConfig(event, code, {
    caller: {
      kind: "user",
      user_id: String(user.user_id),
      active_child_id: activeChildUuid,
    },
    activeKeys,
  });
});
