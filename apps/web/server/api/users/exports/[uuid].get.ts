import { ExportNotFoundError } from "@mindkid/errors/account";
import { getExportJobByUuid } from "@mindkid/export";
import { defineEventHandler, getRouterParam } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const uuid = getRouterParam(event, "uuid");
  if (!uuid) {
    throw new ExportNotFoundError();
  }

  const userId = Number(user.user_id);
  const job = await getExportJobByUuid(userId, uuid);

  return job;
});
