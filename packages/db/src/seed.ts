import { hashPassword } from "@kidthink/auth";
import {
  ENTITLEMENT_KEYS,
  PACKAGE_CATALOG,
  PENDING_PRICE_VND as PENDING_PRICE,
} from "@kidthink/shared";
import { getOwnerDb } from "./index.ts";
import {
  entitlementKeys,
  packageEntitlements,
  packages,
} from "./schema/billing.ts";
import { managers } from "./schema/identity.ts";

export const PENDING_PRICE_VND = PENDING_PRICE;

export const SEED_ENTITLEMENT_KEYS = ENTITLEMENT_KEYS.map((item) => ({
  key: item.key,
  group: item.group,
  labelVi: item.labelVi,
  isMvp: item.is_mvp,
}));

export const SEED_PACKAGES = Object.values(PACKAGE_CATALOG).map((pkg) => ({
  code: pkg.code,
  nameVi: pkg.name_vi,
  audienceVi: pkg.audience_vi,
  descriptionVi: pkg.description_vi,
  status: pkg.status,
  offers: pkg.offers,
  quotas: pkg.quotas,
  isPublic: pkg.is_public,
  isFeatured: pkg.is_featured,
}));

export const SEED_PACKAGE_ENTITLEMENTS = Object.values(PACKAGE_CATALOG).flatMap(
  (pkg) =>
    pkg.entitlements.map((key) => ({
      packageCode: pkg.code,
      entitlementKey: key,
    }))
);

import { seedEmojiMasterData } from "./seed-master/emoji.ts";
import { seedGameTemplatesMasterData } from "./seed-master/game-templates.ts";
import { seedTaxonomyMasterData } from "./seed-master/taxonomy/index.ts";

export async function seed() {
  const db = getOwnerDb();
  console.log("[db:seed] Seeding database...");

  // 1. Seed entitlement_keys (16 keys derived from registry)
  for (const item of SEED_ENTITLEMENT_KEYS) {
    await db
      .insert(entitlementKeys)
      .values(item)
      .onConflictDoUpdate({
        target: entitlementKeys.key,
        set: { labelVi: item.labelVi, group: item.group, isMvp: item.isMvp },
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
          nameVi: item.nameVi,
          audienceVi: item.audienceVi,
          descriptionVi: item.descriptionVi,
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

  // 4. Seed Taxonomy master data
  const taxStats = await seedTaxonomyMasterData(db);
  console.log(
    `[db:seed] Taxonomy seeded: ${taxStats.competencyCount} competencies, ${taxStats.strandCount} strands, ${taxStats.skillCount} skills, ${taxStats.loCount} LOs.`
  );

  // 5. Seed Emoji master data
  const emojiStats = await seedEmojiMasterData(db);
  console.log(`[db:seed] Emoji seeded: ${emojiStats.emojiCount} emojis.`);

  // 6. Seed Game Templates master data
  const templateStats = await seedGameTemplatesMasterData(db);
  console.log(
    `[db:seed] Game Templates seeded: ${templateStats.templateCount} templates.`
  );

  // 7. Seed initial super_admin manager
  const initialAdminEmail =
    process.env.INITIAL_ADMIN_EMAIL || "admin@tinimath.test";
  const initialAdminPassword =
    process.env.INITIAL_ADMIN_PASSWORD || "Admin123456!";
  const initialAdminHash = await hashPassword(initialAdminPassword);

  await db
    .insert(managers)
    .values({
      email: initialAdminEmail,
      passwordHash: initialAdminHash,
      displayName: "Super Admin",
      role: "super_admin",
      mfaEnabled: false,
      isActive: true,
    })
    .onConflictDoNothing({ target: managers.email });

  console.log("✅ [db:seed] Seed completed successfully.");
}
