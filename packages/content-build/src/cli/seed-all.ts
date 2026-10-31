import { getOwnerDb } from "@mindkid/db";
import { loadContentDemandLedger } from "../gates/content-demand-file.js";
import { seedContentTags } from "../seed-master/content-tags.js";
import {
  seedCurriculumItems,
  seedRoadmapCurricula,
} from "../seed-master/curricula.js";
import { seedTaxonomyMasterData } from "../seed-master/taxonomy/index.js";
import { runRoadmapBalanceGate } from "./check-roadmap-balance.js";
import { runDeriveDemand } from "./derive-demand.js";
import { runSeedContent } from "./seed-content.js";

export async function seedAllContent(options?: { masterOnly?: boolean }) {
  if (runRoadmapBalanceGate() !== 0) {
    throw new Error(
      "check:roadmap-balance đỏ: lộ trình vi phạm BR-CRM-*, dừng trước khi gieo. Xem chi tiết ở bảng phía trên."
    );
  }
  if (runDeriveDemand({ check: true }) !== 0) {
    throw new Error(
      "check:content-demand đỏ: content-demand.json không khớp lộ trình, dừng trước khi gieo. Chạy `pnpm derive:demand`."
    );
  }

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

  // 3. Seed roadmap curricula and weeks — BEFORE any level is seeded
  const roadmapStats = await seedRoadmapCurricula(db);
  console.log(
    `[content-build:seed] Roadmaps seeded: ${roadmapStats.curriculaCount} new curricula, ${roadmapStats.weeksCount} weeks.`
  );

  // 5. Seed content batch (levels)
  const masterOnly =
    options?.masterOnly ?? process.env.MINDKID_SEED_MASTER_ONLY === "1";
  if (masterOnly) {
    console.log(
      "[content-build:seed] Bỏ qua nội dung chi tiết (MINDKID_SEED_MASTER_ONLY=1)."
    );
  } else {
    await runSeedContent(false, `SEED-${Date.now()}`, false);

    // 6. Seed curriculum items straight from the committed demand ledger
    const itemStats = await seedCurriculumItems(db, loadContentDemandLedger());
    console.log(
      `[content-build:seed] Curriculum items seeded from ledger: ${itemStats.itemsCount} items.`
    );
  }

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
