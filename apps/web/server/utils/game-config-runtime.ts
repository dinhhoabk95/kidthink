import { randomUUID } from "node:crypto";
import { AppError } from "@mindkid/auth";
import {
  childProfiles,
  gameLevelRounds,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  playSessions,
} from "@mindkid/db";
import { validateContentPack } from "@mindkid/game-engine";
import {
  type AssetAccessResult,
  assertContentAccess,
  type CallerIdentity,
  resolveAssets,
} from "@mindkid/shared";
import { and, asc, desc, eq } from "drizzle-orm";
import { createError, type H3Event, setHeader, setResponseStatus } from "h3";

export interface GameConfigDeliveryOptions {
  caller: CallerIdentity;
  version?: number;
  isManagerPreview?: boolean;
  requiresChild?: boolean;
  guestDeviceId?: string;
  callerChildAge?: number;
}

interface LevelTemplateRow {
  level: typeof gameLevels.$inferSelect;
  template: typeof gameTemplates.$inferSelect;
}

async function resolveOwnedChild(
  db: ReturnType<typeof getOwnerDb>,
  caller: CallerIdentity
): Promise<typeof childProfiles.$inferSelect | null> {
  if (caller.kind !== "user" || !caller.active_child_id) {
    return null;
  }
  const userId = Number(caller.user_id);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }
  const [child] = await db
    .select()
    .from(childProfiles)
    .where(
      and(
        eq(childProfiles.uuid, caller.active_child_id),
        eq(childProfiles.userId, userId)
      )
    )
    .limit(1);
  if (!child || child.status === "archived") {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }
  return child;
}

async function fetchLevelAndTemplate(
  code: string,
  options: GameConfigDeliveryOptions
): Promise<LevelTemplateRow> {
  const db = getOwnerDb();
  const baseQuery = db
    .select({
      level: gameLevels,
      template: gameTemplates,
    })
    .from(gameLevels)
    .innerJoin(gameTemplates, eq(gameLevels.templateId, gameTemplates.id));

  let rows: LevelTemplateRow[] = [];
  if (options.isManagerPreview && options.version !== undefined) {
    rows = await baseQuery.where(
      and(
        eq(gameLevels.code, code),
        eq(gameLevels.contentVersion, options.version)
      )
    );
  } else if (options.isManagerPreview) {
    rows = await baseQuery
      .where(eq(gameLevels.code, code))
      .orderBy(desc(gameLevels.contentVersion))
      .limit(1);
  } else {
    rows = await baseQuery
      .where(and(eq(gameLevels.code, code), eq(gameLevels.status, "published")))
      .orderBy(desc(gameLevels.contentVersion))
      .limit(1);
  }

  const levelRow = rows[0];
  if (!levelRow) {
    throw createError({
      statusCode: 404,
      statusMessage: "NOT_FOUND",
      data: { code: "NOT_FOUND", message: `Level ${code} not found` },
    });
  }

  return levelRow;
}

async function performAccessControl(
  level: typeof gameLevels.$inferSelect,
  options: GameConfigDeliveryOptions,
  event: H3Event,
  ownedChild: typeof childProfiles.$inferSelect | null
): Promise<AssetAccessResult> {
  try {
    return await assertContentAccess(
      {
        code: level.code,
        access_tier: level.accessTier,
        status: level.status,
        age_min: level.ageMin ?? 3,
        age_max: level.ageMax ?? 6,
        title: level.title,
        thumbnail_emoji: level.thumbnailEmoji ?? undefined,
      },
      {
        caller: options.caller,
        isManagerPreview: options.isManagerPreview,
        managerAudience: options.isManagerPreview,
        requiresChild: options.requiresChild,
        callerChildAge: options.callerChildAge,
        verifyChildOwnership: async (userId, childUuid) =>
          ownedChild !== null &&
          String(ownedChild.uuid) === childUuid &&
          String(ownedChild.userId) === userId,
      }
    );
  } catch (err) {
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: err.toResponse
          ? err.toResponse()
          : { code: err.code, message: err.message },
      });
    }
    throw err;
  }
}

async function createPlaySessionRecord(
  db: ReturnType<typeof getOwnerDb>,
  params: {
    level: { id: number; contentVersion: number; accessTier: string };
    templateId: number;
    ownedChild: { id: number } | null;
    options: GameConfigDeliveryOptions;
    isPreview: boolean;
  }
) {
  const sessionUuid = randomUUID();
  const startedAt = new Date();
  const childProfileId = params.ownedChild?.id ?? null;
  const guestDeviceId = childProfileId
    ? null
    : params.options.guestDeviceId ||
      (params.options.isManagerPreview ? "preview-manager" : "guest-device");
  const layoutSeed = params.options.isManagerPreview
    ? 42
    : Math.floor(Math.random() * 0xff_ff_ff_ff);

  await db.insert(playSessions).values({
    sessionUuid,
    childProfileId,
    guestDeviceId,
    gameLevelId: params.level.id,
    contentVersion: params.level.contentVersion,
    templateId: params.templateId,
    layoutSeed,
    isPreview: params.isPreview,
    completionStatus: "in_progress",
    accessTierAtStart: params.level.accessTier,
    startedAt,
  });

  return { sessionUuid, startedAt, layoutSeed };
}

export async function deliverGameConfig(
  event: H3Event,
  code: string,
  options: GameConfigDeliveryOptions
) {
  const db = getOwnerDb();
  const { level, template } = await fetchLevelAndTemplate(code, options);
  const ownedChild = await resolveOwnedChild(db, options.caller);

  const accessResult = await performAccessControl(
    level,
    options,
    event,
    ownedChild
  );

  // 3. Validate content_pack using Zod schema (BR-CFG-03 / D-FS)
  const validation = validateContentPack(template.code, level.contentPack);
  if (!validation.success) {
    console.error(
      `[ALERT] CONTENT_PACK_INVALID for level ${level.code} v${level.contentVersion}:`,
      validation.error
    );
    setResponseStatus(event, 500);
    throw createError({
      statusCode: 500,
      statusMessage: "CONTENT_PACK_INVALID",
      data: {
        code: "CONTENT_PACK_INVALID",
        message: `Content pack invalid for level ${level.code}`,
        details: validation.error?.details,
      },
    });
  }

  // 3b. WP100.4: Load and validate rounds
  const rounds = await db
    .select({
      round_index: gameLevelRounds.roundIndex,
      instruction: gameLevelRounds.instruction,
      instruction_audio_path: gameLevelRounds.instructionAudioPath,
      content_pack: gameLevelRounds.contentPack,
      difficulty_params: gameLevelRounds.difficultyParams,
      difficulty: gameLevelRounds.difficulty,
    })
    .from(gameLevelRounds)
    .where(eq(gameLevelRounds.gameLevelId, level.id))
    .orderBy(asc(gameLevelRounds.roundIndex));

  for (const round of rounds) {
    const roundValidation = validateContentPack(
      template.code,
      round.content_pack
    );
    if (!roundValidation.success) {
      throw createError({
        statusCode: 422,
        statusMessage: "CONTENT_PACK_INVALID",
        data: {
          code: "CONTENT_PACK_INVALID",
          message: `Round ${round.round_index} content pack invalid`,
          round_index: round.round_index,
          details: roundValidation.error?.details,
        },
      });
    }
  }

  const scoringMode = rounds.length > 1 ? "rounds" : "attempts";

  // 4. Create minimum play_sessions row (D-FR, BR-RNG-06, BR-RNG-07)
  const { sessionUuid, startedAt, layoutSeed } = await createPlaySessionRecord(
    db,
    {
      level,
      templateId: template.id,
      ownedChild,
      options,
      isPreview: accessResult.is_preview,
    }
  );

  // 5. Resolve assets (BR-CFG-07)
  const allContentPacks = [
    level.contentPack,
    ...rounds.map((r) => r.content_pack),
  ];
  const assets = allContentPacks.flatMap((pack) => resolveAssets(pack));

  // 6. Set Cache-Control header (BR-CFG-04 & BR-CFG-05 / D-FT)
  if (level.accessTier === "free" && options.caller.kind === "guest") {
    setHeader(event, "Cache-Control", "public, max-age=300");
  } else {
    setHeader(event, "Cache-Control", "private, no-store");
  }

  // 7. Construct payload §7.1
  return {
    level_code: level.code,
    content_version: level.contentVersion,
    template_code: template.code,
    title: level.title,
    instruction: level.instruction || "",
    instruction_audio_url: level.instructionAudioPath || undefined,
    content_pack: level.contentPack,
    difficulty_params: level.difficultyParams,
    layout_seed: layoutSeed,
    theme_id: level.themeId || "general",
    age_band: `${level.ageMin ?? 3}-${level.ageMax ?? 6}`,
    scoring: {
      ...template.scoring,
      mode: scoringMode,
    },
    rounds: rounds.map((r) => ({
      round_index: r.round_index,
      instruction: r.instruction,
      instruction_audio_path: r.instruction_audio_path,
      content_pack: r.content_pack,
      difficulty_params: r.difficulty_params,
      difficulty: r.difficulty,
    })),
    session: {
      uuid: sessionUuid,
      started_at: startedAt.toISOString(),
    },
    flags: {
      reduced_motion: false,
      audio_enabled: true,
      tap_fallback: template.requires_tap_fallback ?? true,
    },
    assets,
    age_mismatch: accessResult.age_mismatch,
    is_preview: accessResult.is_preview,
  };
}
