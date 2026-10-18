/**
 * Khám phá trò chơi theo năng lực cho trẻ — `child-competency-explorer.md`, `BR-CCE-01..08`.
 *
 * Lấy danh sách trò chơi theo mã năng lực C1..C6, xếp hạng ưu tiên trò chơi
 * đúng độ tuổi của trẻ (`BR-CCE-02`), tính quyền mở khoá theo entitlement gia đình,
 * kèm thông tin thành tích (số sao, số lượt chơi).
 */

import { gameLevels, type getOwnerDb, playSessions } from "@mindkid/db";
import {
  type AccessTier,
  COMPETENCY_CATALOG,
  deriveAgeBand,
  getEffectiveTier,
} from "@mindkid/shared";
import { and, asc, eq, inArray, like, sql } from "drizzle-orm";

type Db = ReturnType<typeof getOwnerDb>;

export interface CompetencyGameItem {
  code: string;
  title: string;
  thumbnail_emoji: string;
  theme_id: string;
  access_tier: AccessTier;
  is_locked: boolean;
  best_stars: number;
  play_count: number;
}

export interface ChildCompetencyResponse {
  competency: {
    code: string;
    name: string;
    tagline: string;
    icon_path: string;
  };
  child: {
    uuid: string;
    display_name: string;
    age_band: string;
  };
  games: CompetencyGameItem[];
}

export interface GetChildCompetencyInput {
  childId: number;
  childUuid: string;
  childDisplayName: string;
  birthYear: number;
  competencyCode: string;
  allowedTiers?: readonly AccessTier[];
  now?: Date;
}

export interface AgeBounds {
  min: number;
  max: number;
}

export interface LevelStat {
  bestStars: number;
  playCount: number;
}

export interface RawGameLevel {
  id: number;
  code: string;
  title: string;
  thumbnailEmoji: string | null;
  themeId: string | null;
  accessTier: AccessTier;
  ageMin?: number | null;
  ageMax?: number | null;
}

export function resolveTargetCompetency(code: string) {
  const normalized = code.trim().toUpperCase();
  const entry = COMPETENCY_CATALOG.find((c) => c.code === normalized);
  if (!entry) {
    return null;
  }
  return {
    code: entry.code,
    name: entry.name,
    tagline: entry.tagline ?? entry.short,
    icon_path: `/competencies/${entry.code.toLowerCase()}.svg`,
  };
}

export function computeAgeBounds(ageBand: string): AgeBounds {
  if (ageBand === "3-4") {
    return { min: 3, max: 4 };
  }
  if (ageBand === "4-5") {
    return { min: 4, max: 5 };
  }
  return { min: 5, max: 6 };
}

/**
 * Kiểm tra khoảng tuổi của level có giao với `age_band` của trẻ hay không (`BR-CCE-02`).
 */
export function fitsAgeBounds(
  level: { ageMin?: number | null; ageMax?: number | null },
  bounds: AgeBounds
): boolean {
  const min = level.ageMin ?? bounds.min;
  const max = level.ageMax ?? bounds.max;
  if (min === max) {
    return min >= bounds.min && max <= bounds.max;
  }
  return Math.min(max, bounds.max) > Math.max(min, bounds.min);
}

/**
 * `BR-CCE-02`: Trò chơi hợp `age_band` của trẻ xếp lên trước; trò chơi ngoài độ tuổi
 * vẫn hiển thị, xếp sau và không bị chặn.
 */
export function sortCompetencyLevels<
  T extends { code: string; ageMin?: number | null; ageMax?: number | null },
>(levels: readonly T[], bounds: AgeBounds): T[] {
  return [...levels].sort((a, b) => {
    const aRank = fitsAgeBounds(a, bounds) ? 0 : 1;
    const bRank = fitsAgeBounds(b, bounds) ? 0 : 1;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return a.code.localeCompare(b.code);
  });
}

export async function fetchChildLevelStats(
  db: Db,
  childId: number,
  levelIds: number[]
): Promise<Map<number, LevelStat>> {
  const statsMap = new Map<number, LevelStat>();
  if (levelIds.length === 0) {
    return statsMap;
  }

  const rows = await db
    .select({
      gameLevelId: playSessions.gameLevelId,
      bestStars:
        sql<number>`COALESCE(MAX(${playSessions.starsEarned}), 0)`.mapWith(
          Number
        ),
      playCount: sql<number>`COUNT(${playSessions.id})`.mapWith(Number),
    })
    .from(playSessions)
    .where(
      and(
        eq(playSessions.childProfileId, childId),
        inArray(playSessions.gameLevelId, levelIds)
      )
    )
    .groupBy(playSessions.gameLevelId);

  for (const r of rows) {
    statsMap.set(r.gameLevelId, {
      bestStars: r.bestStars,
      playCount: r.playCount,
    });
  }

  return statsMap;
}

const DEFAULT_USER_CHILD_ALLOWED_TIERS: readonly AccessTier[] = [
  "free",
  "login",
];

export function buildCompetencyGames(
  levels: readonly RawGameLevel[],
  statsMap: Map<number, LevelStat>,
  allowedTiers: readonly AccessTier[] = DEFAULT_USER_CHILD_ALLOWED_TIERS
): CompetencyGameItem[] {
  const allowedSet = new Set<AccessTier>(allowedTiers);

  return levels.map((lvl) => {
    const stat = statsMap.get(lvl.id);
    const effectiveTier = getEffectiveTier(lvl.accessTier, undefined, {
      code: lvl.code,
      callerKind: "user",
    });
    const isLocked = !allowedSet.has(effectiveTier);

    return {
      code: lvl.code,
      title: lvl.title,
      thumbnail_emoji: lvl.thumbnailEmoji ?? "🎮",
      theme_id: lvl.themeId ?? "",
      access_tier: lvl.accessTier,
      is_locked: isLocked,
      best_stars: stat?.bestStars ?? 0,
      play_count: stat?.playCount ?? 0,
    };
  });
}

export async function getChildCompetencyGames(
  input: GetChildCompetencyInput,
  db: Db
): Promise<ChildCompetencyResponse | null> {
  const competency = resolveTargetCompetency(input.competencyCode);
  if (!competency) {
    return null;
  }

  const currentYear = (input.now ?? new Date()).getFullYear();
  const ageBand = deriveAgeBand(input.birthYear, currentYear);
  const bounds = computeAgeBounds(ageBand);

  // Lấy toàn bộ game_levels published của năng lực; tuổi chỉ dùng để xếp hạng (BR-CCE-02)
  const rawLevels = await db
    .select({
      id: gameLevels.id,
      code: gameLevels.code,
      title: gameLevels.title,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
      themeId: gameLevels.themeId,
      accessTier: gameLevels.accessTier,
      ageMin: gameLevels.ageMin,
      ageMax: gameLevels.ageMax,
    })
    .from(gameLevels)
    .where(
      and(
        like(gameLevels.code, `GL-${competency.code}-%`),
        eq(gameLevels.status, "published")
      )
    )
    .orderBy(asc(gameLevels.code));

  const orderedLevels = sortCompetencyLevels(rawLevels, bounds);
  const levelIds = orderedLevels.map((l) => l.id);
  const statsMap = await fetchChildLevelStats(db, input.childId, levelIds);
  const games = buildCompetencyGames(
    orderedLevels,
    statsMap,
    input.allowedTiers
  );

  return {
    competency,
    child: {
      uuid: input.childUuid,
      display_name: input.childDisplayName,
      age_band: ageBand,
    },
    games,
  };
}
