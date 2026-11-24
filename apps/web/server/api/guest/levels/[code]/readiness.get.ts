import { GameLevelNotFoundError } from "@mindkid/errors/game-level";
import { defineEventHandler, getRouterParam } from "h3";
import { checkGuestLevelReadiness } from "#server/services/catalog-service";
import { getOrSetGuestDeviceId } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new GameLevelNotFoundError();
  }

  const guestDeviceId = getOrSetGuestDeviceId(event);
  return await checkGuestLevelReadiness({ code, guestDeviceId });
});
