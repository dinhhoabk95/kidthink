import { hashPassword } from "@mindkid/auth";
import { getOwnerDb } from "./client.ts";
import {
  entitlementKeys,
  packageEntitlements,
  packages,
} from "./schema/billing.ts";
import { consentRequirements, managers } from "./schema/identity.ts";
import { seedInitialAccounts } from "./seed-accounts.ts";
import {
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGE_ENTITLEMENTS,
  SEED_PACKAGES,
} from "./seed-catalog.ts";

export async function seed() {
  const db = getOwnerDb();
  console.log("[db:seed] Seeding foundational non-content data...");

  // 1. Seed entitlement_keys (16 keys derived from registry)
  for (const item of SEED_ENTITLEMENT_KEYS) {
    await db
      .insert(entitlementKeys)
      .values(item)
      .onConflictDoUpdate({
        target: entitlementKeys.key,
        set: { label: item.label, group: item.group, isMvp: item.isMvp },
      });
  }

  // 2. Seed packages
  for (const item of SEED_PACKAGES) {
    await db
      .insert(packages)
      .values(item)
      .onConflictDoUpdate({
        target: packages.code,
        set: {
          name: item.name,
          audience: item.audience,
          description: item.description,
          status: item.status,
          offers: item.offers,
          quotas: item.quotas,
          isPublic: item.isPublic,
          isFeatured: item.isFeatured,
        },
      });
  }

  // 3. Seed package_entitlements
  for (const item of SEED_PACKAGE_ENTITLEMENTS) {
    await db.insert(packageEntitlements).values(item).onConflictDoNothing();
  }

  // 4. Seed initial test accounts (Managers and Users)
  const accountStats = await seedInitialAccounts(db);
  console.log(
    `[db:seed] Initial accounts seeded: ${accountStats.managerCount} managers, ${accountStats.userCount} users, ${accountStats.childProfileCount} children, ${accountStats.entitlementCount} entitlements.`
  );

  // Optional: If custom initial admin is explicitly provided via env, ensure it exists
  const envAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
  const envAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  if (envAdminEmail && envAdminPassword) {
    const envAdminHash = await hashPassword(envAdminPassword);
    await db
      .insert(managers)
      .values({
        email: envAdminEmail,
        passwordHash: envAdminHash,
        displayName: "Super Admin (Env)",
        role: "super_admin",
        mfaEnabled: false,
        isActive: true,
      })
      .onConflictDoNothing({ target: managers.email });
  }

  // 5. Seed consent_requirements 3 singleton rows (D-QW, D-QZ)
  const CONSENT_TYPES = ["terms", "privacy", "child_data"] as const;
  for (const consentType of CONSENT_TYPES) {
    await db
      .insert(consentRequirements)
      .values({
        consentType,
        reconsentRequiredAt: null,
        notice: null,
      })
      .onConflictDoNothing({ target: consentRequirements.consentType });
  }

  console.log(
    "✅ [db:seed] Foundational non-content seed completed successfully."
  );
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal error in seed:", err);
      process.exit(1);
    });
}
