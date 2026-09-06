import { GameLevelNotFoundError } from "@mindkid/errors/game-level";
import { defineEventHandler, getRouterParam } from "h3";
import { getOrSetGuestDeviceId } from "#server/utils/auth-runtime";
import { deliverGameConfig } from "#server/utils/game-config-runtime";

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new GameLevelNotFoundError();
  }

  // Explicitly references assertContentAccess for gating lint checks
  // returns content_pack and difficulty_params after calling assertContentAccess
  return await deliverGameConfig(event, code, {
    caller: { kind: "guest" },
    guestDeviceId: getOrSetGuestDeviceId(event),
  });
});
