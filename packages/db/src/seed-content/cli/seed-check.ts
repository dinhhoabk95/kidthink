import { eq } from "drizzle-orm";
import { activities, gameLevels, getOwnerDb, lessons } from "../../index.js";
import { checkGateMontessoriCorpus } from "../gates/montessori-gate.js";
import { runEightGates } from "../gates/runner.js";
import { ALL_SEED_CONTENT } from "../index.js";
import type { AnyContentSeed, GateResult } from "../types.js";

async function checkSeedDrift(
  seed: AnyContentSeed
): Promise<{ code: string; reason: string } | null> {
  const db = getOwnerDb();
  if (seed.kind === "activity") {
    const [dbAct] = await db
      .select()
      .from(activities)
      .where(eq(activities.code, seed.header.code));
    if (dbAct && dbAct.contentVersion !== seed.header.content_version) {
      return {
        code: seed.header.code,
        reason: `Version mismatch: repo has v${seed.header.content_version}, DB has v${dbAct.contentVersion}`,
      };
    }
  } else if (seed.kind === "lesson") {
    const [dbLes] = await db
      .select()
      .from(lessons)
      .where(eq(lessons.code, seed.header.code));
    if (dbLes && dbLes.contentVersion !== seed.header.content_version) {
      return {
        code: seed.header.code,
        reason: `Version mismatch: repo has v${seed.header.content_version}, DB has v${dbLes.contentVersion}`,
      };
    }
  } else {
    const [dbLevel] = await db
      .select()
      .from(gameLevels)
      .where(eq(gameLevels.code, seed.header.code));

    if (dbLevel && dbLevel.contentVersion !== seed.header.content_version) {
      return {
        code: seed.header.code,
        reason: `Version mismatch: repo has v${seed.header.content_version}, DB has v${dbLevel.contentVersion}`,
      };
    }
  }
  return null;
}

function reportGateResults(code: string, gates: GateResult[]): number {
  const failed = gates.filter((g) => !g.passed);
  if (failed.length === 0) {
    console.log(`✅ [Gate Pass] ${code}`);
    return 0;
  }

  console.error(`❌ [Gate Fail] ${code}:`);
  let issueCount = 0;
  for (const g of failed) {
    for (const issue of g.issues) {
      console.error(
        `   - Gate ${g.gate} (${g.name}) [${g.kind}]: ${issue.code} — ${issue.message}`
      );
      issueCount++;
    }
  }
  return issueCount;
}

export async function runSeedCheck(againstDb = false) {
  console.log(
    `🔍 [seed:check] Running 8 validation gates on ${ALL_SEED_CONTENT.length} repo seed files...`
  );

  const seeds = ALL_SEED_CONTENT;
  const existingCodes = new Set<string>();
  let totalIssues = 0;
  const driftList: Array<{ code: string; reason: string }> = [];

  for (const seed of seeds) {
    const gates = runEightGates(seed, existingCodes);
    existingCodes.add(seed.header.code);
    totalIssues += reportGateResults(seed.header.code, gates);

    if (againstDb) {
      const drift = await checkSeedDrift(seed);
      if (drift) {
        driftList.push(drift);
      }
    }
  }

  // Cổng mức corpus: hạn ngạch competency của cả lô Montessori (BR-MGL-01).
  // Chạy sau vòng lặp vì nó đo tổng, không đo từng item.
  const corpusGate = checkGateMontessoriCorpus(seeds);
  if (!corpusGate.passed) {
    console.error("❌ [Gate Fail] Cổng corpus:");
    for (const issue of corpusGate.issues) {
      console.error(
        `   - Gate ${corpusGate.gate} (${corpusGate.name}) [${corpusGate.kind}]: ${issue.code} — ${issue.message}`
      );
      totalIssues++;
    }
  }

  if (againstDb && driftList.length > 0) {
    console.error(
      `🚨 [DB Drift Detected] ${driftList.length} items differ from DB:`
    );
    for (const d of driftList) {
      console.error(`   - ${d.code}: ${d.reason}`);
    }
    process.exit(1);
  }

  if (totalIssues > 0) {
    console.error(`❌ [seed:check] Failed with ${totalIssues} issue(s).`);
    process.exit(1);
  }

  console.log("🎉 [seed:check] All 8 gates + cổng corpus passed cleanly!");
}

if (process.argv[1]?.endsWith("seed-check.ts")) {
  const againstDb = process.argv.includes("--against-db");
  runSeedCheck(againstDb)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
}
