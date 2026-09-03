import { getOwnerDb } from "@mindkid/db";
import { seedSkillActionSuggestions } from "../seed-master/action-suggestions.js";
import { seedContentTags } from "../seed-master/content-tags.js";
import { seedCurriculaMasterData } from "../seed-master/curricula.js";
import { seedTaxonomyMasterData } from "../seed-master/taxonomy/index.js";
import { runSeedContent } from "./seed-content.js";

export async function seedAllContent(options?: { masterOnly?: boolean }) {
  const db = getOwnerDb();
  console.log(
    "🌱 [content-build:seed] Seeding all content and taxonomy data..."
  );

  // 1. Seed Taxonomy master data
  const taxStats = await seedTaxonomyMasterData(db);
  console.log(
    `[content-build:seed] Taxonomy seeded: ${taxStats.competencyCount} competencies, ${taxStats.strandCount} strands, ${taxStats.skillCount} skills, ${taxStats.loCount} LOs, ${taxStats.datasetCount} skill datasets.`
  );

  // 2. Seed Content Tags master vocabulary
  await seedContentTags(db);
  console.log("[content-build:seed] Content Tags vocabulary seeded.");

  // 3. Seed Skill Action Suggestions library
  const actionStats = await seedSkillActionSuggestions(db);
  console.log(
    `[content-build:seed] Skill action suggestions seeded: ${actionStats.seededCount} items.`
  );

  // 4. Seed content batch (levels, activities, lessons)
  const masterOnly =
    options?.masterOnly ?? process.env.MINDKID_SEED_MASTER_ONLY === "1";
  if (masterOnly) {
    console.log(
      "[content-build:seed] Bỏ qua nội dung chi tiết (MINDKID_SEED_MASTER_ONLY=1)."
    );
  } else {
    await runSeedContent(false, `SEED-${Date.now()}`, false);
  }

  // 5. Seed Curricula master data
  const currStats = await seedCurriculaMasterData(db, {
    requireContent: !masterOnly,
  });
  console.log(
    `[content-build:seed] Curricula seeded: ${currStats.curriculaCount} curricula, ${currStats.weeksCount} weeks, ${currStats.itemsCount} items.`
  );

  console.log("✅ [content-build:seed] All content data seeded successfully.");
}

if (process.argv[1]?.endsWith("seed-all.ts")) {
  seedAllContent()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Fatal error in content-build:seed:", err);
      process.exit(1);
    });
}
