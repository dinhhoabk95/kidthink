import { hashPassword } from "@mindkid/auth";
import { getOwnerDb } from "./client.ts";
import {
  entitlementKeys,
  packageEntitlements,
  packages,
} from "./schema/billing.ts";
import { consentRequirements, managers } from "./schema/identity.ts";
import {
  SEED_ENTITLEMENT_KEYS,
  SEED_PACKAGE_ENTITLEMENTS,
  SEED_PACKAGES,
} from "./seed-catalog.ts";
import { runSeedContent } from "./seed-content/cli/seed-content.ts";
import { seedInitialAccounts } from "./seed-master/accounts.ts";
import { seedSkillActionSuggestions } from "./seed-master/action-suggestions.ts";
import { seedContentTags } from "./seed-master/content-tags.ts";
import { seedCurriculaMasterData } from "./seed-master/curricula.ts";
import { seedTaxonomyMasterData } from "./seed-master/taxonomy/index.ts";

// biome-ignore lint/performance/noBarrelFile: lối vào phụ @mindkid/db/seed theo Task #208 G1
export * from "./seed-content/gates/runner.ts";
export * from "./seed-content/service.ts";
export * from "./seed-content/types.ts";
export * from "./seed-master/content-tags.ts";

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
    `[db:seed] Taxonomy seeded: ${taxStats.competencyCount} competencies, ${taxStats.strandCount} strands, ${taxStats.skillCount} skills, ${taxStats.loCount} LOs, ${taxStats.datasetCount} skill datasets.`
  );

  // 7. Seed Content Tags master vocabulary
  await seedContentTags(db);
  console.log("[db:seed] Content Tags vocabulary seeded.");

  // 8. Seed Skill Action Suggestions library (P3.7, D-MY)
  const actionStats = await seedSkillActionSuggestions(db);
  console.log(
    `[db:seed] Skill action suggestions seeded: ${actionStats.seededCount} items.`
  );

  // 8. Seed initial test accounts (Managers and Users)
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

  // 9. Gieo nội dung thật: level, activity, lesson.
  //
  // Trước đây `db:seed` dừng ở master data, còn nội dung nằm sau một lệnh
  // riêng `db:seed:content` mà không script nào gọi — nên một máy mới chạy
  // `pnpm db:seed` xong vẫn có 0 trò chơi. Bỏ qua bằng
  // `MINDKID_SEED_MASTER_ONLY=1` khi chỉ cần master data (ví dụ trong test).
  const masterOnly = process.env.MINDKID_SEED_MASTER_ONLY === "1";
  if (masterOnly) {
    console.log("[db:seed] Bỏ qua nội dung (MINDKID_SEED_MASTER_ONLY=1).");
  } else {
    await runSeedContent(false, `SEED-${Date.now()}`, false);
  }

  // 10. Chương trình học — PHẢI đứng SAU bước nội dung.
  //
  // `curriculum_items` trỏ vào `lessons`/`game_levels` bằng id. Bước này từng
  // đứng trước bước 9, tức là trước khi database có bất kỳ bài học nào, nên nó
  // dựng 5 chương trình và 74 tuần rồi in "0 items" mà không ai coi đó là lỗi.
  const currStats = await seedCurriculaMasterData(db, {
    requireContent: !masterOnly,
  });
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
