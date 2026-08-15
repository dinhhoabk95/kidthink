import { getOwnerDb, searchLessons } from "@kidthink/db";
import { defineEventHandler, getQuery } from "h3";
import { requireManagerSession } from "../../../utils/admin-auth-runtime.js";

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
