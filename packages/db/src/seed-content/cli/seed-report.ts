import { count } from "drizzle-orm";
import {
  competencies,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  skills,
} from "../../index.js";

export async function runSeedReport() {
  console.log("📊 [seed:report] Generating content coverage report...\n");
  const db = getOwnerDb();

  const [totalLevels] = await db.select({ value: count() }).from(gameLevels);
  const [totalTemplates] = await db
    .select({ value: count() })
    .from(gameTemplates);
  const [totalSkills] = await db.select({ value: count() }).from(skills);
  const [totalCompetencies] = await db
    .select({ value: count() })
    .from(competencies);

  console.log("Summary metrics:");
  console.log(`- Published Game Levels: ${totalLevels.value}`);
  console.log(`- Total Templates: ${totalTemplates.value}`);
  console.log(`- Total Skills: ${totalSkills.value}`);
  console.log(`- Total Competencies: ${totalCompetencies.value}\n`);

  console.log("Competency Breakdown:");
  const compList = await db.select().from(competencies);
  for (const comp of compList) {
    console.log(`  [${comp.code}] ${comp.nameVi}`);
  }

  console.log("\n✅ [seed:report] Report complete.");
}

if (process.argv[1]?.endsWith("seed-report.ts")) {
  runSeedReport()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
