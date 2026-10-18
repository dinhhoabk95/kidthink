import { getOwnerDb } from "@mindkid/db";
import { defineEventHandler, getQuery } from "h3";
import { searchGameLevels } from "#server/services/index.js";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireManagerSession(event);

  const db = getOwnerDb();
  const query = getQuery(event);
  const skillCode =
    typeof query.skill_code === "string" ? query.skill_code.trim() : undefined;
  const result = await searchGameLevels(
    db,
    skillCode ? { ...query, skill_code: skillCode, skill: skillCode } : query,
    { role: "manager" }
  );

  return {
    items: result.items,
    next_cursor: result.next_cursor,
  };
});
