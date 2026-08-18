import { entitlements, getDb, paymentOrders } from "@mindkid/db";
import { PACKAGE_CATALOG, type PackageDefinition } from "@mindkid/shared";
import {
  and,
  countDistinct,
  eq,
  gte,
  inArray,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { defineEventHandler } from "h3";
import { requireSuperAdminSession } from "../../../utils/admin-auth-runtime.ts";

export default defineEventHandler(async (event) => {
  requireSuperAdminSession(event);
  const db = getDb();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);

  // 1. Compute 30-day revenue per package from approved orders (D-JO, BR-PCA-03)
  const revenueRows = await db
    .select({
      packageCode: paymentOrders.packageCode,
      totalRevenue:
        sql<number>`coalesce(sum(${paymentOrders.amountVnd}), 0)`.as(
          "total_revenue"
        ),
    })
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.status, "approved"),
        gte(paymentOrders.reviewedAt, thirtyDaysAgo)
      )
    )
    .groupBy(paymentOrders.packageCode);

  const revenueMap = new Map<string, number>();
  for (const r of revenueRows) {
    revenueMap.set(r.packageCode, Number(r.totalRevenue));
  }

  // 2. Compute active subscriber count per package
  // A subscriber has active entitlements matching the package keys
  const allPackageDefs = Object.values(PACKAGE_CATALOG) as PackageDefinition[];

  const subscriberCounts = await Promise.all(
    allPackageDefs.map(async (pkg) => {
      if (!pkg.entitlements || pkg.entitlements.length === 0) {
        return { code: pkg.code, count: 0 };
      }

      const [result] = await db
        .select({
          activeCount: countDistinct(entitlements.userId),
        })
        .from(entitlements)
        .where(
          and(
            inArray(entitlements.entitlementKey, pkg.entitlements),
            eq(entitlements.status, "active"),
            or(isNull(entitlements.expiresAt), gte(entitlements.expiresAt, now))
          )
        );

      return {
        code: pkg.code,
        count: Number(result?.activeCount ?? 0),
      };
    })
  );

  const countMap = new Map<string, number>();
  for (const s of subscriberCounts) {
    countMap.set(s.code, s.count);
  }

  // 3. Assemble full package list (BR-PCA-02: includes is_public = false with requires_spec)
  const packages = allPackageDefs.map((pkg) => {
    return {
      code: pkg.code,
      name: pkg.name,
      audience: pkg.audience,
      description: pkg.description,
      is_public: pkg.is_public,
      is_featured: pkg.is_featured,
      status: pkg.status,
      offers: pkg.offers,
      entitlements: pkg.entitlements,
      quotas: pkg.quotas,
      requires_spec: pkg.requires_spec ?? null,
      active_subscribers_count: countMap.get(pkg.code) ?? 0,
      revenue_30d_vnd: revenueMap.get(pkg.code) ?? 0,
    };
  });

  return {
    packages,
  };
});
