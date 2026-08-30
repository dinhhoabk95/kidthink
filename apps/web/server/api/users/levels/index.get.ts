import { getOwnerDb, searchGameLevels } from "@mindkid/db";
import { defineEventHandler, getQuery, setHeader } from "h3";

import { requireWebUserSession } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

/**
 * Gói của người gọi suy từ **entitlement đang hoạt động**, không phải từ session.
 *
 * `UserTokenPayload` chưa bao giờ mang `packageCode`; bản cũ đọc trường không
 * tồn tại nên `userPackage` luôn `undefined`, và mọi người đã mua gói đều bị
 * catalog này xếp về bậc `login` — thư viện trả phí trông như bị khoá với đúng
 * người đã trả tiền.
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
