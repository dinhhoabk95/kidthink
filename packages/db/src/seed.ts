import { hashPassword } from "@mindkid/auth";
import { requireEnv } from "@mindkid/config";
import {
  ENTITLEMENT_KEYS,
  PACKAGE_CATALOG,
  PENDING_PRICE_VND as PENDING_PRICE,
} from "@mindkid/shared";
import { getOwnerDb } from "./client.ts";
import {
  entitlementKeys,
  packageEntitlements,
  packages,
} from "./schema/billing.ts";
import { consentRequirements, managers } from "./schema/identity.ts";
import { seedSkillActionSuggestions } from "./seed-master/action-suggestions.ts";
import { seedContentTags } from "./seed-master/content-tags.ts";
import { seedCurriculaMasterData } from "./seed-master/curricula.ts";
import { seedEmojiMasterData } from "./seed-master/emoji.ts";
import { seedGameTemplatesMasterData } from "./seed-master/game-templates.ts";
import { seedTaxonomyMasterData } from "./seed-master/taxonomy/index.ts";

export const PENDING_PRICE_VND = PENDING_PRICE;

export const SEED_ENTITLEMENT_KEYS = ENTITLEMENT_KEYS.map((item) => ({
  key: item.key,
  group: item.group,
  label: item.label,
  isMvp: item.is_mvp,
}));

export const SEED_PACKAGES = Object.values(PACKAGE_CATALOG).map((pkg) => ({
  code: pkg.code,
  name: pkg.name,
  audience: pkg.audience,
  description: pkg.description,
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

  // 7. Seed Content Tags master vocabulary
  await seedContentTags(db);
  console.log("[db:seed] Content Tags vocabulary seeded.");

  // 8. Seed Skill Action Suggestions library (P3.7, D-MY)
  const actionStats = await seedSkillActionSuggestions(db);
  console.log(
    `[db:seed] Skill action suggestions seeded: ${actionStats.seededCount} items.`
  );

  // 7. Seed initial super_admin manager
  const initialAdminEmail = requireEnv(
    "INITIAL_ADMIN_EMAIL",
    "Seeding creates the first super admin; name the account explicitly."
  );
  const initialAdminPassword = requireEnv(
    "INITIAL_ADMIN_PASSWORD",
    "Seeding creates the first super admin; supply its password explicitly."
  );
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

  // 8. Seed consent_requirements 3 singleton rows (D-QW, D-QZ)
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

  // 9. Seed 5 MVP Curricula master data (Task 8, D-LA, D-LU)
  const currStats = await seedCurriculaMasterData(db);
  console.log(
    `[db:seed] Curricula seeded: ${currStats.curriculaCount} curricula, ${currStats.weeksCount} weeks, ${currStats.itemsCount} items.`
  );

  console.log("✅ [db:seed] Seed completed successfully.");
}

if (process.argv[1]?.endsWith("seed.ts")) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal error in seed:", err);
      process.exit(1);
    });
}
