import { optionalEnv } from "@mindkid/config";
import { getOwnerDb } from "#src/index";
import { ALL_SEED_CONTENT } from "#src/seed-content/index";
import { executeSeedBatch } from "#src/seed-content/service";

export async function runSeedContent(
  dryRun = false,
  batchCode = `SEED-${Date.now()}`
) {
  console.log(
    `🌱 [seed:content] Executing seed batch ${batchCode} with ${ALL_SEED_CONTENT.length} items (dryRun: ${dryRun})...`
  );

  const db = getOwnerDb();
  const res = await executeSeedBatch(
    db,
    {
      batchCode,
      gitSha: optionalEnv("GIT_SHA"),
      prUrl: optionalEnv("PR_URL"),
      seeds: ALL_SEED_CONTENT,
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
