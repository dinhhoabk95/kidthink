import { getOwnerDb, searchLessons } from "@mindkid/db";
import { defineEventHandler, getQuery } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const db = getOwnerDb();
  const query = getQuery(event);
  const result = await searchLessons(db, query, { role: "manager" });

  return {
    items: result.items,
    next_cursor: result.next_cursor,
  };
});
