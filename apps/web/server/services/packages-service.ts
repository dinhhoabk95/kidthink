import {
  ENTITLEMENT_SOURCE_CODEC,
  type EntitlementSourceLabel,
  type EntitlementWithUserEntity,
} from "@mindkid/db";
import { PackageNotFoundError } from "@mindkid/errors/billing";
import {
  ENTITLEMENT_KEYS,
  PACKAGE_CATALOG,
  type PackageDefinition,
} from "@mindkid/shared";
import { useRepositories } from "#server/utils/repositories";

const THIRTY_DAYS_MS = 30 * 86_400_000;

const ENTITLEMENT_LABEL_BY_KEY = new Map<string, string>(
  ENTITLEMENT_KEYS.map((item) => [item.key, item.label])
);

export interface PublicPackageBenefitItem {
  readonly entitlement_key: string;
  readonly label: string;
}

export interface PublicPackageItem {
  readonly code: string;
  readonly name: string;
  readonly description: string;
  readonly audience: string;
  readonly is_featured: boolean;
  readonly entitlements: readonly string[];
  readonly benefits: readonly PublicPackageBenefitItem[];
  readonly quotas: PackageDefinition["quotas"];
  readonly offers: PackageDefinition["offers"];
}

export interface PublicPackagesResult {
  readonly packages: readonly PublicPackageItem[];
}

export interface ManagerPackageItem {
  readonly code: string;
  readonly name: string;
  readonly audience: string;
  readonly description: string;
  readonly is_public: boolean;
  readonly is_featured: boolean;
  readonly status: string;
  readonly offers: PackageDefinition["offers"];
  readonly entitlements: readonly string[];
  readonly quotas: PackageDefinition["quotas"];
  readonly requires_spec: string | null;
  readonly active_subscribers_count: number;
  readonly revenue_30d_vnd: number;
}

export interface ManagerPackagesResult {
  readonly packages: readonly ManagerPackageItem[];
}

export interface PackageSubscriberItem {
  readonly user_id: number;
  readonly user_uuid: string;
  readonly email: string;
  readonly display_name: string;
  readonly source: EntitlementSourceLabel;
  readonly granted_at: string;
  readonly expires_at: string | null;
}

export interface PackageSubscribersResult {
  readonly package_code?: string;
  readonly subscribers: readonly PackageSubscriberItem[];
  readonly next_cursor: number | null;
}

const PUBLIC_PACKAGES_SNAPSHOT: PublicPackagesResult = {
  packages: Object.values(PACKAGE_CATALOG)
    .filter((pkg) => pkg.is_public && pkg.status === "active")
    .map((pkg) => ({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description,
      audience: pkg.audience,
      is_featured: pkg.is_featured,
      entitlements: pkg.entitlements,
      benefits: pkg.entitlements.map((entitlementKey) => ({
        entitlement_key: entitlementKey,
        label: ENTITLEMENT_LABEL_BY_KEY.get(entitlementKey) ?? entitlementKey,
      })),
      quotas: pkg.quotas,
      offers: pkg.offers,
    })),
};

export function listPublicPackages(): PublicPackagesResult {
  return PUBLIC_PACKAGES_SNAPSHOT;
}

export async function listManagerPackagesWithMetrics(
  now: Date = new Date()
): Promise<ManagerPackagesResult> {
  const repos = useRepositories();
  const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);
  const revenueByPkg =
    await repos.orders.sumApprovedRevenueByPackage(thirtyDaysAgo);

  const allPackageDefs = Object.values(PACKAGE_CATALOG) as PackageDefinition[];
  const subscriberCounts = await Promise.all(
    allPackageDefs.map(async (pkg) => {
      if (!pkg.entitlements || pkg.entitlements.length === 0) {
        return { code: pkg.code, count: 0 };
      }
      const count = await repos.entitlements.countActiveUsersByKeys(
        pkg.entitlements,
        now
      );
      return { code: pkg.code, count };
    })
  );

  const countMap = new Map<string, number>();
  for (const s of subscriberCounts) {
    countMap.set(s.code, s.count);
  }

  const packages: ManagerPackageItem[] = allPackageDefs.map((pkg) => ({
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
    revenue_30d_vnd: revenueByPkg[pkg.code] ?? 0,
  }));

  return { packages };
}

export async function listPackageSubscribers(
  code: string,
  options: {
    readonly limit?: number;
    readonly cursor?: number;
    readonly now?: Date;
  } = {}
): Promise<PackageSubscribersResult> {
  const pkg = PACKAGE_CATALOG[code];
  if (!pkg) {
    throw new PackageNotFoundError("Gói không tồn tại trong catalog.");
  }

  if (!pkg.entitlements || pkg.entitlements.length === 0) {
    return {
      subscribers: [],
      next_cursor: null,
    };
  }

  const repos = useRepositories();
  const page = await repos.entitlements.listActiveSubscribersByKeys(
    pkg.entitlements,
    {
      limit: options.limit,
      cursor: options.cursor,
      now: options.now,
    }
  );

  const userMap = new Map<number, EntitlementWithUserEntity>();
  for (const item of page.items) {
    if (!userMap.has(item.userId)) {
      userMap.set(item.userId, item);
    }
  }

  const subscribers: PackageSubscriberItem[] = Array.from(userMap.values()).map(
    (s) => ({
      user_id: s.userId,
      user_uuid: s.user.uuid,
      email: s.user.email,
      display_name: s.user.displayName,
      source: ENTITLEMENT_SOURCE_CODEC.toLabel(s.source),
      granted_at: s.grantedAt.toISOString(),
      expires_at: s.expiresAt ? s.expiresAt.toISOString() : null,
    })
  );

  return {
    package_code: pkg.code,
    subscribers,
    next_cursor: page.nextCursor,
  };
}
