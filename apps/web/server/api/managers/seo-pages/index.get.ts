import { getOwnerDb, seoPages } from "@kidthink/db";
import { desc } from "drizzle-orm";
import { defineEventHandler } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../utils/admin-auth-runtime.js";

export default defineEventHandler(async (event) => {
  try {
    await requireManagerSession(event);
    const db = getOwnerDb();

    const rows = await db
      .select()
      .from(seoPages)
      .orderBy(desc(seoPages.updatedAt));

    return {
      items: rows,
      total: rows.length,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
