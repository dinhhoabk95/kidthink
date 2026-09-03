import { eq } from "drizzle-orm";
import { getOwnerDb } from "#src/client";
import { activities, lessons } from "#src/schema/content";
import { gameLevels } from "#src/schema/game";
import { GATE_1_LADDER_BASELINES } from "#src/seed-content/gates/ladder";
import {
  checkLegacyV1Coverage,
  printLegacyV1CoverageReport,
} from "#src/seed-content/gates/legacy-v1-coverage";
import { checkGateMontessoriCorpus } from "#src/seed-content/gates/montessori-gate";
import { runEightGates } from "#src/seed-content/gates/runner";
import { ALL_SEED_CONTENT, ALL_SEED_LEVELS } from "#src/seed-content/index";
import type {
  AnyContentSeed,
  ContentSeed,
  GateResult,
} from "#src/seed-content/types";

interface Gate1Tracker {
  totalContentPackFails: number;
  totalDifficultyParamsFails: number;
  totalGate1FailingLevels: number;
  engineStats: Record<
    string,
    { total: number; cFail: number; dFail: number; failed: number }
  >;
}

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

async function checkAllDrifts(seeds: AnyContentSeed[]): Promise<number> {
  const driftList: Array<{ code: string; reason: string }> = [];
  for (const s of seeds) {
    const drift = await checkSeedDrift(s);
    if (drift) {
      driftList.push(drift);
    }
  }
  if (driftList.length > 0) {
    console.error(
      `🚨 [DB Drift Detected] ${driftList.length} items differ from DB:`
    );
    for (const d of driftList) {
      console.error(`   - ${d.code}: ${d.reason}`);
    }
    return driftList.length;
  }
  return 0;
}

function recordGate1Stats(
  seed: ContentSeed,
  gates: GateResult[],
  tracker: Gate1Tracker
): void {
  const g1 = gates.find((g) => g.gate === 1);
  const tCode = seed.header.template_code;
  if (!tracker.engineStats[tCode]) {
    tracker.engineStats[tCode] = { total: 0, cFail: 0, dFail: 0, failed: 0 };
  }
  tracker.engineStats[tCode].total++;

  if (!g1 || g1.passed) {
    return;
  }

  tracker.engineStats[tCode].failed++;
  tracker.totalGate1FailingLevels++;

  const hasCFail = g1.issues.some(
    (i) =>
      i.code === "CONTENT_PACK_SCHEMA_INVALID" ||
      i.code === "CONTENT_PACK_MISSING"
  );
  const hasDFail = g1.issues.some(
    (i) =>
      i.code === "DIFFICULTY_PARAMS_SCHEMA_INVALID" ||
      i.code === "DIFFICULTY_PARAMS_MISSING"
  );
  if (hasCFail) {
    tracker.engineStats[tCode].cFail++;
    tracker.totalContentPackFails++;
  }
  if (hasDFail) {
    tracker.engineStats[tCode].dFail++;
    tracker.totalDifficultyParamsFails++;
  }
}

function checkBlockingGates(seed: AnyContentSeed, gates: GateResult[]): number {
  let issues = 0;
  for (const g of gates) {
    if (g.gate !== 1 && g.gate !== 5 && !g.passed) {
      console.error(`❌ [Gate ${g.gate} Fail] ${seed.header.code}:`);
      for (const issue of g.issues) {
        console.error(`   - ${issue.code} — ${issue.message}`);
        issues++;
      }
    }
  }
  return issues;
}

function checkCorpusGate(seeds: AnyContentSeed[]): number {
  const corpusGate = checkGateMontessoriCorpus(seeds);
  if (corpusGate.passed) {
    return 0;
  }
  console.error("❌ [Gate Fail] Cổng corpus:");
  for (const issue of corpusGate.issues) {
    console.error(
      `   - Gate ${corpusGate.gate} (${corpusGate.name}) [${corpusGate.kind}]: ${issue.code} — ${issue.message}`
    );
  }
  return corpusGate.issues.length;
}

function printGate1Report(tracker: Gate1Tracker): void {
  console.log(
    "\n📊 [Gate 1 — Báo cáo Thẩm định Contract theo Engine (Task #117)]"
  );
  console.log("─".repeat(70));
  console.log(
    "Engine   | Tổng levels | content_pack trượt | difficulty_params trượt"
  );
  console.log("─".repeat(70));
  for (const [tCode, s] of Object.entries(tracker.engineStats).sort()) {
    console.log(
      `${tCode.padEnd(8)} | ${String(s.total).padStart(11)} | ${String(s.cFail).padStart(18)} | ${String(s.dFail).padStart(23)}`
    );
  }
  console.log("─".repeat(70));
  console.log(
    `Tổng: ${tracker.totalGate1FailingLevels}/${ALL_SEED_LEVELS.length} game levels chưa qua Cổng 1 (${tracker.totalContentPackFails} content_pack, ${tracker.totalDifficultyParamsFails} difficulty_params).`
  );
  console.log(
    `Bậc thang trần: max ${GATE_1_LADDER_BASELINES.maxFailingGate1Levels} levels, ${GATE_1_LADDER_BASELINES.maxContentPackFails} content_pack, ${GATE_1_LADDER_BASELINES.maxDifficultyParamsFails} difficulty_params.`
  );
}

function validateLadderBaselines(tracker: Gate1Tracker): number {
  let issues = 0;
  if (
    tracker.totalGate1FailingLevels >
    GATE_1_LADDER_BASELINES.maxFailingGate1Levels
  ) {
    console.error(
      `🚨 [BẬC THANG THOÁI LUI] Số level trượt Gate 1 (${tracker.totalGate1FailingLevels}) vượt quá trần baseline (${GATE_1_LADDER_BASELINES.maxFailingGate1Levels})!`
    );
    issues++;
  }
  if (
    tracker.totalContentPackFails > GATE_1_LADDER_BASELINES.maxContentPackFails
  ) {
    console.error(
      `🚨 [BẬC THANG THOÁI LUI] Số content_pack trượt (${tracker.totalContentPackFails}) vượt quá trần baseline (${GATE_1_LADDER_BASELINES.maxContentPackFails})!`
    );
    issues++;
  }
  if (
    tracker.totalDifficultyParamsFails >
    GATE_1_LADDER_BASELINES.maxDifficultyParamsFails
  ) {
    console.error(
      `🚨 [BẬC THANG THOÁI LUI] Số difficulty_params trượt (${tracker.totalDifficultyParamsFails}) vượt quá trần baseline (${GATE_1_LADDER_BASELINES.maxDifficultyParamsFails})!`
    );
    issues++;
  }
  return issues;
}

export async function runSeedCheck(againstDb = false) {
  console.log(
    `🔍 [seed:check] Running 8 validation gates on ${ALL_SEED_CONTENT.length} repo seed files...`
  );

  const existingCodes = new Set<string>();
  let blockingIssues = 0;

  const tracker: Gate1Tracker = {
    totalContentPackFails: 0,
    totalDifficultyParamsFails: 0,
    totalGate1FailingLevels: 0,
    engineStats: {},
  };

  for (const seed of ALL_SEED_CONTENT) {
    const gates = runEightGates(seed, existingCodes);
    existingCodes.add(seed.header.code);

    if (seed.kind !== "activity" && seed.kind !== "lesson") {
      recordGate1Stats(seed as ContentSeed, gates, tracker);
    }

    blockingIssues += checkBlockingGates(seed, gates);
  }

  blockingIssues += checkCorpusGate(ALL_SEED_CONTENT);

  printGate1Report(tracker);
  blockingIssues += validateLadderBaselines(tracker);

  const legacyV1Report = checkLegacyV1Coverage(ALL_SEED_LEVELS);
  printLegacyV1CoverageReport(legacyV1Report);
  if (!legacyV1Report.passed) {
    blockingIssues++;
  }

  const { checkSkillRegistry } = await import(
    "#src/seed-content/gates/check-skill-registry"
  );
  const { SKILL_DATASETS } = await import("#src/seed-content/skills/index");
  const skillRegistryGate = checkSkillRegistry(SKILL_DATASETS);
  if (!skillRegistryGate.passed) {
    for (const issue of skillRegistryGate.issues) {
      console.error(`🚨 [BR-SDS-07] ${issue.message}`);
    }
    blockingIssues += skillRegistryGate.issues.length;
  }

  if (againstDb) {
    const driftCount = await checkAllDrifts(ALL_SEED_CONTENT);
    if (driftCount > 0) {
      process.exit(1);
    }
  }

  if (blockingIssues > 0) {
    console.error(
      `❌ [seed:check] Failed with ${blockingIssues} blocking issue(s).`
    );
    process.exit(1);
  }

  console.log(
    `🎉 [seed:check] Tám cổng và Bậc thang đo nợ Gate 1 hoàn tất đạt chuẩn! (${ALL_SEED_CONTENT.length} seed items)`
  );
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
