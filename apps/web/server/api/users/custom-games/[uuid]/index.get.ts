import { getCustomGameByUuid } from "@mindkid/db";
import { defineEventHandler, getRouterParam } from "h3";
import { requireWebUserSession } from "../../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const uuid = getRouterParam(event, "uuid") || "";

  const customGame = await getCustomGameByUuid(userId, uuid);
  return customGame;
});
