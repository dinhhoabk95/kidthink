import { getOwnerDb, getUserLibrary } from "@mindkid/db";
import { allowedTiers } from "@mindkid/shared";
import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

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
  userAllowedTiers: string[]
): "free" | "login" | "standard" | "premium" {
  if (userAllowedTiers.includes("premium")) {
    return "premium";
  }
  if (userAllowedTiers.includes("standard")) {
    return "standard";
  }
  if (userAllowedTiers.includes("login")) {
    return "login";
  }
  return "free";
}

export default defineEventHandler(async (event) => {
  const user = await requireWebUserSession(event);
  const userId = Number(user.user_id);
  const db = getOwnerDb();

  const rawQuery = getQuery(event);
  const parsed = LibraryQuerySchema.parse(rawQuery);

  const activeKeys = await resolveUserActiveEntitlements(userId);
  const userAllowedTiers = await allowedTiers(
    { kind: "user", user_id: String(userId) },
    activeKeys
  );
  const activeTier = resolveActiveTier(userAllowedTiers);

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
});
