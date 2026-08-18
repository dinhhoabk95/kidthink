import { getOwnerDb, getUserCollections } from "@mindkid/db";
import { defineEventHandler } from "h3";
import { requireWebUserSession } from "../../../utils/auth-runtime.ts";

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const db = getOwnerDb();

  const collections = await getUserCollections(db, userId);

  return {
    collections,
    total: collections.length,
    limit: 20,
  };
});
