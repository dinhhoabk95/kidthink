import { getOwnerDb } from "@mindkid/db";
import { defineEventHandler, getQuery } from "h3";
import { searchActivities } from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const db = getOwnerDb();
  const query = getQuery(event);
  const result = await searchActivities(db, query, { role: "manager" });

  return {
    items: result.items,
    next_cursor: result.next_cursor,
  };
});
