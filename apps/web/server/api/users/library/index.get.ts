import { getOwnerDb, getUserLibrary } from "@kidthink/db";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.ts";
import { resolveUserActiveEntitlements } from "../../../utils/entitlements-runtime.ts";

const LibraryQuerySchema = z.object({
  entity_type: z
    .enum(["game_level", "lesson", "curriculum", "activity"])
    .optional(),
  collection_id: z.coerce.number().optional(),
  tag: z.string().optional(),
  q: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(100).optional(),
});

function resolveActiveTier(
  allowedTiers: string[]
): "free" | "login" | "standard" | "premium" {
  if (allowedTiers.includes("premium")) {
    return "premium";
  }
  if (allowedTiers.includes("standard")) {
    return "standard";
  }
  if (allowedTiers.includes("login")) {
    return "login";
  }
  return "free";
}

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const userId = Number(user.user_id);
    const db = getOwnerDb();

    const rawQuery = getQuery(event);
    const parsed = LibraryQuerySchema.parse(rawQuery);

    const entitlements = await resolveUserActiveEntitlements(userId);
    const activeTier = resolveActiveTier(entitlements.allowedTiers);

    const libraryData = await getUserLibrary(db, {
      userId,
      entityType: parsed.entity_type,
      collectionId: parsed.collection_id,
      tag: parsed.tag,
      q: parsed.q,
      limit: parsed.limit,
      activeTier,
    });

    return libraryData;
  } catch (error) {
    return respondToUserAuthError(event, error);
  }
});
