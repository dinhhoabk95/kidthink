import { randomUUID } from "node:crypto";
import { AppError } from "@kidthink/auth";
import {
  childProfiles,
  gameLevels,
  gameTemplates,
  getOwnerDb,
  playSessions,
} from "@kidthink/db";
import { validateContentPack } from "@kidthink/game-engine";
import {
  type AssetAccessResult,
  assertContentAccess,
  type CallerIdentity,
  resolveAssets,
} from "@kidthink/shared";
import { and, desc, eq } from "drizzle-orm";
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
        title_vi: level.titleVi,
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

  // 4. Create minimum play_sessions row (D-FR)
  const sessionUuid = randomUUID();
  const startedAt = new Date();
  const childProfileId = ownedChild?.id ?? null;
  const guestDeviceId = childProfileId
    ? null
    : options.guestDeviceId ||
      (options.isManagerPreview ? "preview-manager" : "guest-device");

  await db.insert(playSessions).values({
    sessionUuid,
    childProfileId,
    guestDeviceId,
    gameLevelId: level.id,
    contentVersion: level.contentVersion,
    templateId: template.id,
    isPreview: accessResult.is_preview,
    completionStatus: "in_progress",
    accessTierAtStart: level.accessTier,
    startedAt,
  });

  // 5. Resolve assets (BR-CFG-07)
  const assets = resolveAssets(level.contentPack);

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
    title_vi: level.titleVi,
    instruction_vi: level.instructionVi || "",
    instruction_audio_url: level.instructionAudioPath || undefined,
    content_pack: level.contentPack,
    difficulty_params: level.difficultyParams,
    theme_id: level.themeId || "general",
    age_band: `${level.ageMin ?? 3}-${level.ageMax ?? 6}`,
    scoring: template.scoring,
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
