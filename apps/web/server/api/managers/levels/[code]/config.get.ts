import { NotFoundError } from "@mindkid/errors/common";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { z } from "zod";
import { getManagerLevelPreviewConfig } from "#server/services/catalog-service";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

const LevelConfigQuerySchema = z.object({
  version: z.union([z.string(), z.number()]).optional(),
});

export default defineEventHandler(async (event) => {
  const manager = await requireManagerSession(event);
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new NotFoundError("NOT_FOUND");
  }

  const parsedQuery = LevelConfigQuerySchema.safeParse(getQuery(event));
  const rawParam = parsedQuery.success ? parsedQuery.data.version : undefined;

  let version: number | undefined;
  if (rawParam !== undefined && rawParam !== null) {
    const num = Number(rawParam);
    if (Number.isInteger(num) && num > 0) {
      version = num;
    }
  }

  return await getManagerLevelPreviewConfig({
    event,
    code,
    version,
    managerId: manager.manager_id,
    managerRole: manager.role,
  });
});
