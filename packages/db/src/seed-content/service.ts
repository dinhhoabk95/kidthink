import { AppError } from "@kidthink/auth";
import { eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { gameLevels, gameTemplates } from "../schema/game.js";
import { contentReviewLog, contentSeedBatches } from "../schema/ops.js";
import { contentSkillMap } from "../schema/tagging.js";
import { skills } from "../schema/taxonomy.js";
import {
  validateAndAssignTags,
  validateContentSkillMap,
} from "../services/tagging.js";
import { runEightGates } from "./gates/runner.js";
import type { ContentSeed, GateResult } from "./types.js";

export interface SeedBatchInput {
  batchCode: string;
  gitSha?: string;
  prUrl?: string;
  approvedByManagerId?: number;
  seeds: ContentSeed<unknown, unknown>[];
}

export interface SeedExecutionResult {
  batchCode: string;
  rowsInserted: number;
  rowsSkippedIdempotent: number;
  gateResults: GateResult[];
}

type DbTransaction = Parameters<
  Parameters<NodePgDatabase<Record<string, unknown>>["transaction"]>[0]
>[0];

async function processSingleSeed(
  tx: DbTransaction,
  seed: ContentSeed<unknown, unknown>,
  batchCode: string,
  approvedByManagerId?: number,
  sequenceIndex = 1
): Promise<"inserted" | "skipped"> {
  const { header, content_pack, difficulty_params } = seed;

  const [template] = await tx
    .select()
    .from(gameTemplates)
    .where(eq(gameTemplates.code, header.template_code));

  if (!template) {
    throw new AppError(
      "VALIDATION_FAILED",
      `Template ${header.template_code} không tồn tại.`
    );
  }

  const [existing] = await tx
    .select()
    .from(gameLevels)
    .where(eq(gameLevels.code, header.code));

  if (existing) {
    if (existing.contentVersion === header.content_version) {
      return "skipped";
    }
    if (existing.contentVersion > header.content_version) {
      throw new AppError(
        "VALIDATION_FAILED",
        `Mã ${header.code} đã có version lớn hơn.`
      );
    }
    await tx
      .update(gameLevels)
      .set({ status: "archived" })
      .where(eq(gameLevels.id, existing.id));
  }

  const entityId = existing
    ? existing.entityId
    : Math.floor(Date.now() / 1000) * 1000 + sequenceIndex;

  const [newLevel] = await tx
    .insert(gameLevels)
    .values({
      entityId,
      code: header.code,
      contentVersion: header.content_version,
      templateId: template.id,
      titleVi: header.title_vi,
      instructionVi: header.instruction_vi,
      ageMin: header.age_min,
      ageMax: header.age_max,
      difficulty: header.difficulty,
      accessTier: header.access_tier,
      contentPack: content_pack,
      difficultyParams: difficulty_params,
      status: "published",
      origin: header.origin,
      authoredIn: header.authored_in,
    })
    .returning();

  const skillMapEntries: Array<{ skillId: number; weight: number }> = [];
  for (let i = 0; i < header.skill_codes.length; i++) {
    const sc = header.skill_codes[i];
    const [skill] = await tx.select().from(skills).where(eq(skills.code, sc));
    if (!skill) {
      throw new AppError("VALIDATION_FAILED", `Skill ${sc} không tồn tại.`);
    }
    skillMapEntries.push({ skillId: skill.id, weight: i === 0 ? 1.0 : 0.5 });
  }

  validateContentSkillMap(skillMapEntries);

  for (const entry of skillMapEntries) {
    await tx.insert(contentSkillMap).values({
      entityType: "game_level",
      entityId: newLevel.id,
      skillId: entry.skillId,
      weight: entry.weight.toString(),
    });
  }

  await validateAndAssignTags(
    tx,
    {
      entityType: "game_level",
      entityId: newLevel.id,
      tagCodes: [...header.what_tags, ...header.thinking_tags],
      mechanicTagCode: template.mechanic || undefined,
    },
    true
  );

  await tx.insert(contentReviewLog).values({
    entityType: "game_level",
    entityId: newLevel.id,
    contentVersion: header.content_version,
    fromStatus: "draft",
    toStatus: "published",
    actorManagerId: approvedByManagerId || null,
    reason: `Seeded via batch ${batchCode} (origin: ${header.origin})`,
  });

  return "inserted";
}

export async function executeSeedBatch(
  db: NodePgDatabase<Record<string, unknown>>,
  input: SeedBatchInput,
  dryRun = false
): Promise<SeedExecutionResult> {
  const { batchCode, gitSha, prUrl, approvedByManagerId, seeds } = input;
  const existingCodes = new Set<string>();
  let totalInserted = 0;
  let totalSkipped = 0;
  const allGateResults: GateResult[] = [];

  const result = await db
    .transaction(async (tx) => {
      let idx = 0;
      for (const seed of seeds) {
        idx++;
        const gates = runEightGates(seed, existingCodes);
        allGateResults.push(...gates);
        existingCodes.add(seed.header.code);

        const failed = gates.filter((g) => !g.passed);
        if (failed.length > 0) {
          throw new AppError(
            "VALIDATION_FAILED",
            `Nội dung ${seed.header.code} trượt Cổng ${failed[0].gate}: ${failed[0].issues[0]?.message}`
          );
        }

        const status = await processSingleSeed(
          tx,
          seed,
          batchCode,
          approvedByManagerId,
          idx
        );
        if (status === "inserted") {
          totalInserted++;
        } else {
          totalSkipped++;
        }
      }

      await tx.insert(contentSeedBatches).values({
        batchCode,
        kind: "game_level",
        gitSha: gitSha || "local-dev",
        prUrl: prUrl || "local",
        approvedByManagerId: approvedByManagerId || null,
        rowsInserted: totalInserted,
        gateResults: allGateResults,
      });

      if (dryRun) {
        throw new Error("__DRY_RUN_ROLLBACK__");
      }

      return {
        batchCode,
        rowsInserted: totalInserted,
        rowsSkippedIdempotent: totalSkipped,
        gateResults: allGateResults,
      };
    })
    .catch((err) => {
      if (err.message === "__DRY_RUN_ROLLBACK__") {
        return {
          batchCode,
          rowsInserted: totalInserted,
          rowsSkippedIdempotent: totalSkipped,
          gateResults: allGateResults,
        };
      }
      throw err;
    });

  return result;
}

export function validateSingleSeed(
  seed: ContentSeed<unknown, unknown>,
  existingCodes?: Set<string>
): GateResult[] {
  const gates = runEightGates(seed, existingCodes);
  const failed = gates.filter((g) => !g.passed);
  if (failed.length > 0) {
    const msg = failed
      .flatMap((g) =>
        g.issues.map((i) => `[Gate ${g.gate}] ${i.code}: ${i.message}`)
      )
      .join("; ");
    throw new AppError("VALIDATION_FAILED", `Seed validation failed: ${msg}`);
  }
  return gates;
}
