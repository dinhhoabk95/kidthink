import { count } from "drizzle-orm";
import {
  activities,
  competencies,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  lessons,
  skills,
} from "../../index.js";

export async function runSeedReport() {
  console.log("📊 [seed:report] Generating content coverage report...\n");
  const db = getOwnerDb();

  const [totalLevels] = await db.select({ value: count() }).from(gameLevels);
  const [totalActivities] = await db
    .select({ value: count() })
    .from(activities);
  const [totalLessons] = await db.select({ value: count() }).from(lessons);
  const [totalTemplates] = await db
    .select({ value: count() })
    .from(gameTemplates);
  const [totalSkills] = await db.select({ value: count() }).from(skills);
  const [totalCompetencies] = await db
    .select({ value: count() })
    .from(competencies);

  console.log("Summary metrics:");
  console.log(`- Published Game Levels: ${totalLevels.value}`);
  console.log(`- Published Activities: ${totalActivities.value}`);
  console.log(`- Published Lessons: ${totalLessons.value}`);
  console.log(`- Total Templates: ${totalTemplates.value}`);
  console.log(`- Total Skills: ${totalSkills.value}`);
  console.log(`- Total Competencies: ${totalCompetencies.value}\n`);

  console.log("Competency Breakdown:");
  const compList = await db.select().from(competencies);
  for (const comp of compList) {
    console.log(`  [${comp.code}] ${comp.name}`);
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
