import { SKILL_DATASETS } from "@mindkid/content";
import {
  contentSkillMap,
  contentTagMap,
  contentTags,
  gameLevelRounds,
  gameLevels,
  normalizeMechanicTagCode,
  type OwnerDb,
  skillDatasets,
  skills,
  validateContentSkillMap,
} from "@mindkid/db";
import { ValidationError } from "@mindkid/errors/common";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { inArray, sql } from "drizzle-orm";
import { readSeedGatesBaseline } from "#src/cli/check-seed-gates";
import { runEightGates } from "#src/gates/runner";
import type {
  AnyContentSeed,
  ContentSeed,
  ContentSeedRound,
  GateResult,
} from "#src/types";

export interface SeedBatchInput {
  batchCode: string;
  kind?: "game_level";
  gitSha?: string;
  prUrl?: string;
  approvedByManagerId?: number;
  seeds: AnyContentSeed[];
  skipGates?: boolean;
}

export interface SeedExecutionResult {
  batchCode: string;
  rowsInserted: number;
  rowsSkippedIdempotent: number;
  gateResults: GateResult[];
}

function validatePublishAxes(matchedTags: Array<{ axis: string }>) {
  const axesPresent = new Set(matchedTags.map((t) => t.axis));
  const requiredAxes: Array<"what" | "thinking" | "mechanic"> = [
    "what",
    "thinking",
    "mechanic",
  ];
  const missingAxes = requiredAxes.filter((axis) => !axesPresent.has(axis));
  if (missingAxes.length > 0) {
    throw new ValidationError(
      `Thiếu tag cho trục sư phạm: ${missingAxes.join(", ")}. theme là trục tuỳ chọn.`
    );
  }
}

function recordGateFailures(
  seedCode: string,
  gates: GateResult[],
  collector: { gate9Failures: number; blockingIssues: string[] }
): void {
  for (const g of gates) {
    if (g.passed) {
      continue;
    }
    if (g.gate === 9) {
      collector.gate9Failures += g.issues.length;
    } else {
      collector.blockingIssues.push(
        `Nội dung ${seedCode} trượt Cổng ${g.gate}: ${g.issues[0]?.message ?? ""}`
      );
    }
  }
}

export function validateSeedsWithGates(
  seeds: AnyContentSeed[],
  batchCode?: string
): GateResult[] {
  const existingCodes = new Set<string>();
  const allGateResults: GateResult[] = [];
  const baseline = readSeedGatesBaseline();
  const collector = { gate9Failures: 0, blockingIssues: [] as string[] };

  for (const seed of seeds) {
    const primarySkillCode = seed.header.skill_codes?.[0];
    const dataset = primarySkillCode
      ? SKILL_DATASETS[primarySkillCode]
      : undefined;
    const gates = runEightGates(
      seed,
      existingCodes,
      batchCode,
      ALL_TEMPLATES,
      dataset
    );
    allGateResults.push(...gates);
    existingCodes.add(seed.header.code);

    recordGateFailures(seed.header.code, gates, collector);
  }

  if (collector.blockingIssues.length > 0) {
    throw new ValidationError(
      collector.blockingIssues[0] ?? "Lỗi thẩm định cổng"
    );
  }

  if (collector.gate9Failures > baseline.maxGate9Violations) {
    throw new ValidationError(
      `Phát hiện ${collector.gate9Failures} vi phạm Cổng 9, vượt quá hạn mức baseline (${baseline.maxGate9Violations})`
    );
  }

  return allGateResults;
}

export async function executeSeedBatch(
  db: OwnerDb,
  input: SeedBatchInput,
  dryRun = false
): Promise<SeedExecutionResult> {
  const { batchCode, seeds } = input;
  let totalInserted = 0;
  let totalSkipped = 0;

  // 1. Run eight gates first for all seeds (unless explicitly skipped, e.g. in seeder)
  const allGateResults = input.skipGates
    ? []
    : validateSeedsWithGates(seeds, input.batchCode);

  const result = await db
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: batch seeder workflow requires single-transaction orchestration
    .transaction(async (tx) => {
      // 2. Preload all lookup tables in parallel
      const [allSkills, allTags, allExistingLevels, allSkillDatasets] =
        await Promise.all([
          tx.select().from(skills),
          tx.select().from(contentTags),
          tx
            .select({
              id: gameLevels.id,
              code: gameLevels.code,
              contentPack: gameLevels.contentPack,
              difficultyParams: gameLevels.difficultyParams,
            })
            .from(gameLevels),
          tx.select().from(skillDatasets),
        ]);

      const skillMap = new Map(allSkills.map((s) => [s.code, s]));
      const tagMap = new Map(allTags.map((t) => [t.code, t]));
      const skillDatasetMap = new Map(allSkillDatasets.map((d) => [d.code, d]));
      const existingLevelByCode = new Map(
        allExistingLevels.map((l) => [l.code, l])
      );

      // 3. Process seeds in batches / chunks
      const CHUNK_SIZE = 1000;
      for (let i = 0; i < seeds.length; i += CHUNK_SIZE) {
        const chunk = seeds.slice(i, i + CHUNK_SIZE);
        const levelsToInsert: (typeof gameLevels.$inferInsert)[] = [];
        const preparedMeta: Array<{
          code: string;
          rounds: ContentSeedRound[];
          headerInstruction: string;
          headerDifficulty: number;
          contentPack: ContentSeed["content_pack"];
          difficultyParams: ContentSeed["difficulty_params"];
          skillMapEntries: Array<{ skillId: number; weight: number }>;
          matchedTags: (typeof contentTags.$inferSelect)[];
        }> = [];

        for (const glSeed of chunk) {
          const { header, content_pack, difficulty_params } = glSeed;

          const template = ALL_TEMPLATES[header.template_code];
          if (!template) {
            throw new ValidationError(
              `Template ${header.template_code} không tồn tại.`
            );
          }

          const existingLevel = existingLevelByCode.get(header.code);
          const isUnchanged =
            existingLevel !== undefined &&
            JSON.stringify(existingLevel.contentPack) ===
              JSON.stringify(content_pack) &&
            JSON.stringify(existingLevel.difficultyParams) ===
              JSON.stringify(difficulty_params);
          if (isUnchanged) {
            totalSkipped++;
            continue;
          }

          // Validate skills
          const skillMapEntries: Array<{ skillId: number; weight: number }> =
            [];
          for (let sIdx = 0; sIdx < header.skill_codes.length; sIdx++) {
            const sc = header.skill_codes[sIdx];
            if (!sc) {
              continue;
            }
            const skill = skillMap.get(sc);
            if (!skill) {
              throw new ValidationError(`Skill ${sc} không tồn tại.`);
            }
            skillMapEntries.push({
              skillId: skill.id,
              weight: sIdx === 0 ? 1.0 : 0.5,
            });
          }
          validateContentSkillMap(skillMapEntries);

          // Validate tags
          const normalizedMechanic = normalizeMechanicTagCode(
            template.mechanic || undefined
          );
          const allTagCodes = new Set([
            ...header.what_tags,
            ...header.thinking_tags,
            ...(header.theme_tag ? [header.theme_tag] : []),
          ]);
          if (normalizedMechanic) {
            allTagCodes.add(normalizedMechanic);
          }

          const tagList = Array.from(allTagCodes);
          const matchedTags: (typeof contentTags.$inferSelect)[] = [];
          const missingTags: string[] = [];
          for (const code of tagList) {
            const tag = tagMap.get(code);
            if (tag && tag.status === "active") {
              matchedTags.push(tag);
            } else {
              missingTags.push(code);
            }
          }

          if (missingTags.length > 0) {
            throw new ValidationError(
              `Tag không hợp lệ hoặc chưa được duyệt trong từ vựng Lớp 1: ${missingTags.join(", ")}`
            );
          }
          validatePublishAxes(matchedTags);

          const primarySkillCode = header.skill_codes[0];
          const matchedDataset = primarySkillCode
            ? skillDatasetMap.get(primarySkillCode)
            : undefined;

          levelsToInsert.push({
            code: header.code,
            templateCode: template.code,
            title: header.title,
            instruction: header.instruction,
            ageMin: header.age_min,
            ageMax: header.age_max,
            difficulty: header.difficulty,
            accessTier: header.access_tier,
            themeId: header.theme_tag || null,
            skillDatasetId: matchedDataset?.id ?? null,
            projectionRef: template.code,
            contentPack: content_pack,
            difficultyParams: difficulty_params,
          });

          preparedMeta.push({
            code: header.code,
            rounds: glSeed.rounds ?? [],
            headerInstruction: header.instruction,
            headerDifficulty: header.difficulty,
            contentPack: content_pack,
            difficultyParams: difficulty_params,
            skillMapEntries,
            matchedTags,
          });
        }

        if (levelsToInsert.length > 0) {
          const insertedLevels = await tx
            .insert(gameLevels)
            .values(levelsToInsert)
            .onConflictDoUpdate({
              target: gameLevels.code,
              set: {
                templateCode: sql`excluded.template_code`,
                title: sql`excluded.title`,
                instruction: sql`excluded.instruction`,
                ageMin: sql`excluded.age_min`,
                ageMax: sql`excluded.age_max`,
                difficulty: sql`excluded.difficulty`,
                accessTier: sql`excluded.access_tier`,
                themeId: sql`excluded.theme_id`,
                skillDatasetId: sql`excluded.skill_dataset_id`,
                projectionRef: sql`excluded.projection_ref`,
                contentPack: sql`excluded.content_pack`,
                difficultyParams: sql`excluded.difficulty_params`,
                updatedAt: sql`now()`,
              },
            })
            .returning({
              id: gameLevels.id,
              code: gameLevels.code,
            });

          totalInserted += insertedLevels.length;

          const levelByCode = new Map(insertedLevels.map((l) => [l.code, l]));
          const upsertedIds = insertedLevels.map((l) => l.id);
          if (upsertedIds.length > 0) {
            await tx
              .delete(gameLevelRounds)
              .where(inArray(gameLevelRounds.gameLevelId, upsertedIds));
            await tx
              .delete(contentSkillMap)
              .where(inArray(contentSkillMap.entityId, upsertedIds));
            await tx
              .delete(contentTagMap)
              .where(inArray(contentTagMap.entityId, upsertedIds));
          }

          const allRounds: (typeof gameLevelRounds.$inferInsert)[] = [];
          const allSkillsToLink: (typeof contentSkillMap.$inferInsert)[] = [];
          const allTagsToLink: (typeof contentTagMap.$inferInsert)[] = [];

          for (const meta of preparedMeta) {
            const inserted = levelByCode.get(meta.code);
            if (!inserted) {
              continue;
            }

            existingLevelByCode.set(meta.code, {
              id: inserted.id,
              code: inserted.code,
              contentPack: meta.contentPack,
              difficultyParams: meta.difficultyParams,
            });

            // Rounds
            if (meta.rounds.length > 0) {
              for (let rIdx = 0; rIdx < meta.rounds.length; rIdx++) {
                const r = meta.rounds[rIdx];
                if (!r) {
                  continue;
                }
                allRounds.push({
                  gameLevelId: inserted.id,
                  roundIndex: rIdx,
                  instruction: r.instruction,
                  instructionAudioPath: r.instruction_audio_path ?? null,
                  contentPack: r.content_pack,
                  difficultyParams: r.difficulty_params,
                  difficulty: r.difficulty,
                });
              }
            } else {
              allRounds.push({
                gameLevelId: inserted.id,
                roundIndex: 0,
                instruction: meta.headerInstruction,
                instructionAudioPath: null,
                contentPack: meta.contentPack,
                difficultyParams: meta.difficultyParams,
                difficulty: meta.headerDifficulty,
              });
            }

            // Skills
            for (const entry of meta.skillMapEntries) {
              allSkillsToLink.push({
                entityType: "game_level",
                entityId: inserted.id,
                skillId: entry.skillId,
                weight: entry.weight.toString(),
              });
            }

            // Tags
            for (const tag of meta.matchedTags) {
              allTagsToLink.push({
                entityType: "game_level",
                entityId: inserted.id,
                tagId: tag.id,
              });
            }
          }

          if (allRounds.length > 0) {
            await tx.insert(gameLevelRounds).values(allRounds);
          }
          if (allSkillsToLink.length > 0) {
            await tx.insert(contentSkillMap).values(allSkillsToLink);
          }
          if (allTagsToLink.length > 0) {
            await tx.insert(contentTagMap).values(allTagsToLink);
          }
        }
      }

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
  seed: AnyContentSeed,
  existingCodes?: Set<string>
): GateResult[] {
  const codes = existingCodes || new Set<string>();
  const primarySkillCode = seed.header.skill_codes?.[0];
  const dataset = primarySkillCode
    ? SKILL_DATASETS[primarySkillCode]
    : undefined;
  const gates = runEightGates(seed, codes, undefined, ALL_TEMPLATES, dataset);
  const failed = gates.filter((g) => !g.passed);
  if (failed.length > 0) {
    const msg = failed
      .flatMap((g) =>
        g.issues.map((i) => `[Gate ${g.gate}] ${i.code}: ${i.message}`)
      )
      .join("; ");
    throw new ValidationError(`Seed validation failed: ${msg}`);
  }
  return gates;
}
