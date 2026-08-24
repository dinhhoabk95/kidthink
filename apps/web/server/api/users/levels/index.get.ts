import { getOwnerDb, searchGameLevels } from "@mindkid/db";
import { defineEventHandler, getQuery, setHeader } from "h3";
import { requireWebUserSession } from "#server/utils/auth-runtime";

export default defineEventHandler(async (event) => {
  let userPackage: string | undefined;
  try {
    const session = await requireWebUserSession(event);
    if (session) {
      userPackage = (session as { packageCode?: string }).packageCode;
    }
  } catch {
    // Unauthenticated user searches with guest package level
  }

  const db = getOwnerDb();
  const query = getQuery(event);
  const result = await searchGameLevels(db, query, {
    role: "user",
    userPackage,
  });

  if (result.no_store) {
    setHeader(event, "Cache-Control", "no-store, no-cache, must-revalidate");
  }

  return {
    items: result.items,
    next_cursor: result.next_cursor,
  };
});
