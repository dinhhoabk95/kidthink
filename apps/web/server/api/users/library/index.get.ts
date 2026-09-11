import { getOwnerDb } from "@mindkid/db";
import { allowedTiers } from "@mindkid/shared";
import { z } from "zod";
import { getUserLibrary } from "#server/services/library.js";
import { defineApiRoute } from "#server/utils/define-api-route";
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

export default defineApiRoute({
  auth: "user",
  query: LibraryQuerySchema,
  async handler({ auth, query }) {
    const userId = Number(auth.user_id);
    const db = getOwnerDb();

    const activeKeys = await resolveUserActiveEntitlements(userId);
    const userAllowedTiers = await allowedTiers(
      { kind: "user", user_id: String(userId) },
      activeKeys
    );
    const activeTier = resolveActiveTier(userAllowedTiers);

    return await getUserLibrary(db, {
      userId,
      entityType: query.entity_type,
      collectionId: query.collection_id,
      tag: query.tag,
      q: query.q,
      limit: query.limit,
      activeTier,
    });
  },
});
