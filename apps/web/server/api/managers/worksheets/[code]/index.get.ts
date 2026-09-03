import { createError, defineEventHandler, getQuery, getRouterParam } from "h3";
import { getWorksheetByCode } from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: "CODE_REQUIRED",
      message: "Worksheet code is required",
    });
  }

  const query = getQuery(event);
  const version = query.version ? Number(query.version) : undefined;

  const ws = await getWorksheetByCode(code, version);
  if (!ws) {
    throw createError({
      statusCode: 404,
      statusMessage: "WORKSHEET_NOT_FOUND",
      message: `Worksheet with code ${code} not found`,
    });
  }

  return ws;
});
