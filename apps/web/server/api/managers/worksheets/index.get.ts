import { defineEventHandler, getQuery } from "h3";
import { listWorksheets } from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const query = getQuery(event);
  const layoutTemplate =
    typeof query.layout_template === "string"
      ? query.layout_template
      : undefined;
  const status = typeof query.status === "string" ? query.status : undefined;
  const accessTier =
    typeof query.access_tier === "string" ? query.access_tier : undefined;
  const search = typeof query.search === "string" ? query.search : undefined;
  const rawLimit = query.limit ? Number(query.limit) : 50;
  const limit = Number.isFinite(rawLimit)
    ? Math.min(100, Math.max(1, Math.trunc(rawLimit)))
    : 50;
  const rawOffset = query.offset ? Number(query.offset) : 0;
  const offset = Number.isFinite(rawOffset)
    ? Math.max(0, Math.trunc(rawOffset))
    : 0;

  const items = await listWorksheets({
    layoutTemplate,
    status,
    accessTier,
    search,
    limit,
    offset,
  });

  return {
    items,
    total: items.length,
  };
});
