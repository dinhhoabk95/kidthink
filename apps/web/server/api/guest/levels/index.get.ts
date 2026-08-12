import { getOwnerDb, searchGameLevels } from "@kidthink/db";
import { defineEventHandler, getQuery, setHeader } from "h3";

export default defineEventHandler(async (event) => {
  const db = getOwnerDb();
  const query = getQuery(event);
  const result = await searchGameLevels(db, query, { role: "guest" });

  if (result.no_store) {
    setHeader(event, "Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return {
    items: result.items,
    next_cursor: result.next_cursor,
  };
});
