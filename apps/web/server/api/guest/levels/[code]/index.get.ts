import { requireUserAuth } from "@mindkid/auth";
import {
  gameLevelRounds,
  gameLevels,
  gameTemplates,
  getOwnerDb,
} from "@mindkid/db";
import {
  type AccessTier,
  allowedTiers,
  type CtaViewer,
  GUEST_CTA_VIEWER,
  resolveLevelCta,
  TIER_ENTITLEMENT,
} from "@mindkid/shared";
import { and, asc, eq, ne } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  getRouterParam,
  type H3Event,
} from "h3";
import { getOptionalActiveChildUuid } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";

const RE_COMPETENCY = /GL-(C[1-6])-/;

interface CallerContext {
  allowed: AccessTier[];
  viewer: CtaViewer;
}

async function resolveCallerContext(event: H3Event): Promise<CallerContext> {
  try {
    const userSession = requireUserAuth(event);
    if (userSession) {
      const activeChildId = getOptionalActiveChildUuid(event);
      const activeKeys = await resolveUserActiveEntitlements(
        userSession.user_id
      );
      const allowed = await allowedTiers(
        {
          kind: "user",
          user_id: String(userSession.user_id),
          active_child_id: activeChildId,
        },
        activeKeys
      );
      return {
        allowed,
        viewer: {
          is_authenticated: true,
          has_active_child: Boolean(activeChildId),
          active_keys: activeKeys,
        },
      };
    }
  } catch {
    // Guest caller
  }

  const allowed = await allowedTiers({ kind: "guest" });
  return { allowed, viewer: GUEST_CTA_VIEWER };
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const db = getOwnerDb();

  const [level] = await db
    .select({
      id: gameLevels.id,
      code: gameLevels.code,
      title: gameLevels.title,
      description: gameLevels.description,
      status: gameLevels.status,
      accessTier: gameLevels.accessTier,
      difficulty: gameLevels.difficulty,
      ageMin: gameLevels.ageMin,
      ageMax: gameLevels.ageMax,
      themeId: gameLevels.themeId,
      templateId: gameLevels.templateId,
      templateCode: gameTemplates.code,
      templateName: gameTemplates.name,
      mechanic: gameTemplates.mechanic,
      contentVersion: gameLevels.contentVersion,
    })
    .from(gameLevels)
    .leftJoin(gameTemplates, eq(gameLevels.templateId, gameTemplates.id))
    .where(eq(gameLevels.code, code));

  if (!level) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  if (level.status === "archived") {
    const alternatives = await db
      .select({
        code: gameLevels.code,
        title: gameLevels.title,
        access_tier: gameLevels.accessTier,
      })
      .from(gameLevels)
      .where(and(eq(gameLevels.status, "published"), ne(gameLevels.code, code)))
      .limit(3);

    throw createError({
      statusCode: 410,
      statusMessage: "GONE",
      message: "Trò chơi này đã ngừng phát hành",
      data: {
        code: level.code,
        alternatives,
      },
    });
  }

  if (level.status !== "published") {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const { allowed, viewer } = await resolveCallerContext(event);
  const isLocked = !allowed.includes(level.accessTier as AccessTier);

  const competencyMatch = level.code.match(RE_COMPETENCY);
  const competency = competencyMatch ? competencyMatch[1] : "C1";

  const relatedLevels = await db
    .select({
      code: gameLevels.code,
      title: gameLevels.title,
      difficulty: gameLevels.difficulty,
      access_tier: gameLevels.accessTier,
    })
    .from(gameLevels)
    .where(and(eq(gameLevels.status, "published"), ne(gameLevels.code, code)))
    .limit(4);

  const cta = resolveLevelCta(code, level.accessTier as AccessTier, viewer);

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

  const scoringMode = rounds.length > 1 ? "rounds" : "attempts";

  return {
    code: level.code,
    title: level.title,
    description:
      level.description ||
      `Trò chơi rèn luyện tư duy cho trẻ ${level.ageMin}–${level.ageMax} tuổi`,
    competency,
    age_min: level.ageMin,
    age_max: level.ageMax,
    age_band: `${level.ageMin}-${level.ageMax}`,
    difficulty: level.difficulty,
    theme_id: level.themeId,
    template_code: level.templateCode,
    template_name: level.templateName,
    mechanic_type: level.mechanic,
    access_tier: level.accessTier,
    locked: isLocked,
    required_entitlement: isLocked
      ? TIER_ENTITLEMENT[level.accessTier as AccessTier]
      : null,
    scoring: {
      mode: scoringMode,
    },
    rounds: isLocked
      ? rounds.map((r) => ({
          round_index: r.round_index,
          instruction: r.instruction,
        }))
      : rounds.map((r) => ({
          round_index: r.round_index,
          instruction: r.instruction,
          instruction_audio_path: r.instruction_audio_path,
          content_pack: r.content_pack,
          difficulty_params: r.difficulty_params,
          difficulty: r.difficulty,
        })),
    cta,
    preview_images: [
      "/images/previews/game-preview-1.webp",
      "/images/previews/game-preview-2.webp",
      "/images/previews/game-preview-3.webp",
    ],
    related_games: relatedLevels.map((g) => ({
      code: g.code,
      title: g.title,
      difficulty: g.difficulty,
      access_tier: g.access_tier,
      locked: !allowed.includes(g.access_tier as AccessTier),
    })),
  };
});
