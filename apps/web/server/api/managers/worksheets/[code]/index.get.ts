import { ValidationError } from "@mindkid/errors/common";
import { WorksheetNotFoundError } from "@mindkid/errors/content";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { getWorksheetByCode } from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  if (!code) {
    throw new ValidationError("Worksheet code is required");
  }

  const query = getQuery(event);
  const version = query.version ? Number(query.version) : undefined;

  const ws = await getWorksheetByCode(code, version);
  if (!ws) {
    throw new WorksheetNotFoundError(`Worksheet with code ${code} not found`);
  }

  return ws;
});
