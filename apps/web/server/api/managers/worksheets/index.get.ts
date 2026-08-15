import { listWorksheets } from "@kidthink/db";
import { defineEventHandler, getQuery } from "h3";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

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
  const limit = query.limit ? Number(query.limit) : 50;
  const offset = query.offset ? Number(query.offset) : 0;

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
