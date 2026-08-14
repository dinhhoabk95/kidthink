import { gameLevels, gameTemplates, getOwnerDb } from "@kidthink/db";
import { allowedTiers } from "@kidthink/shared";
import { and, eq, ne } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";

const RE_COMPETENCY = /GL-(C[1-6])-/;

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  const db = getOwnerDb();

  // Query level and template join
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
      mechanicType: gameTemplates.mechanicType,
      contentVersion: gameLevels.contentVersion,
    })
    .from(gameLevels)
    .leftJoin(gameTemplates, eq(gameLevels.templateId, gameTemplates.id))
    .where(eq(gameLevels.code, code));

  if (!level) {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  // BR-GDP-03 & D-IA: Archived games return HTTP 410 Gone with alternative suggestions
  if (level.status === "archived") {
    // Find alternatives (up to 3 published games in same age band)
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

  // For guest, only published levels are visible
  if (level.status !== "published") {
    throw createError({ statusCode: 404, statusMessage: "NOT_FOUND" });
  }

  // Determine gating & lock state
  const guestAllowed = allowedTiers({ kind: "guest" });
  const isLocked = !guestAllowed.includes(level.accessTier);

  // Derive competency from code prefix (e.g. GL-C1-001 -> C1)
  const competencyMatch = level.code.match(RE_COMPETENCY);

  const competency = competencyMatch ? competencyMatch[1] : "C1";

  // Find related games (up to 4 published levels)
  const relatedLevels = await db
    .select({
      code: gameLevels.code,
      title: gameLevels.name,
      difficulty: gameLevels.difficulty,
      access_tier: gameLevels.accessTier,
    })
    .from(gameLevels)
    .where(and(eq(gameLevels.status, "published"), ne(gameLevels.code, code)))
    .limit(4);

  // BR-GDP-06: Compute required CTA and tier
  let ctaText = "Cho bé chơi ngay";
  let ctaAction = "play";
  if (level.accessTier === "login") {
    ctaText = "Đăng nhập để chơi";
    ctaAction = "login";
  } else if (level.accessTier === "standard") {
    ctaText = "Nâng cấp Gói Tiêu chuẩn";
    ctaAction = "upgrade_standard";
  } else if (level.accessTier === "premium") {
    ctaText = "Nâng cấp Gói Premium";
    ctaAction = "upgrade_premium";
  }

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
    mechanic_type: level.mechanicType,
    access_tier: level.accessTier,
    locked: isLocked,
    cta: {
      text: ctaText,
      action: ctaAction,
    },
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
      locked: !guestAllowed.includes(g.access_tier),
    })),
  };
});
