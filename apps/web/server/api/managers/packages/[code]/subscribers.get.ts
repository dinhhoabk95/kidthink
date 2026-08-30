import { appError } from "@mindkid/auth";
import { entitlements, getDb, users } from "@mindkid/db";
import { PACKAGE_CATALOG } from "@mindkid/shared";
import { and, desc, eq, gte, inArray, isNull, lt, or } from "drizzle-orm";
import { defineEventHandler, getQuery, getRouterParam } from "h3";
import { requireSuperAdminSession } from "#server/utils/admin-auth-runtime";

export default defineEventHandler(async (event) => {
  await requireSuperAdminSession(event);
  const code = getRouterParam(event, "code");
  if (!code) {
    throw appError("VALIDATION_FAILED", "Mã gói là bắt buộc.");
  }

  const pkg = PACKAGE_CATALOG[code];
  if (!pkg) {
    throw appError("PACKAGE_NOT_FOUND", "Gói không tồn tại trong catalog.");
  }

  const query = getQuery(event) || {};
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
  const cursor = query.cursor ? Number(query.cursor) : 0;

  const db = getDb();
  const now = new Date();

  if (!pkg.entitlements || pkg.entitlements.length === 0) {
    return {
      subscribers: [],
      next_cursor: null,
    };
  }

  // Query subscribers holding active entitlements belonging to this package
  // BR-PCA-06: STRICTLY NO child profile data returned
  const conditions = [
    inArray(entitlements.entitlementKey, pkg.entitlements),
    eq(entitlements.status, "active"),
    or(isNull(entitlements.expiresAt), gte(entitlements.expiresAt, now)),
  ];

  if (cursor > 0) {
    conditions.push(lt(entitlements.id, cursor));
  }

  const rows = await db
    .select({
      entitlementId: entitlements.id,
      userId: users.id,
      userUuid: users.uuid,
      email: users.email,
      displayName: users.displayName,
      source: entitlements.source,
      grantedAt: entitlements.grantedAt,
      expiresAt: entitlements.expiresAt,
    })
    .from(entitlements)
    .innerJoin(users, eq(entitlements.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(entitlements.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (items.at(-1)?.entitlementId ?? null) : null;

  // Deduplicate by user if user has multiple keys for same package
  const userMap = new Map<number, (typeof items)[0]>();
  for (const item of items) {
    if (!userMap.has(item.userId)) {
      userMap.set(item.userId, item);
    }
  }

  const subscribers = Array.from(userMap.values()).map((s) => ({
    user_id: s.userId,
    user_uuid: s.userUuid,
    email: s.email,
    display_name: s.displayName,
    source: s.source,
    granted_at: new Date(s.grantedAt).toISOString(),
    expires_at: s.expiresAt ? new Date(s.expiresAt).toISOString() : null,
  }));

  return {
    package_code: pkg.code,
    subscribers,
    next_cursor: nextCursor,
  };
});
