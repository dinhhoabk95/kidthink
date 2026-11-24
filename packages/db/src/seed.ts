import { hashPassword } from "@mindkid/auth";
import { getOwnerDb } from "#src/client";
import {
  CONSENT_TYPE_VALUES,
  MANAGER_ROLE,
} from "#src/constants/identity-enums";
import { entitlementKeys, packages } from "#src/schema/billing";
import {
  consentRequirements,
  managerAccounts,
  managers,
} from "#src/schema/identity";
import { seedInitialAccounts } from "#src/seed-accounts";
import { SEED_ENTITLEMENT_KEYS, SEED_PACKAGES } from "#src/seed-catalog";

export async function seed() {
  const db = getOwnerDb();
  console.log("[db:seed] Seeding foundational non-content data...");

  for (const item of SEED_ENTITLEMENT_KEYS) {
    await db
      .insert(entitlementKeys)
      .values(item)
      .onConflictDoUpdate({
        target: entitlementKeys.key,
        set: { label: item.label, group: item.group, isMvp: item.isMvp },
      });
  }

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

  if (process.env.NODE_ENV !== "production") {
    const accountStats = await seedInitialAccounts(db);
    console.log(
      `[db:seed] Initial accounts seeded: ${accountStats.managerCount} managers, ${accountStats.userCount} users, ${accountStats.childProfileCount} children, ${accountStats.entitlementCount} entitlements.`
    );
  }

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
        role: MANAGER_ROLE.SUPER_ADMIN,
        mfaEnabled: false,
        isActive: true,
      })
      .onConflictDoNothing({ target: managers.email });

    const mgrRecord = await db.query.managers.findFirst({
      columns: { id: true },
      where: { email: envAdminEmail },
    });
    if (mgrRecord) {
      await db
        .insert(managerAccounts)
        .values({
          userId: mgrRecord.id,
          accountId: String(mgrRecord.id),
          providerId: "credential",
          password: envAdminHash,
        })
        .onConflictDoNothing({
          target: [managerAccounts.userId, managerAccounts.providerId],
        });
    }
  }

  for (const consentType of CONSENT_TYPE_VALUES) {
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
