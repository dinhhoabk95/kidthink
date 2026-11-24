import { defineEventHandler, getQuery, setHeader } from "h3";
import {
  type RawSearchParamsInput,
  searchGameLevels,
} from "#server/services/index.js";
import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

/**
 * Gói của người gọi suy từ entitlement đang hoạt động, không phải từ session.
 */
export default defineEventHandler(async (event) => {
  let userPackage: string | undefined;
  try {
    const session = await requireWebUserSession(event);
    const activeKeys = await resolveUserActiveEntitlements(session.user_id);
    if (activeKeys.includes("play_premium_games")) {
      userPackage = "PKG-premium";
    } else if (activeKeys.includes("play_standard_games")) {
      userPackage = "PKG-standard";
    }
  } catch {
    // Unauthenticated user searches with guest package level
  }

  const query = getQuery(event) as RawSearchParamsInput;
  const result = await searchGameLevels(query, {
    role: "user",
    userPackage,
  });

  if (result.no_store) {
    setHeader(
      event,
      "Cache-Control",
      "private, no-store, no-cache, must-revalidate"
    );
  }

  return {
    items: result.items,
    next_cursor: result.next_cursor,
  };
});
