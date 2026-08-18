import { listPersonalCurricula } from "@mindkid/db";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "../../../utils/auth-runtime.js";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);

  const list = await listPersonalCurricula({ userId });
  return {
    items: list,
    total: list.length,
  };
});
