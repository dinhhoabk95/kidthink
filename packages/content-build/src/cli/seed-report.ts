import {
  activities,
  competencies,
  gameLevels,
  getOwnerDb,
  lessons,
  skills,
} from "@mindkid/db";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { count } from "drizzle-orm";
import { ALL_SEED_LEVELS } from "../index.js";

function resolveLevelBand(min: number, max: number): "3-4" | "4-5" | "5-6" {
  if (max <= 4) {
    return "3-4";
  }
  if (min >= 5) {
    return "5-6";
  }
  return "4-5";
}

function getOutOfBandLevels() {
  const outOfBandList: Array<{
    code: string;
    engine: string;
    band: string;
    banned: string[];
  }> = [];

  for (const seed of ALL_SEED_LEVELS) {
    const tmpl = ALL_TEMPLATES[seed.header.template_code];
    if (!tmpl?.banned_age_bands || tmpl.banned_age_bands.length === 0) {
      continue;
    }
    const band = resolveLevelBand(seed.header.age_min, seed.header.age_max);
    if (tmpl.banned_age_bands.includes(band)) {
      outOfBandList.push({
        code: seed.header.code,
        engine: seed.header.template_code,
        band,
        banned: tmpl.banned_age_bands,
      });
    }
  }
  return outOfBandList;
}

export async function runSeedReport() {
  console.log("📊 [seed:report] Generating content coverage report...\n");
  const db = getOwnerDb();

  const [totalLevels] = await db.select({ value: count() }).from(gameLevels);
  const [totalActivities] = await db
    .select({ value: count() })
    .from(activities);
  const [totalLessons] = await db.select({ value: count() }).from(lessons);
  const totalTemplates = Object.keys(ALL_TEMPLATES).length;
  const [totalSkills] = await db.select({ value: count() }).from(skills);
  const [totalCompetencies] = await db
    .select({ value: count() })
    .from(competencies);

  console.log("Summary metrics:");
  console.log(`- Published Game Levels: ${totalLevels?.value ?? 0}`);
  console.log(`- Published Activities: ${totalActivities?.value ?? 0}`);
  console.log(`- Published Lessons: ${totalLessons?.value ?? 0}`);
  console.log(`- Total Templates: ${totalTemplates}`);
  console.log(`- Total Skills: ${totalSkills?.value ?? 0}`);
  console.log(`- Total Competencies: ${totalCompetencies?.value ?? 0}`);

  // Đo nợ band tuổi theo BR-ECD-13 (Task #118)
  const outOfBandList = getOutOfBandLevels();
  console.log(`- Out of band levels: ${outOfBandList.length} (BR-ECD-13)\n`);

  if (outOfBandList.length === 0) {
    console.log("🎯 0 level ngoài band engine.\n");
  } else {
    console.log(
      `⚠️ Có ${outOfBandList.length} level ngoài band engine (dọn ở 27 task engine #130–#156):\n`
    );
  }

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
