import { AppError } from "@mindkid/auth";
import { and, desc, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { activities, lessonActivities, lessons } from "#src/schema/content";
import { gameLevels, gameTemplates } from "#src/schema/game";
import { contentReviewLog, contentSeedBatches } from "#src/schema/ops";
import { contentSkillMap } from "#src/schema/tagging";
import { skills } from "#src/schema/taxonomy";
import {
  validateAndAssignTags,
  validateContentSkillMap,
} from "#src/services/tagging";
import { runEightGates } from "./gates/runner.js";
import type {
  ActivitySeed,
  AnyContentSeed,
  ContentSeed,
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

async function checkExistingLevelVersion(
  tx: DbTransaction,
  code: string,
  contentVersion: number
): Promise<{ shouldSkip: boolean; existingEntityId?: number }> {
  const [existing] = await tx
    .select()
    .from(gameLevels)
    .where(eq(gameLevels.code, code));

  if (!existing) {
    return { shouldSkip: false };
  }

  if (existing.contentVersion === contentVersion) {
    return { shouldSkip: true };
  }
  if (existing.contentVersion > contentVersion) {
    throw new AppError(
      "VALIDATION_FAILED",
      `Mã ${code} đã có version lớn hơn.`
    );
  }
  await tx
    .update(gameLevels)
    .set({ status: "archived" })
    .where(eq(gameLevels.id, existing.id));

  return { shouldSkip: false, existingEntityId: existing.entityId };
}

async function linkGameLevelSkills(
  tx: DbTransaction,
  newLevelId: number,
  skillCodes: string[]
): Promise<void> {
  const skillMapEntries: Array<{ skillId: number; weight: number }> = [];
  for (let i = 0; i < skillCodes.length; i++) {
    const sc = skillCodes[i];
    if (!sc) {
      continue;
    }
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
      entityId: newLevelId,
      skillId: entry.skillId,
      weight: entry.weight.toString(),
    });
  }
}

async function processGameLevelSeed(
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

  const { shouldSkip, existingEntityId } = await checkExistingLevelVersion(
    tx,
    header.code,
    header.content_version
  );
  if (shouldSkip) {
    return "skipped";
  }

  const entityId =
    existingEntityId ?? Math.floor(Date.now() / 1000) * 1000 + sequenceIndex;

  const newLevels = await tx
    .insert(gameLevels)
    .values({
      entityId,
      code: header.code,
      contentVersion: header.content_version,
      templateId: template.id,
      title: header.title,
      instruction: header.instruction,
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
  const newLevel = newLevels[0];
  if (!newLevel) {
    throw new Error("Failed to insert game level");
  }

  await linkGameLevelSkills(tx, newLevel.id, header.skill_codes);

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

async function linkEntitySkills(
  tx: DbTransaction,
  entityType: "activity" | "lesson" | "game_level",
  entityId: number,
  skillCodes: string[]
): Promise<void> {
  const seenSkillIds = new Set<number>();
  const skillMapEntries: Array<{ skillId: number; weight: number }> = [];

  for (const sc of skillCodes) {
    let [skill] = await tx.select().from(skills).where(eq(skills.code, sc));
    if (!skill) {
      const [fallbackSkill] = await tx.select().from(skills).limit(1);
      skill = fallbackSkill;
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
          entityType,
          entityId,
          skillId: entry.skillId,
          weight: entry.weight.toString(),
        })
        .onConflictDoNothing();
    }
  }
}

async function processActivitySeed(
  tx: DbTransaction,
  seed: ActivitySeed,
  batchCode: string,
  approvedByManagerId?: number,
  sequenceIndex = 1
): Promise<"inserted" | "skipped"> {
  const { header } = seed;

  const [existingVersion] = await tx
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.code, header.code),
        eq(activities.contentVersion, header.content_version)
      )
    )
    .limit(1);

  if (existingVersion) {
    return "skipped";
  }

  const [existing] = await tx
    .select()
    .from(activities)
    .where(eq(activities.code, header.code))
    .orderBy(desc(activities.contentVersion))
    .limit(1);

  if (existing) {
    if (existing.contentVersion === header.content_version) {
      return "skipped";
    }
    if (existing.contentVersion > header.content_version) {
      throw new AppError(
        "VALIDATION_FAILED",
        `Mã activity ${header.code} đã có version lớn hơn.`
      );
    }
    await tx
      .update(activities)
      .set({ status: "archived" })
      .where(eq(activities.id, existing.id));
  }

  const entityId = existing
    ? existing.entityId
    : Math.floor(Date.now() / 1000) * 1000 + sequenceIndex;

  const instructionStr =
    typeof header.instruction === "string"
      ? header.instruction
      : JSON.stringify(header.instruction);

  let resolvedRefId = header.ref_id;
  if (!resolvedRefId && header.ref_type === "game_level" && header.ref_code) {
    const [gl] = await tx
      .select({ entityId: gameLevels.entityId })
      .from(gameLevels)
      .where(eq(gameLevels.code, header.ref_code))
      .limit(1);
    if (gl) {
      resolvedRefId = gl.entityId;
    }
  }

  const newActivities = await tx
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
  const newActivity = newActivities[0];
  if (!newActivity) {
    throw new Error("Failed to insert activity");
  }

  await linkEntitySkills(tx, "activity", newActivity.id, header.skill_codes);

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

  return "inserted";
}

async function linkLessonActivities(
  tx: DbTransaction,
  lessonId: number,
  activityCodes: string[]
): Promise<void> {
  for (let i = 0; i < activityCodes.length; i++) {
    const actCode = activityCodes[i];
    if (!actCode) {
      continue;
    }
    const [act] = await tx
      .select({ entityId: activities.entityId })
      .from(activities)
      .where(
        and(eq(activities.code, actCode), eq(activities.status, "published"))
      )
      .orderBy(desc(activities.contentVersion))
      .limit(1);

    const resolvedActivityEntityId = act ? act.entityId : 0;

    await tx.insert(lessonActivities).values({
      lessonId,
      position: i + 1,
      activityId: resolvedActivityEntityId,
      isRequired: true,
    });
  }
}

async function assignLessonSkillsAndTags(
  tx: DbTransaction,
  lessonId: number,
  header: LessonSeed["header"]
): Promise<void> {
  await linkEntitySkills(tx, "lesson", lessonId, header.skill_codes);

  await validateAndAssignTags(
    tx,
    {
      entityType: "lesson",
      entityId: lessonId,
      tagCodes: [...header.what_tags, ...header.thinking_tags],
    },
    false
  );
}

async function processLessonSeed(
  tx: DbTransaction,
  seed: LessonSeed,
  batchCode: string,
  approvedByManagerId?: number,
  sequenceIndex = 1
): Promise<"inserted" | "skipped"> {
  const { header } = seed;

  const [existingVersion] = await tx
    .select()
    .from(lessons)
    .where(
      and(
        eq(lessons.code, header.code),
        eq(lessons.contentVersion, header.content_version)
      )
    )
    .limit(1);

  if (existingVersion) {
    return "skipped";
  }

  const [existing] = await tx
    .select()
    .from(lessons)
    .where(eq(lessons.code, header.code))
    .orderBy(desc(lessons.contentVersion))
    .limit(1);

  if (existing) {
    if (existing.contentVersion === header.content_version) {
      return "skipped";
    }
    if (existing.contentVersion > header.content_version) {
      throw new AppError(
        "VALIDATION_FAILED",
        `Mã lesson ${header.code} đã có version lớn hơn.`
      );
    }
    await tx
      .update(lessons)
      .set({ status: "archived" })
      .where(eq(lessons.id, existing.id));
  }

  const entityId = existing
    ? existing.entityId
    : Math.floor(Date.now() / 1000) * 1000 + sequenceIndex;

  const guideStr =
    typeof header.guide === "string"
      ? header.guide
      : JSON.stringify(header.guide);

  const newLessons = await tx
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
  const newLesson = newLessons[0];
  if (!newLesson) {
    throw new Error("Failed to insert lesson");
  }

  await linkLessonActivities(tx, newLesson.id, header.activity_codes);
  await assignLessonSkillsAndTags(tx, newLesson.id, header);

  await tx.insert(contentReviewLog).values({
    entityType: "lesson",
    entityId: newLesson.id,
    contentVersion: header.content_version,
    fromStatus: "draft",
    toStatus: "published",
    actorManagerId: approvedByManagerId || null,
    reason: `Seeded via batch ${batchCode} (origin: ${header.origin})`,
  });

  return "inserted";
}

async function processSingleSeed(
  tx: DbTransaction,
  seed: AnyContentSeed,
  batchCode: string,
  approvedByManagerId?: number,
  sequenceIndex = 1
): Promise<"inserted" | "skipped"> {
  if (seed.kind === "activity") {
    return await processActivitySeed(
      tx,
      seed as ActivitySeed,
      batchCode,
      approvedByManagerId,
      sequenceIndex
    );
  }
  if (seed.kind === "lesson") {
    return await processLessonSeed(
      tx,
      seed as LessonSeed,
      batchCode,
      approvedByManagerId,
      sequenceIndex
    );
  }
  return await processGameLevelSeed(
    tx,
    seed as ContentSeed<unknown, unknown>,
    batchCode,
    approvedByManagerId,
    sequenceIndex
  );
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

  const result = await db
    .transaction(async (tx) => {
      let idx = 0;
      for (const seed of seeds) {
        idx++;
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
