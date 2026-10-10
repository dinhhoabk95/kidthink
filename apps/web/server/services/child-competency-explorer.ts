/**
 * Khám phá trò chơi theo năng lực cho trẻ — `child-competency-explorer.md`, `BR-CCE-01..08`.
 *
 * Lấy danh sách trò chơi theo mã năng lực C1..C6, lọc theo độ tuổi của trẻ,
 * kèm thông tin thành tích (số sao, số lượt chơi).
 */

import { gameLevels, type getOwnerDb, playSessions } from "@mindkid/db";
import { COMPETENCY_CATALOG, deriveAgeBand } from "@mindkid/shared";
import { and, asc, eq, gte, inArray, like, lte, sql } from "drizzle-orm";

type Db = ReturnType<typeof getOwnerDb>;

export interface CompetencyGameItem {
  code: string;
  title: string;
  thumbnail_emoji: string;
  theme_id: string;
  access_tier: "free" | "login" | "standard" | "premium";
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
}

interface AgeBounds {
  min: number;
  max: number;
}

interface LevelStat {
  bestStars: number;
  playCount: number;
}

interface RawGameLevel {
  id: number;
  code: string;
  title: string;
  thumbnailEmoji: string | null;
  themeId: string | null;
  accessTier: "free" | "login" | "standard" | "premium";
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

export function buildCompetencyGames(
  levels: RawGameLevel[],
  statsMap: Map<number, LevelStat>
): CompetencyGameItem[] {
  return levels.map((lvl) => {
    const stat = statsMap.get(lvl.id);
    const isLocked = lvl.accessTier === "premium";

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

  const currentYear = new Date().getFullYear();
  const ageBand = deriveAgeBand(input.birthYear, currentYear);
  const bounds = computeAgeBounds(ageBand);

  // Lấy các game_levels đúng competency và phù hợp độ tuổi
  const levels = await db
    .select({
      id: gameLevels.id,
      code: gameLevels.code,
      title: gameLevels.title,
      thumbnailEmoji: gameLevels.thumbnailEmoji,
      themeId: gameLevels.themeId,
      accessTier: gameLevels.accessTier,
    })
    .from(gameLevels)
    .where(
      and(
        like(gameLevels.code, `GL-${competency.code}-%`),
        eq(gameLevels.status, "published"),
        lte(gameLevels.ageMin, bounds.max),
        gte(gameLevels.ageMax, bounds.min)
      )
    )
    .orderBy(asc(gameLevels.code));

  const levelIds = levels.map((l) => l.id);
  const statsMap = await fetchChildLevelStats(db, input.childId, levelIds);
  const games = buildCompetencyGames(levels, statsMap);

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
