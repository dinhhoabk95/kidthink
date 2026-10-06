import { optionalEnv } from "@mindkid/config";
import { getOwnerDb } from "@mindkid/db";
import { loadContentDemandLedger } from "../gates/content-demand-file.js";
import { ALL_SEED_CONTENT } from "../index.js";
import { parseSeedProfile, selectSeedContent } from "../seed-profile.js";
import { executeSeedBatch } from "../service.js";

export async function runSeedContent(
  dryRun = false,
  batchCode = `SEED-${Date.now()}`,
  skipGates = false
) {
  const profile = parseSeedProfile(process.env.MINDKID_SEED_PROFILE);
  const seeds = selectSeedContent(
    profile,
    ALL_SEED_CONTENT,
    loadContentDemandLedger()
  );
  console.log(
    `🌱 [seed:content] Executing seed batch ${batchCode} with ${seeds.length}/${ALL_SEED_CONTENT.length} items, profile ${profile} (dryRun: ${dryRun})...`
  );

  const db = getOwnerDb();
  const res = await executeSeedBatch(
    db,
    {
      batchCode,
      gitSha: optionalEnv("GIT_SHA"),
      prUrl: optionalEnv("PR_URL"),
      seeds,
      skipGates,
    },
    dryRun
  );

  console.log(`✅ [seed:content] Completed batch ${res.batchCode}:`);
  console.log(`   - Rows inserted: ${res.rowsInserted}`);
  console.log(`   - Rows skipped (idempotent): ${res.rowsSkippedIdempotent}`);

  if (dryRun) {
    console.log(
      "ℹ️ [seed:content] Dry run completed cleanly — transaction rolled back."
    );
  }
}

if (process.argv[1]?.endsWith("seed-content.ts")) {
  const dryRun = process.argv.includes("--dry-run");
  const batchArg = process.argv.find((a) => a.startsWith("--batch="));
  const batchCode = batchArg ? batchArg.split("=")[1] : undefined;

  runSeedContent(dryRun, batchCode)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Fatal error in seed:content:", err);
      process.exit(1);
    });
}
