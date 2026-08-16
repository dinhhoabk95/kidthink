import { PACKAGE_CATALOG } from "@kidthink/shared";
import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  const publicPackages = Object.values(PACKAGE_CATALOG)
    .filter((pkg) => pkg.is_public && pkg.status === "active")
    .map((pkg) => ({
      code: pkg.code,
      title: pkg.title,
      description_vi: pkg.description_vi,
      tier: pkg.tier,
      entitlements: pkg.entitlements,
      offers: pkg.offers,
    }));

  return {
    packages: publicPackages,
  };
});
