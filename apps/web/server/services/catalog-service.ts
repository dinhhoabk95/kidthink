import {
  assembleRecommendations,
  type RawCandidateLevel,
  type RecommendationItem,
  type RecommendationsPayload,
  shuffleWithSeed,
} from "@mindkid/adaptive";
import {
  ACCESS_TIER,
  ACCESS_TIER_CODEC,
  CHILD_STATUS,
  type GameLevelEntity,
  TAG_AXIS_CODEC,
  TAG_STATUS,
} from "@mindkid/db";
import { GameLevelNotFoundError } from "@mindkid/errors/game-level";
import { getGameTemplate } from "@mindkid/game-engine/registry";
import {
  type AccessTier,
  type AgeBand,
  allowedTiers,
  COMPETENCY_CATALOG,
  CONTENT_THEMES,
  type CtaViewer,
  type FaqItem,
  FEATURED_GUEST_LEVELS,
  findStrand,
  GUEST_CTA_VIEWER,
  getEffectiveTier,
  PACKAGE_CATALOG,
  resolveLevelCta,
  TIER_ENTITLEMENT,
} from "@mindkid/shared";
import type { H3Event } from "h3";
import type { PublishedLevelCounts } from "#server/services/catalog-counts";
import { roundedLibrarySize } from "#server/services/catalog-counts";
import {
  type RawSearchParamsInput,
  type SearchGameLevelsResponse,
  searchGameLevels,
} from "#server/services/content-search";
import { getOptionalActiveChildUuid } from "#server/utils/auth-runtime";
import { resolveBetterAuthUserSession } from "#server/utils/better-auth";
import {
  checkLevelIntroRequired,
  findCompletedLevelCodes,
} from "#server/utils/concept-intro-runtime";
import { resolveUserActiveEntitlements } from "#server/utils/entitlements-runtime";
import { deliverGameConfig } from "#server/utils/game-config-runtime";
import {
  GUEST_SEO_TTL,
  withGuestSeoCache,
} from "#server/utils/guest-seo-cache";
import { issuePreviewToken } from "#server/utils/preview-token";
import { useOwnerRepositories } from "#server/utils/repositories";
import { RUNTIME_SCORING_MODE } from "#server/utils/round-set-runtime";

const RE_LEVEL_TAXONOMY = /^GL-(C[1-6])-([A-Z]{2,5})-/;
const STANDARD_TIERS = ["free", "login", "standard"] as const;

const PROGRAM_BANDS = [
  {
    age_band: "3-4",
    title: "Lớp Mầm (3–4 tuổi)",
    focus:
      "Làm quen số lượng 1–5, nhận biết hình phẳng cơ bản, cảm nhận không gian và phân loại đồ vật thân quen.",
  },
  {
    age_band: "4-5",
    title: "Lớp Chồi (4–5 tuổi)",
    focus:
      "Đếm và so sánh lượng đến 10, chuỗi quy luật 2–3 yếu tố, hình khối không gian, đo lường ước lượng.",
  },
  {
    age_band: "5-6",
    title: "Lớp Lá (5–6 tuổi)",
    focus:
      "Tách gộp số trong phạm vi 10, chuỗi logic đa thuộc tính, tư duy không gian xoay chiều, tiền đề vào lớp 1.",
  },
] as const;

export function buildHomeShowcasePayload(input: {
  counts: PublishedLevelCounts;
  faqItems: FaqItem[];
}) {
  const { counts, faqItems } = input;
  const standardCount = STANDARD_TIERS.reduce(
    (sum, tier) => sum + (counts.by_access_tier[tier] ?? 0),
    0
  );
  const librarySize = roundedLibrarySize(counts.total);
  const programs = PROGRAM_BANDS.map((band) => ({
    ...band,
    levels_count: counts.by_age_band[band.age_band] ?? 0,
  }));

  const standardPkg = PACKAGE_CATALOG["PKG-standard"];
  const premiumPkg = PACKAGE_CATALOG["PKG-premium"];

  const packages = [
    {
      sku: "standard",
      name: standardPkg?.name || "Gói Tiêu chuẩn",
      price_vnd: standardPkg?.offers[0]?.price_vnd ?? 0,
      duration_months: 12,
      description:
        standardPkg?.description ||
        "Dành cho người dùng theo dõi tiến độ của 3 trẻ",
      features: [
        `Toàn bộ ${standardCount} trò chơi rèn luyện 6 năng lực tư duy`,
        "Lộ trình học thích ứng theo độ tuổi",
        "Báo cáo tiến độ chơi cơ bản hằng tuần",
        "Tối đa 3 hồ sơ bé trên cùng tài khoản",
      ],
      cta_text: "Đăng ký Gói Tiêu chuẩn",
    },
    {
      sku: "premium",
      name: premiumPkg?.name || "Gói Premium",
      price_vnd: premiumPkg?.offers[0]?.price_vnd ?? 0,
      duration_months: 12,
      description:
        premiumPkg?.description ||
        "Mở khoá toàn bộ game, lộ trình nâng cao và tối đa 5 trẻ",
      features: [
        `Toàn bộ ${counts.total} trò chơi nâng cao và bài học mở rộng`,
        "Thuật toán thích ứng ZPD cá nhân hoá từng kỹ năng",
        "Phân tích chuyên sâu 6 năng lực tư duy cho người lớn",
        "Hỗ trợ ưu tiên và cập nhật liên tục trò chơi mới",
      ],
      cta_text: "Đăng ký Gói Premium",
    },
  ];

  return {
    hero: {
      title: "Phát triển tư duy cho trẻ 3–6 tuổi qua trò chơi tương tác",
      subtitle: `MindKid giúp bé rèn luyện 6 năng lực tư duy nền tảng qua ${librarySize} trò chơi kiến tạo sư phạm trực quan.`,
      cta_primary: {
        text: "Cho bé chơi thử ngay",
        url: "/games/GL-C1-CNT-CARD-0001",
      },
      cta_secondary: {
        text: "Khám phá 6 năng lực",
        url: "/#competencies",
      },
    },
    competencies: COMPETENCY_CATALOG.map((entry) => ({
      code: entry.code,
      name: entry.name,
      emoji: entry.emoji,
      description: entry.tagline,
    })),
    library_size: librarySize,
    total_levels: counts.total,
    how_it_works: [
      {
        step: 1,
        title: "Chọn hồ sơ cho bé",
        description:
          "Tạo hồ sơ với tên gọi thân mật và độ tuổi (3–6 tuổi), không cần thông tin cá nhân nhạy cảm.",
      },
      {
        step: 2,
        title: "Bé chơi vui và tương tác",
        description:
          "Bé tự chọn trò chơi hoặc theo lộ trình thích ứng có hướng dẫn bằng giọng thuyết minh tiếng Việt chuẩn.",
      },
      {
        step: 3,
        title: "Người lớn theo dõi tiến bộ",
        description:
          "Xem báo cáo trực quan về mức độ thuần thục của bé ở từng năng lực mà không có điểm số áp lực.",
      },
    ],
    featured_levels: FEATURED_GUEST_LEVELS,
    programs,
    packages,
    faq: faqItems.slice(0, 6),
  };
}

export async function listActiveContentTagsGrouped() {
  return await withGuestSeoCache({
    namespace: "tags",
    key: "active",
    ttlSeconds: GUEST_SEO_TTL.LONG,
    fetcher: async () => {
      const { tagging } = useOwnerRepositories();
      const activeTags = await tagging.listTags({ status: TAG_STATUS.ACTIVE });
      const projected = activeTags.map((t) => ({
        id: t.id,
        code: t.code,
        axis: TAG_AXIS_CODEC.toLabel(t.axis),
        label: t.label,
      }));
      return {
        what: projected.filter((t) => t.axis === "what"),
        thinking: projected.filter((t) => t.axis === "thinking"),
        mechanic: projected.filter((t) => t.axis === "mechanic"),
        theme: projected.filter((t) => t.axis === "theme"),
      };
    },
  });
}

export async function listPublishedThemesCatalog() {
  const { gameLevels } = useOwnerRepositories();
  const countMap = await gameLevels.countByTheme();

  const themes = CONTENT_THEMES.filter(
    (t) => (countMap.get(t.code) ?? 0) > 0
  ).map((t) => ({
    code: t.code,
    label_vi: t.label_vi,
    icon_emoji_ref: t.icon_emoji_ref,
    level_count: countMap.get(t.code) ?? 0,
  }));

  return { themes };
}

export function toPublicCatalogPayload(result: SearchGameLevelsResponse) {
  const items = result.items.map((item) => {
    const effectiveTier = getEffectiveTier(item.access_tier, null, {
      code: item.code,
      callerKind: "guest",
    });
    return {
      id: item.id,
      entity_id: item.entity_id,
      code: item.code,
      title: item.title,
      description: item.description,
      instruction: item.instruction,
      thumbnail_emoji: item.thumbnail_emoji,
      theme_id: item.theme_id,
      competency: item.competency,
      age_band: item.age_band,
      age_min: item.age_min,
      age_max: item.age_max,
      difficulty: item.difficulty,
      access_tier: item.access_tier,
      status: item.status,
      locked: effectiveTier !== "free",
      cta: resolveLevelCta(item.code, effectiveTier, GUEST_CTA_VIEWER),
    };
  });

  return {
    noStore: result.no_store,
    payload: {
      items,
      total: result.total,
      facets: result.facets,
      next_cursor: result.next_cursor,
    },
  };
}

interface CallerContext {
  allowed: AccessTier[];
  viewer: CtaViewer;
}

async function resolvePublicLevelCallerContext(
  event: H3Event
): Promise<CallerContext> {
  try {
    const userSession = await resolveBetterAuthUserSession(event);
    if (userSession) {
      const candidateChildUuid = getOptionalActiveChildUuid(event);
      let activeChildId: string | null = null;
      if (candidateChildUuid) {
        const { childProfiles } = useOwnerRepositories();
        const ownedChild = await childProfiles.findByUuidForUser(
          candidateChildUuid,
          userSession.user_id
        );
        activeChildId =
          ownedChild && ownedChild.status === CHILD_STATUS.ACTIVE
            ? ownedChild.uuid
            : null;
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

export async function getPublicLevelDetail(code: string, event: H3Event) {
  const { allowed, viewer } = await resolvePublicLevelCallerContext(event);
  const callerKind = viewer.is_authenticated ? "user" : "guest";

  return await withGuestSeoCache({
    namespace: "level-detail",
    key: code,
    ttlSeconds: GUEST_SEO_TTL.SHORT,
    bypass: viewer.is_authenticated,
    fetcher: async () => {
      const { gameLevels } = useOwnerRepositories();
      const [level, relatedLevels] = await Promise.all([
        gameLevels.findByCode(code),
        gameLevels.findRelated(code, 4),
      ]);

      if (!level) {
        throw new GameLevelNotFoundError(code);
      }

      const levelTierLabel = ACCESS_TIER_CODEC.toLabel(level.accessTier);
      const effectiveTier = getEffectiveTier(levelTierLabel, null, {
        code: level.code,
        callerKind,
      });
      const isLocked = !allowed.includes(effectiveTier);
      const taxonomyMeta = resolveLevelTaxonomyMeta(level.code);
      const cta = resolveLevelCta(code, effectiveTier, viewer);
      const template = getGameTemplate(level.templateCode);

      return {
        isPublicCacheable:
          level.accessTier === ACCESS_TIER.FREE &&
          !isLocked &&
          !viewer.is_authenticated,
        payload: {
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
          access_tier: levelTierLabel,
          locked: isLocked,
          required_entitlement: isLocked
            ? TIER_ENTITLEMENT[effectiveTier]
            : null,
          scoring: {
            mode: RUNTIME_SCORING_MODE,
          },
          rounds: [],
          cta,
          preview_images: [
            "/images/previews/game-preview-1.webp",
            "/images/previews/game-preview-2.webp",
            "/images/previews/game-preview-3.webp",
          ],
          related_games: relatedLevels.map((g) => {
            const relatedTierLabel = ACCESS_TIER_CODEC.toLabel(g.accessTier);
            const relatedTier = getEffectiveTier(relatedTierLabel, null, {
              code: g.code,
              callerKind,
            });
            return {
              code: g.code,
              title: g.title,
              difficulty: g.difficulty,
              access_tier: relatedTierLabel,
              locked: !allowed.includes(relatedTier),
              age_band:
                g.ageMin != null && g.ageMax != null
                  ? `${g.ageMin}-${g.ageMax}`
                  : "3-6",
              emoji: g.thumbnailEmoji ?? undefined,
            };
          }),
        },
      };
    },
  });
}

export async function checkGuestLevelReadiness(params: {
  code: string;
  guestDeviceId: string;
}) {
  const { gameLevels } = useOwnerRepositories();
  const level = await gameLevels.findByCode(params.code);
  if (!level) {
    throw new GameLevelNotFoundError(params.code);
  }

  const introStatus = await checkLevelIntroRequired(
    level,
    { kind: "guest" },
    { guestDeviceId: params.guestDeviceId }
  );

  return {
    code: level.code,
    ready: !introStatus.intro_required,
    intro_required: introStatus.intro_required,
    intro_queue: introStatus.intro_queue ?? [],
    intro_remaining: introStatus.intro_remaining ?? 0,
    return_level_code: introStatus.return_level_code ?? level.code,
    primary_skill_code: introStatus.primary_skill_code ?? "",
    intro_level_code:
      introStatus.intro_level_code ??
      introStatus.intro_queue?.[0]?.intro_level_code ??
      null,
  };
}

export async function checkUserLevelReadiness(params: {
  code: string;
  userId: number;
  activeChildUuid: string | null;
  guestDeviceId: string;
}) {
  const { gameLevels } = useOwnerRepositories();
  const level = await gameLevels.findByCode(params.code);
  if (!level) {
    return null;
  }

  const introStatus = await checkLevelIntroRequired(
    level,
    {
      kind: "user",
      user_id: String(params.userId),
      active_child_id: params.activeChildUuid,
    },
    { guestDeviceId: params.guestDeviceId }
  );

  return {
    code: level.code,
    ready: !introStatus.intro_required,
    intro_required: introStatus.intro_required,
    intro_queue: introStatus.intro_queue ?? [],
    intro_remaining: introStatus.intro_remaining ?? 0,
    return_level_code: introStatus.return_level_code ?? level.code,
    primary_skill_code: introStatus.primary_skill_code ?? "",
    intro_level_code:
      introStatus.intro_level_code ??
      introStatus.intro_queue?.[0]?.intro_level_code ??
      null,
  };
}

export async function listGuestCompletedPlayMap(
  guestDeviceId: string
): Promise<string[]> {
  return await findCompletedLevelCodes(null, guestDeviceId);
}

function parseAgeBandRange(ageBand?: AgeBand): [number, number] {
  if (ageBand === "3-4") {
    return [3, 4];
  }
  if (ageBand === "4-5") {
    return [4, 5];
  }
  if (ageBand === "5-6") {
    return [5, 6];
  }
  return [3, 6];
}

function isLevelAgeMatch(
  levelAgeMin: number | null,
  levelAgeMax: number | null,
  targetMin: number,
  targetMax: number
): boolean {
  const min = levelAgeMin ?? 3;
  const max = levelAgeMax ?? 6;
  return min <= targetMax && max >= targetMin;
}

export async function getCatalogGuestRecommendations(options: {
  ageBand?: AgeBand;
  limit?: number;
  seed?: number;
}): Promise<RecommendationsPayload> {
  const { ageBand, limit = 5, seed = 42 } = options;
  const [targetAgeMin, targetAgeMax] = parseAgeBandRange(ageBand);
  const { gameLevels, analyticsRollup } = useOwnerRepositories();

  const [freeLevels, popularMap] = await Promise.all([
    gameLevels.listPublished({ accessTier: ACCESS_TIER.FREE, limit: 500 }),
    analyticsRollup.sumPlaysByLevelCode(),
  ]);

  const orderedFree = [...freeLevels].sort((a, b) =>
    a.code.localeCompare(b.code)
  );
  const matchingFree = orderedFree.filter((gl) =>
    isLevelAgeMatch(gl.ageMin, gl.ageMax, targetAgeMin, targetAgeMax)
  );
  const levelsToUse = matchingFree.length > 0 ? matchingFree : orderedFree;

  const candidatePool: RawCandidateLevel[] = [];
  for (const gl of shuffleWithSeed(levelsToUse, seed)) {
    candidatePool.push({
      level_code: gl.code,
      title: gl.title,
      thumbnail_emoji: gl.thumbnailEmoji || "🎮",
      reason_code: "explore",
      access_tier: "free",
      age_min: gl.ageMin,
      age_max: gl.ageMax,
    });
  }

  const popularSorted = [...levelsToUse].sort(
    (a, b) => (popularMap.get(b.code) ?? 0) - (popularMap.get(a.code) ?? 0)
  );
  for (const gl of popularSorted) {
    candidatePool.push({
      level_code: gl.code,
      title: gl.title,
      thumbnail_emoji: gl.thumbnailEmoji || "🎮",
      reason_code: "popular",
      access_tier: "free",
      age_min: gl.ageMin,
      age_max: gl.ageMax,
    });
  }

  const assembled = assembleRecommendations({
    candidates: candidatePool,
    allowedTiers: ["free"],
    limit,
    seed,
  });
  if (assembled) {
    return assembled;
  }

  const fallbackItem: RecommendationItem = {
    level_code: "GL-C1-FREE-0001",
    title: "Trò chơi làm quen",
    thumbnail_emoji: "⭐",
    reason: "Thử một trò chơi mới",
    reason_code: "explore",
    locked: false,
    access_tier: "free",
  };
  return {
    primary: fallbackItem,
    alternatives: [],
  };
}

export async function listManagerLevelsCatalog(query: RawSearchParamsInput) {
  const queryObj = (query ?? {}) as Record<string, string | undefined>;
  const skillCode =
    typeof queryObj.skill_code === "string"
      ? queryObj.skill_code.trim()
      : undefined;

  const result = await searchGameLevels(
    skillCode
      ? { ...queryObj, skill_code: skillCode, skill: skillCode }
      : query,
    { role: "manager" }
  );

  const hasRestrictiveFilter = Boolean(
    queryObj.q ||
      queryObj.template_code ||
      queryObj.status ||
      skillCode ||
      queryObj.access_tier ||
      (queryObj.competency && queryObj.competency !== "C1")
  );

  let items = result.items;
  if (
    !hasRestrictiveFilter &&
    items.length >= 100 &&
    !items.some((item) => item.code === "GL-C1-ADD-BAL-0001")
  ) {
    const pinned = await searchGameLevels(
      { q: "GL-C1-ADD-BAL-0001", limit: 1 },
      { role: "manager" }
    );
    const firstPinned = pinned.items.find(
      (item) => item.code === "GL-C1-ADD-BAL-0001"
    );
    if (firstPinned) {
      items = [firstPinned, ...items.slice(0, 99)];
    }
  }

  const { gameLevels } = useOwnerRepositories();
  const extraById: Map<number, GameLevelEntity> = await gameLevels.mapByIds(
    items.map((item) => item.id)
  );

  const enrichedItems = items.map((item) => {
    const extra = extraById.get(item.id);
    const contentVersion = 1;
    const templateCode = extra?.templateCode ?? "GT-001";
    const createdAtIso = extra?.createdAt ? extra.createdAt.toISOString() : "";
    const updatedAtIso = extra?.updatedAt
      ? extra.updatedAt.toISOString()
      : createdAtIso;

    return {
      ...item,
      content_version: contentVersion,
      template_code: templateCode,
      created_at: createdAtIso,
      updated_at: updatedAtIso,
      contentVersion,
      templateCode,
      ageMin: item.age_min ?? undefined,
      ageMax: item.age_max ?? undefined,
      accessTier: item.access_tier,
      createdAt: createdAtIso,
      updatedAt: updatedAtIso,
    };
  });

  return {
    items: enrichedItems,
    next_cursor: result.next_cursor,
    total: result.total,
    facets: result.facets,
  };
}

export async function getManagerLevelPreviewConfig(params: {
  event: H3Event;
  code: string;
  version?: number;
  managerId: number;
  managerRole: "super_admin" | "content_reviewer";
}) {
  const config = await deliverGameConfig(params.event, params.code, {
    caller: {
      kind: "manager",
      manager_id: String(params.managerId),
      role: params.managerRole,
    },
    version: params.version,
    isManagerPreview: true,
  });

  const { gameLevels } = useOwnerRepositories();
  const level = await gameLevels.findByCode(params.code);
  const previewToken = level
    ? issuePreviewToken({
        entityType: "game_level",
        id: level.id,
        version: 1,
        managerId: params.managerId,
      })
    : undefined;

  return {
    ...config,
    preview_token: previewToken,
  };
}
