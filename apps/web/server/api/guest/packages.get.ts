import { ENTITLEMENT_KEYS, PACKAGE_CATALOG } from "@mindkid/shared";
import { defineEventHandler } from "h3";

const ENTITLEMENT_LABEL_BY_KEY = new Map(
  ENTITLEMENT_KEYS.map((item) => [item.key, item.label])
);

export default defineEventHandler(() => {
  const publicPackages = Object.values(PACKAGE_CATALOG)
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
    }));

  return {
    packages: publicPackages,
  };
});
