import { getOwnerDb } from "../../index.js";
import { ALL_SEED_LEVELS } from "../index.js";
import { executeSeedBatch } from "../service.js";

export async function runSeedContent(
  dryRun = false,
  batchCode = `SEED-${Date.now()}`
) {
  console.log(
    `🌱 [seed:content] Executing seed batch ${batchCode} with ${ALL_SEED_LEVELS.length} levels (dryRun: ${dryRun})...`
  );

  const db = getOwnerDb();
  const res = await executeSeedBatch(
    db,
    {
      batchCode,
      gitSha: process.env.GIT_SHA || "local-dev",
      prUrl: process.env.PR_URL || "local",
      seeds: ALL_SEED_LEVELS,
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
