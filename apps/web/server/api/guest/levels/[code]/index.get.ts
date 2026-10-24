import { requireUserAuth } from "@mindkid/auth";
import { childProfiles, gameLevels, getOwnerDb } from "@mindkid/db";
import { ContentArchivedError } from "@mindkid/errors/content";
import { GameLevelNotFoundError } from "@mindkid/errors/game-level";
import { getGameTemplate } from "@mindkid/game-engine/registry";
import {
  type AccessTier,
  allowedTiers,
  type CtaViewer,
  findStrand,
  GUEST_CTA_VIEWER,
  getEffectiveTier,
  resolveLevelCta,
  TIER_ENTITLEMENT,
} from "@mindkid/shared";
import { and, eq, ne } from "drizzle-orm";
import { defineEventHandler, getRouterParam, type H3Event } from "h3";
import { getOptionalActiveChildUuid } from "#server/utils/auth-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import {
  loadRoundSet,
  RUNTIME_SCORING_MODE,
} from "#server/utils/round-set-runtime";

const RE_LEVEL_TAXONOMY = /^GL-(C[1-6])-([A-Z]{2,5})-/;

interface CallerContext {
  allowed: AccessTier[];
  viewer: CtaViewer;
}

async function resolveCallerContext(event: H3Event): Promise<CallerContext> {
  try {
    const userSession = requireUserAuth(event);
    if (userSession) {
      const candidateChildUuid = getOptionalActiveChildUuid(event);
      let activeChildId: string | null = null;
      if (candidateChildUuid) {
        const db = getOwnerDb();
        const [ownedChild] = await db
          .select({ uuid: childProfiles.uuid })
          .from(childProfiles)
          .where(
            and(
              eq(childProfiles.uuid, candidateChildUuid),
              eq(childProfiles.userId, userSession.user_id),
              eq(childProfiles.status, "active")
            )
          )
          .limit(1);
        activeChildId = ownedChild?.uuid ?? null;
      }
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

function resolveLevelTaxonomyMeta(levelCode: string) {
  const taxonomyMatch = levelCode.match(RE_LEVEL_TAXONOMY);
  const competency = taxonomyMatch ? taxonomyMatch[1] : "C1";
  const rawStrandCode = taxonomyMatch
    ? `${taxonomyMatch[1]}.${taxonomyMatch[2]}`
    : "";
  const strandInfo = rawStrandCode ? findStrand(rawStrandCode) : undefined;
  return {
    competency,
    strand_code: strandInfo?.code ?? rawStrandCode,
    strand_name: strandInfo?.name ?? "",
  };
}

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) {
    throw new GameLevelNotFoundError();
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
      thumbnailEmoji: gameLevels.thumbnailEmoji,
      templateCode: gameLevels.templateCode,
      contentVersion: gameLevels.contentVersion,
      // WP167.1: cần cho vòng mặc định khi level chưa có hàng game_level_rounds
      instruction: gameLevels.instruction,
      instructionAudioPath: gameLevels.instructionAudioPath,
      contentPack: gameLevels.contentPack,
      difficultyParams: gameLevels.difficultyParams,
    })
    .from(gameLevels)
    .where(eq(gameLevels.code, code));

  if (!level) {
    throw new GameLevelNotFoundError(code);
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

    throw new ContentArchivedError("Trò chơi này đã ngừng phát hành", {
      code: level.code,
      alternatives,
    });
  }

  if (level.status !== "published") {
    throw new GameLevelNotFoundError(code);
  }

  const { allowed, viewer } = await resolveCallerContext(event);
  const callerKind = viewer.is_authenticated ? "user" : "guest";
  const effectiveTier = getEffectiveTier(level.accessTier, null, {
    code: level.code,
    callerKind,
  });
  const isLocked = !allowed.includes(effectiveTier);

  const taxonomyMeta = resolveLevelTaxonomyMeta(level.code);

  const relatedLevels = await db
    .select({
      code: gameLevels.code,
      title: gameLevels.title,
      difficulty: gameLevels.difficulty,
      access_tier: gameLevels.accessTier,
      ageMin: gameLevels.ageMin,
      ageMax: gameLevels.ageMax,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
    })
    .from(gameLevels)
    .where(and(eq(gameLevels.status, "published"), ne(gameLevels.code, code)))
    .limit(4);

  const cta = resolveLevelCta(code, effectiveTier, viewer);

  // WP167.1: cùng một nguồn với đường config — trước đây đây là bản chép thứ hai
  // của cùng truy vấn, kèm cả dòng `rounds.length > 1 ? "rounds" : "attempts"`.
  const rounds = await loadRoundSet(db, level);

  const template = getGameTemplate(level.templateCode);

  return {
    code: level.code,
    title: level.title,
    description:
      level.description ||
      `Trò chơi rèn luyện tư duy cho trẻ ${level.ageMin}–${level.ageMax} tuổi`,
    competency: taxonomyMeta.competency,
    strand_code: taxonomyMeta.strand_code,
    strand_name: taxonomyMeta.strand_name,
    thumbnail_emoji: level.thumbnailEmoji ?? undefined,
    age_min: level.ageMin,
    age_max: level.ageMax,
    age_band: `${level.ageMin}-${level.ageMax}`,
    difficulty: level.difficulty,
    theme_id: level.themeId,
    template_code: level.templateCode,
    template_name: template?.name || "",
    mechanic_type: template?.mechanic || "",
    access_tier: level.accessTier,
    locked: isLocked,
    required_entitlement: isLocked ? TIER_ENTITLEMENT[effectiveTier] : null,
    scoring: {
      mode: RUNTIME_SCORING_MODE,
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
    related_games: relatedLevels.map((g) => {
      const relatedTier = getEffectiveTier(g.access_tier, null, {
        code: g.code,
        callerKind,
      });
      return {
        code: g.code,
        title: g.title,
        difficulty: g.difficulty,
        access_tier: g.access_tier,
        locked: !allowed.includes(relatedTier),
        age_band:
          g.ageMin != null && g.ageMax != null
            ? `${g.ageMin}-${g.ageMax}`
            : "3-6",
        emoji: g.thumbnailEmoji ?? undefined,
      };
    }),
  };
});
