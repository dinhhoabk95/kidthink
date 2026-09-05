import { AppError } from "@mindkid/auth";
import {
  activities,
  contentReviewLog,
  contentSeedBatches,
  contentSkillMap,
  contentTagMap,
  contentTags,
  gameLevelRounds,
  gameLevels,
  lessonActivities,
  lessons,
  normalizeMechanicTagCode,
  skills,
  validateAndAssignTags,
  validateContentSkillMap,
} from "@mindkid/db";
import { ALL_TEMPLATES } from "@mindkid/game-engine/registry";
import { eq, inArray } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { runEightGates } from "./gates/runner.js";
import type {
  ActivitySeed,
  AnyContentSeed,
  ContentSeed,
  ContentSeedRound,
  GateResult,
  LessonSeed,
} from "./types.js";

export interface SeedBatchInput {
  batchCode: string;
  kind?: "game_level" | "activity" | "lesson";
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
    throw new AppError(
      "VALIDATION_FAILED",
      `Thiếu tag cho trục sư phạm: ${missingAxes.join(", ")}. theme là trục tuỳ chọn.`
    );
  }
}

export async function executeSeedBatch(
  db: NodePgDatabase<Record<string, unknown>>,
  input: SeedBatchInput,
  dryRun = false
): Promise<SeedExecutionResult> {
  const { batchCode, kind, gitSha, prUrl, approvedByManagerId, seeds } = input;
  const existingCodes = new Set<string>();
  let totalInserted = 0;
  let totalSkipped = 0;
  const allGateResults: GateResult[] = [];

  let inferredKind: "game_level" | "activity" | "lesson" = kind || "game_level";
  if (!kind && seeds[0]) {
    if (seeds[0].kind === "activity") {
      inferredKind = "activity";
    } else if (seeds[0].kind === "lesson") {
      inferredKind = "lesson";
    }
  }

  // 1. Run eight gates first for all seeds (unless explicitly skipped, e.g. in seeder)
  if (!input.skipGates) {
    for (const seed of seeds) {
      const gates = runEightGates(seed, existingCodes);
      allGateResults.push(...gates);
      existingCodes.add(seed.header.code);

      const failed = gates.filter((g) => !g.passed);
      const firstFailed = failed[0];
      if (firstFailed) {
        throw new AppError(
          "VALIDATION_FAILED",
          `Nội dung ${seed.header.code} trượt Cổng ${firstFailed.gate}: ${firstFailed.issues[0]?.message ?? ""}`
        );
      }
    }
  }

  const result = await db
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: batch seeder workflow requires single-transaction orchestration
    .transaction(async (tx) => {
      // 2. Preload all lookup tables in parallel
      const [
        allSkills,
        allTags,
        allExistingLevels,
        allExistingActivities,
        allExistingLessons,
      ] = await Promise.all([
        tx.select().from(skills),
        tx.select().from(contentTags),
        tx
          .select({
            id: gameLevels.id,
            entityId: gameLevels.entityId,
            code: gameLevels.code,
            contentVersion: gameLevels.contentVersion,
            status: gameLevels.status,
          })
          .from(gameLevels),
        tx
          .select({
            id: activities.id,
            entityId: activities.entityId,
            code: activities.code,
            contentVersion: activities.contentVersion,
            status: activities.status,
          })
          .from(activities),
        tx
          .select({
            id: lessons.id,
            entityId: lessons.entityId,
            code: lessons.code,
            contentVersion: lessons.contentVersion,
            status: lessons.status,
          })
          .from(lessons),
      ]);

      const skillMap = new Map(allSkills.map((s) => [s.code, s]));
      const tagMap = new Map(allTags.map((t) => [t.code, t]));

      const existingLevelsByCode = new Map<
        string,
        Array<{
          id: number;
          entityId: number;
          contentVersion: number;
          status: string;
        }>
      >();
      const gameLevelEntityIdByCode = new Map<string, number>();
      for (const l of allExistingLevels) {
        const arr = existingLevelsByCode.get(l.code) ?? [];
        arr.push(l);
        existingLevelsByCode.set(l.code, arr);
        if (!gameLevelEntityIdByCode.has(l.code) || l.status === "published") {
          gameLevelEntityIdByCode.set(l.code, l.entityId);
        }
      }

      const existingActivitiesByCode = new Map<
        string,
        Array<{
          id: number;
          entityId: number;
          contentVersion: number;
          status: string;
        }>
      >();
      const activityEntityIdByCode = new Map<string, number>();
      for (const a of allExistingActivities) {
        const arr = existingActivitiesByCode.get(a.code) ?? [];
        arr.push(a);
        existingActivitiesByCode.set(a.code, arr);
        if (!activityEntityIdByCode.has(a.code) || a.status === "published") {
          activityEntityIdByCode.set(a.code, a.entityId);
        }
      }

      const existingLessonsByCode = new Map<
        string,
        Array<{
          id: number;
          entityId: number;
          contentVersion: number;
          status: string;
        }>
      >();
      for (const les of allExistingLessons) {
        const arr = existingLessonsByCode.get(les.code) ?? [];
        arr.push(les);
        existingLessonsByCode.set(les.code, arr);
      }

      // 3. Process seeds in batches / chunks
      const gameLevelSeeds: Array<{
        seed: ContentSeed<unknown, unknown>;
        sequenceIndex: number;
      }> = [];
      const activitySeeds: Array<{
        seed: ActivitySeed;
        sequenceIndex: number;
      }> = [];
      const lessonSeeds: Array<{ seed: LessonSeed; sequenceIndex: number }> =
        [];

      let seq = 0;
      for (const s of seeds) {
        seq++;
        if (s.kind === "activity") {
          activitySeeds.push({
            seed: s as ActivitySeed,
            sequenceIndex: seq,
          });
        } else if (s.kind === "lesson") {
          lessonSeeds.push({ seed: s as LessonSeed, sequenceIndex: seq });
        } else {
          gameLevelSeeds.push({
            seed: s as ContentSeed<unknown, unknown>,
            sequenceIndex: seq,
          });
        }
      }

      // --- Batch Process Game Levels ---
      const CHUNK_SIZE = 1000;
      for (let i = 0; i < gameLevelSeeds.length; i += CHUNK_SIZE) {
        const chunk = gameLevelSeeds.slice(i, i + CHUNK_SIZE);
        const toArchiveLevelIds: number[] = [];
        const levelsToInsert: (typeof gameLevels.$inferInsert)[] = [];
        const preparedMeta: Array<{
          code: string;
          contentVersion: number;
          origin: string;
          rounds: ContentSeedRound[];
          headerInstruction: string;
          headerDifficulty: number;
          contentPack: unknown;
          difficultyParams: unknown;
          skillMapEntries: Array<{ skillId: number; weight: number }>;
          matchedTags: (typeof contentTags.$inferSelect)[];
        }> = [];

        for (const { seed: glSeed, sequenceIndex } of chunk) {
          const { header, content_pack, difficulty_params } = glSeed;

          const template = ALL_TEMPLATES[header.template_code];
          if (!template) {
            throw new AppError(
              "VALIDATION_FAILED",
              `Template ${header.template_code} không tồn tại.`
            );
          }

          const existingList = existingLevelsByCode.get(header.code) ?? [];
          const exactMatch = existingList.find(
            (e) => e.contentVersion === header.content_version
          );
          if (exactMatch) {
            totalSkipped++;
            continue;
          }

          const sortedExisting = [...existingList].sort(
            (a, b) => b.contentVersion - a.contentVersion
          );
          const latest = sortedExisting[0];
          if (latest) {
            if (latest.contentVersion > header.content_version) {
              throw new AppError(
                "VALIDATION_FAILED",
                `Mã ${header.code} đã có version lớn hơn (${latest.contentVersion} > ${header.content_version}).`
              );
            }
            toArchiveLevelIds.push(latest.id);
          }

          const entityId =
            latest?.entityId ??
            Math.floor(Date.now() / 1000) * 1000 + sequenceIndex;

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
              throw new AppError(
                "VALIDATION_FAILED",
                `Skill ${sc} không tồn tại.`
              );
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
            throw new AppError(
              "VALIDATION_FAILED",
              `Tag không hợp lệ hoặc chưa được duyệt trong từ vựng Lớp 1: ${missingTags.join(", ")}`
            );
          }
          validatePublishAxes(matchedTags);

          levelsToInsert.push({
            entityId,
            code: header.code,
            contentVersion: header.content_version,
            templateCode: template.code,
            title: header.title,
            instruction: header.instruction,
            ageMin: header.age_min,
            ageMax: header.age_max,
            difficulty: header.difficulty,
            accessTier: header.access_tier,
            themeId: header.theme_tag || null,
            legacyV1Ref: header.legacy_v1_ref || null,
            contentPack: content_pack,
            difficultyParams: difficulty_params,
            status: "published",
            origin: header.origin,
            authoredIn: header.authored_in,
          });

          preparedMeta.push({
            code: header.code,
            contentVersion: header.content_version,
            origin: header.origin,
            rounds: glSeed.rounds ?? [],
            headerInstruction: header.instruction,
            headerDifficulty: header.difficulty,
            contentPack: content_pack,
            difficultyParams: difficulty_params,
            skillMapEntries,
            matchedTags,
          });
        }

        if (toArchiveLevelIds.length > 0) {
          await tx
            .update(gameLevels)
            .set({ status: "archived" })
            .where(inArray(gameLevels.id, toArchiveLevelIds));
        }

        if (levelsToInsert.length > 0) {
          const insertedLevels = await tx
            .insert(gameLevels)
            .values(levelsToInsert)
            .returning({
              id: gameLevels.id,
              code: gameLevels.code,
              entityId: gameLevels.entityId,
              contentVersion: gameLevels.contentVersion,
            });

          totalInserted += insertedLevels.length;

          const levelByCode = new Map(insertedLevels.map((l) => [l.code, l]));

          const allRounds: (typeof gameLevelRounds.$inferInsert)[] = [];
          const allSkillsToLink: (typeof contentSkillMap.$inferInsert)[] = [];
          const allTagsToLink: (typeof contentTagMap.$inferInsert)[] = [];
          const allReviewLogs: (typeof contentReviewLog.$inferInsert)[] = [];

          for (const meta of preparedMeta) {
            const inserted = levelByCode.get(meta.code);
            if (!inserted) {
              continue;
            }

            // Update in-memory tracking
            const existingArr = existingLevelsByCode.get(meta.code) ?? [];
            existingArr.push({
              id: inserted.id,
              entityId: inserted.entityId,
              contentVersion: inserted.contentVersion,
              status: "published",
            });
            existingLevelsByCode.set(meta.code, existingArr);
            gameLevelEntityIdByCode.set(meta.code, inserted.entityId);

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

            // Review log
            allReviewLogs.push({
              entityType: "game_level",
              entityId: inserted.id,
              contentVersion: meta.contentVersion,
              fromStatus: "draft",
              toStatus: "published",
              actorManagerId: approvedByManagerId || null,
              reason: `Seeded via batch ${batchCode} (origin: ${meta.origin})`,
            });
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
          if (allReviewLogs.length > 0) {
            await tx.insert(contentReviewLog).values(allReviewLogs);
          }
        }
      }

      // --- Process Activities ---
      for (const { seed: actSeed, sequenceIndex } of activitySeeds) {
        const { header } = actSeed;

        const existingList = existingActivitiesByCode.get(header.code) ?? [];
        const exactMatch = existingList.find(
          (e) => e.contentVersion === header.content_version
        );
        if (exactMatch) {
          totalSkipped++;
          continue;
        }

        const sortedExisting = [...existingList].sort(
          (a, b) => b.contentVersion - a.contentVersion
        );
        const latest = sortedExisting[0];
        if (latest) {
          if (latest.contentVersion > header.content_version) {
            throw new AppError(
              "VALIDATION_FAILED",
              `Mã activity ${header.code} đã có version lớn hơn.`
            );
          }
          await tx
            .update(activities)
            .set({ status: "archived" })
            .where(eq(activities.id, latest.id));
        }

        const entityId =
          latest?.entityId ??
          Math.floor(Date.now() / 1000) * 1000 + sequenceIndex;

        const instructionStr =
          typeof header.instruction === "string"
            ? header.instruction
            : JSON.stringify(header.instruction);

        let resolvedRefId = header.ref_id;
        if (
          !resolvedRefId &&
          header.ref_type === "game_level" &&
          header.ref_code
        ) {
          resolvedRefId = gameLevelEntityIdByCode.get(header.ref_code);
        }

        const [newActivity] = await tx
          .insert(activities)
          .values({
            entityId,
            code: header.code,
            contentVersion: header.content_version,
            kind: header.activity_kind,
            title: header.title,
            instruction: instructionStr,
            materials: header.materials,
            estimatedMinutes: header.estimated_minutes,
            refType: header.ref_type,
            refId: resolvedRefId,
            accessTier: header.access_tier,
            status: "published",
            origin: header.origin,
            authoredIn: header.authored_in,
            publishedAt: new Date(),
          })
          .returning();

        if (!newActivity) {
          throw new Error("Failed to insert activity");
        }

        totalInserted++;

        const existingArr = existingActivitiesByCode.get(header.code) ?? [];
        existingArr.push({
          id: newActivity.id,
          entityId: newActivity.entityId,
          contentVersion: newActivity.contentVersion,
          status: "published",
        });
        existingActivitiesByCode.set(header.code, existingArr);
        activityEntityIdByCode.set(header.code, newActivity.entityId);

        // Link skills
        const seenSkillIds = new Set<number>();
        const skillMapEntries: Array<{ skillId: number; weight: number }> = [];
        for (const sc of header.skill_codes) {
          let skill = skillMap.get(sc);
          if (!skill) {
            skill = allSkills[0];
          }
          if (skill && !seenSkillIds.has(skill.id)) {
            seenSkillIds.add(skill.id);
            skillMapEntries.push({
              skillId: skill.id,
              weight: skillMapEntries.length === 0 ? 1.0 : 0.5,
            });
          }
        }
        if (skillMapEntries.length > 0) {
          validateContentSkillMap(skillMapEntries);
          for (const entry of skillMapEntries) {
            await tx
              .insert(contentSkillMap)
              .values({
                entityType: "activity",
                entityId: newActivity.id,
                skillId: entry.skillId,
                weight: entry.weight.toString(),
              })
              .onConflictDoNothing();
          }
        }

        // Tags
        await validateAndAssignTags(
          tx,
          {
            entityType: "activity",
            entityId: newActivity.id,
            tagCodes: [...header.what_tags, ...header.thinking_tags],
          },
          true
        );

        await tx.insert(contentReviewLog).values({
          entityType: "activity",
          entityId: newActivity.id,
          contentVersion: header.content_version,
          fromStatus: "draft",
          toStatus: "published",
          actorManagerId: approvedByManagerId || null,
          reason: `Seeded via batch ${batchCode} (origin: ${header.origin})`,
        });
      }

      // --- Process Lessons ---
      for (const { seed: lesSeed, sequenceIndex } of lessonSeeds) {
        const { header } = lesSeed;

        const existingList = existingLessonsByCode.get(header.code) ?? [];
        const exactMatch = existingList.find(
          (e) => e.contentVersion === header.content_version
        );
        if (exactMatch) {
          totalSkipped++;
          continue;
        }

        const sortedExisting = [...existingList].sort(
          (a, b) => b.contentVersion - a.contentVersion
        );
        const latest = sortedExisting[0];
        if (latest) {
          if (latest.contentVersion > header.content_version) {
            throw new AppError(
              "VALIDATION_FAILED",
              `Mã lesson ${header.code} đã có version lớn hơn.`
            );
          }
          await tx
            .update(lessons)
            .set({ status: "archived" })
            .where(eq(lessons.id, latest.id));
        }

        const entityId =
          latest?.entityId ??
          Math.floor(Date.now() / 1000) * 1000 + sequenceIndex;

        const guideStr =
          typeof header.guide === "string"
            ? header.guide
            : JSON.stringify(header.guide);

        const [newLesson] = await tx
          .insert(lessons)
          .values({
            entityId,
            code: header.code,
            contentVersion: header.content_version,
            title: header.title,
            guide: guideStr,
            targetAgeMin: header.target_age_min,
            targetAgeMax: header.target_age_max,
            estimatedMinutes: header.estimated_minutes,
            materials: header.materials,
            warmUp: header.warm_up,
            reflection: header.reflection,
            assessment: header.assessment,
            extension: header.extension,
            accessTier: header.access_tier,
            status: "published",
            origin: header.origin,
            authoredIn: header.authored_in,
            publishedAt: new Date(),
          })
          .returning();

        if (!newLesson) {
          throw new Error("Failed to insert lesson");
        }

        totalInserted++;

        const existingArr = existingLessonsByCode.get(header.code) ?? [];
        existingArr.push({
          id: newLesson.id,
          entityId: newLesson.entityId,
          contentVersion: newLesson.contentVersion,
          status: "published",
        });
        existingLessonsByCode.set(header.code, existingArr);

        // Link activities
        for (let aIdx = 0; aIdx < header.activity_codes.length; aIdx++) {
          const actCode = header.activity_codes[aIdx];
          if (!actCode) {
            continue;
          }
          const resolvedActivityEntityId =
            activityEntityIdByCode.get(actCode) ?? 0;
          await tx.insert(lessonActivities).values({
            lessonId: newLesson.id,
            position: aIdx + 1,
            activityId: resolvedActivityEntityId,
            isRequired: true,
          });
        }

        // Link skills
        const seenSkillIds = new Set<number>();
        const skillMapEntries: Array<{ skillId: number; weight: number }> = [];
        for (const sc of header.skill_codes) {
          let skill = skillMap.get(sc);
          if (!skill) {
            skill = allSkills[0];
          }
          if (skill && !seenSkillIds.has(skill.id)) {
            seenSkillIds.add(skill.id);
            skillMapEntries.push({
              skillId: skill.id,
              weight: skillMapEntries.length === 0 ? 1.0 : 0.5,
            });
          }
        }
        if (skillMapEntries.length > 0) {
          validateContentSkillMap(skillMapEntries);
          for (const entry of skillMapEntries) {
            await tx
              .insert(contentSkillMap)
              .values({
                entityType: "lesson",
                entityId: newLesson.id,
                skillId: entry.skillId,
                weight: entry.weight.toString(),
              })
              .onConflictDoNothing();
          }
        }

        // Tags
        await validateAndAssignTags(
          tx,
          {
            entityType: "lesson",
            entityId: newLesson.id,
            tagCodes: [...header.what_tags, ...header.thinking_tags],
          },
          false
        );

        await tx.insert(contentReviewLog).values({
          entityType: "lesson",
          entityId: newLesson.id,
          contentVersion: header.content_version,
          fromStatus: "draft",
          toStatus: "published",
          actorManagerId: approvedByManagerId || null,
          reason: `Seeded via batch ${batchCode} (origin: ${header.origin})`,
        });
      }

      // 4. Record seed batch
      await tx.insert(contentSeedBatches).values({
        batchCode,
        kind: inferredKind,
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
  seed: AnyContentSeed,
  existingCodes?: Set<string>
): GateResult[] {
  const codes = existingCodes || new Set<string>();
  const gates = runEightGates(seed, codes);
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
