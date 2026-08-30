import { PACKAGE_CATALOG } from "@mindkid/shared";
import { defineEventHandler } from "h3";

export default defineEventHandler(() => {
  const publicPackages = Object.values(PACKAGE_CATALOG)
    .filter((pkg) => pkg.is_public && pkg.status === "active")
    .map((pkg) => ({
      code: pkg.code,
      name: pkg.name,
      description: pkg.description,
      audience: pkg.audience,
      entitlements: pkg.entitlements,
      offers: pkg.offers,
    }));

  return {
    packages: publicPackages,
  };
});
