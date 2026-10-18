import { ValidationError } from "@mindkid/errors/common";
import { WorksheetNotFoundError } from "@mindkid/errors/content";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { z } from "zod";
import { getWorksheetByCode } from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const WorksheetVersionQuerySchema = z.object({
  version: z.coerce.number().optional(),
});

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const code = getRouterParam(event, "code");
  if (!code) {
    throw new ValidationError("Worksheet code is required");
  }

  const parsedQuery = WorksheetVersionQuerySchema.safeParse(getQuery(event));
  const version =
    parsedQuery.success && parsedQuery.data.version
      ? Number(parsedQuery.data.version)
      : undefined;

  const ws = await getWorksheetByCode(code, version);
  if (!ws) {
    throw new WorksheetNotFoundError(`Worksheet with code ${code} not found`);
  }

  return ws;
});
