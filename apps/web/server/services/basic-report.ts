import { type MasteryLabel, masteryLabel } from "@mindkid/adaptive";
import {
  childDailyStats,
  childProfiles,
  childSessionSummaries,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  skills,
} from "@mindkid/db";
import {
  BASIC_REPORT_DISCLAIMER,
  BASIC_REPORT_MIN_SESSIONS,
  type BasicReportActivitySection,
  type BasicReportCompletionSection,
  type BasicReportFavoriteGameItem,
  type BasicReportFavoriteGamesSection,
  type BasicReportPeriod,
  type BasicReportRecentSessionItem,
  type BasicReportRecentSessionsSection,
  type BasicReportResult,
  type BasicReportSkillItem,
  type BasicReportSkillsTouchedSection,
  type BasicReportSuggestedGame,
  type BasicReportSuggestionItem,
  type BasicReportSuggestionsSection,
  type BasicReportVersionMarker,
  FEATURED_GUEST_LEVELS,
} from "@mindkid/shared";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

interface SessionSummaryRow {
  id: number;
  sessionUuid: string;
  gameLevelId: number;
  contentVersion?: number;
  templateCode: string;
  completionStatus: string;
  score: number;
  durationSeconds: number;
  starsEarned: number;
  hintsUsed: number;
  retriesCount: number;
  completedAt: Date | null;
  createdAt: Date;
}

interface DailyStatRow {
  dateIct: string;
  sessionsCount: number;
  totalPlayTimeSeconds: number;
  levelsAttempted: number;
  levelsCompleted: number;
  skillsTouched: number;
  starsEarned: number;
}

function formatDateIct(date: Date): string {
  const ictMs = date.getTime() + 7 * 3_600_000;
  return new Date(ictMs).toISOString().split("T")[0] ?? "";
}

function computeActivitySection(params: {
  dailyRows: DailyStatRow[];
  sessionRows: SessionSummaryRow[];
  period: BasicReportPeriod;
}): BasicReportActivitySection {
  const { dailyRows, sessionRows, period } = params;

  const dailySessions = dailyRows.reduce((sum, r) => sum + r.sessionsCount, 0);
  const dailySeconds = dailyRows.reduce(
    (sum, r) => sum + r.totalPlayTimeSeconds,
    0
  );
  const dailyDaysPlayed = dailyRows.filter((r) => r.sessionsCount > 0).length;

  const summarySessions = sessionRows.length;
  const summarySeconds = sessionRows.reduce(
    (sum, r) => sum + r.durationSeconds,
    0
  );
  const summaryDaysSet = new Set<string>();
  for (const s of sessionRows) {
    const refDate = s.completedAt ?? s.createdAt;
    summaryDaysSet.add(formatDateIct(new Date(refDate)));
  }

  const sessionsCount = Math.max(dailySessions, summarySessions);
  const totalSeconds = Math.max(dailySeconds, summarySeconds);
  const totalMinutes =
    totalSeconds > 0 ? Math.max(1, Math.round(totalSeconds / 60)) : 0;
  const daysPlayed = Math.max(dailyDaysPlayed, summaryDaysSet.size);

  const periodText = period === "7d" ? "tuần qua" : "30 ngày qua";
  const explanation =
    sessionsCount === 0
      ? `Bé chưa có hoạt động chơi nào trong ${periodText}.`
      : `Bé chơi ${daysPlayed} ngày trong ${periodText}, tổng ${totalMinutes} phút.`;

  return {
    sessions_count: sessionsCount,
    total_minutes: totalMinutes,
    days_played: daysPlayed,
    explanation,
  };
}

function computeCompletionSection(params: {
  dailyRows: DailyStatRow[];
  sessionRows: SessionSummaryRow[];
}): BasicReportCompletionSection {
  const { dailyRows, sessionRows } = params;

  const dailyAttempted = dailyRows.reduce(
    (sum, r) => sum + r.levelsAttempted,
    0
  );
  const dailyCompleted = dailyRows.reduce(
    (sum, r) => sum + r.levelsCompleted,
    0
  );

  const summaryAttempted = sessionRows.length;
  const summaryCompleted = sessionRows.filter(
    (s) => s.completionStatus === "completed"
  ).length;

  const levelsAttempted = Math.max(dailyAttempted, summaryAttempted);
  const levelsCompleted = Math.min(
    levelsAttempted,
    Math.max(dailyCompleted, summaryCompleted)
  );

  const explanation =
    levelsAttempted === 0
      ? "Bé chưa bắt đầu lượt chơi nào trong khoảng thời gian này."
      : `Bé hoàn thành ${levelsCompleted} trên ${levelsAttempted} lần chơi.`;

  return {
    levels_completed: levelsCompleted,
    levels_attempted: levelsAttempted,
    explanation,
  };
}

function estimateRollupRatio(sessions: SessionSummaryRow[]): number {
  if (sessions.length === 0) {
    return 0.1;
  }
  let totalScore = 0;
  for (const s of sessions) {
    const completedWeight = s.completionStatus === "completed" ? 0.55 : 0.2;
    const starWeight = Math.min(3, Math.max(0, s.starsEarned)) / 3;
    totalScore += completedWeight + starWeight * 0.4;
  }
  return Math.min(0.95, Math.max(0.05, totalScore / sessions.length));
}

function computeSkillsTouchedSection(params: {
  sessionRows: SessionSummaryRow[];
  dailyRows: DailyStatRow[];
  totalSessionsCount: number;
  skillsByLevelId: Map<number, (typeof skills.$inferSelect)[]>;
}): {
  section: BasicReportSkillsTouchedSection;
  overallLabel: MasteryLabel;
} {
  const { sessionRows, dailyRows, totalSessionsCount, skillsByLevelId } =
    params;

  const sessionsBySkillId = new Map<
    number,
    { skill: typeof skills.$inferSelect; sessions: SessionSummaryRow[] }
  >();

  for (const s of sessionRows) {
    const mappedSkills = skillsByLevelId.get(Number(s.gameLevelId)) ?? [];
    for (const sk of mappedSkills) {
      const skId = Number(sk.id);
      const existing = sessionsBySkillId.get(skId);
      if (existing) {
        existing.sessions.push(s);
      } else {
        sessionsBySkillId.set(skId, { skill: sk, sessions: [s] });
      }
    }
  }

  const isGlobalInsufficient = totalSessionsCount < BASIC_REPORT_MIN_SESSIONS;
  const overallRatio = estimateRollupRatio(sessionRows);
  const overallLabel: MasteryLabel = isGlobalInsufficient
    ? "Chưa có đủ dữ liệu"
    : masteryLabel({
        p_learn: overallRatio,
        attempts_total: totalSessionsCount,
      });

  const items: BasicReportSkillItem[] = [];
  for (const { skill, sessions } of sessionsBySkillId.values()) {
    const sessCount = sessions.length;
    const label: MasteryLabel =
      isGlobalInsufficient || sessCount < BASIC_REPORT_MIN_SESSIONS
        ? "Chưa có đủ dữ liệu"
        : masteryLabel({
            p_learn: estimateRollupRatio(sessions),
            attempts_total: sessCount,
          });

    items.push({
      code: skill.code,
      name: skill.name,
      mastery_label: label,
      sessions_count: sessCount,
    });
  }

  const maxDailySkillsTouched = dailyRows.reduce(
    (max, r) => Math.max(max, r.skillsTouched),
    0
  );
  const count = Math.max(items.length, maxDailySkillsTouched);

  const explanation =
    count === 0
      ? "Bé chưa làm quen kỹ năng nào trong khoảng thời gian này."
      : `Bé đã làm quen ${count} kỹ năng.`;

  return {
    section: {
      count,
      overall_mastery_label: overallLabel,
      items,
      explanation,
    },
    overallLabel,
  };
}

export type BasicReportLevelRow = Pick<
  typeof gameLevels.$inferSelect,
  "id" | "code" | "title" | "thumbnailEmoji"
> & {
  entityId?: number;
  status?: string;
};

function computeFavoriteGamesSection(params: {
  sessionRows: SessionSummaryRow[];
  levelById: Map<number, BasicReportLevelRow>;
}): BasicReportFavoriteGamesSection {
  const { sessionRows, levelById } = params;
  const byLevelCode = new Map<
    string,
    { title: string; playsCount: number; starsEarned: number }
  >();

  for (const s of sessionRows) {
    const level = levelById.get(Number(s.gameLevelId));
    const code = level?.code ?? `GL-LEVEL-${s.gameLevelId}`;
    const title = level?.title ?? `Trò chơi ${code}`;
    const current = byLevelCode.get(code) ?? {
      title,
      playsCount: 0,
      starsEarned: 0,
    };
    current.playsCount += 1;
    current.starsEarned += s.starsEarned;
    byLevelCode.set(code, current);
  }

  const items: BasicReportFavoriteGameItem[] = Array.from(byLevelCode.entries())
    .map(([level_code, data]) => ({
      level_code,
      title: data.title,
      plays_count: data.playsCount,
      stars_earned: data.starsEarned,
    }))
    .sort(
      (a, b) => b.plays_count - a.plays_count || b.stars_earned - a.stars_earned
    )
    .slice(0, 3);

  const topGame = items[0];
  const explanation = topGame
    ? `Bé thích nhất trò ${topGame.title}.`
    : "Chưa có dữ liệu trò chơi yêu thích của bé trong khoảng thời gian này.";

  return {
    items,
    explanation,
  };
}

function computeVersionMarkersAndRecentSessions(params: {
  sessionRows: SessionSummaryRow[];
  levelById: Map<number, BasicReportLevelRow>;
}): {
  recentSessions: BasicReportRecentSessionsSection;
  versionMarkers: BasicReportVersionMarker[];
} {
  const { sessionRows, levelById } = params;

  const versionsByCode = new Map<string, Set<number>>();
  for (const s of sessionRows) {
    const level = levelById.get(Number(s.gameLevelId));
    const code = level?.code ?? `GL-LEVEL-${s.gameLevelId}`;
    const vSet = versionsByCode.get(code) ?? new Set<number>();
    vSet.add(s.contentVersion ?? 1);
    versionsByCode.set(code, vSet);
  }

  const versionMarkers: BasicReportVersionMarker[] = [];
  const multiVersionCodes = new Set<string>();
  for (const [code, vSet] of versionsByCode.entries()) {
    if (vSet.size > 1) {
      multiVersionCodes.add(code);
      const sorted = Array.from(vSet).sort((a, b) => a - b);
      versionMarkers.push({
        level_code: code,
        played_versions: sorted,
        note: `Nội dung đã cập nhật (đã chơi phiên bản v${sorted.join(", v")}).`,
      });
    }
  }

  const sortedRecent = [...sessionRows]
    .sort((a, b) => {
      const timeA = (a.completedAt ?? a.createdAt).getTime();
      const timeB = (b.completedAt ?? b.createdAt).getTime();
      return timeB - timeA;
    })
    .slice(0, 5);

  const items: BasicReportRecentSessionItem[] = sortedRecent.map((s) => {
    const level = levelById.get(Number(s.gameLevelId));
    const code = level?.code ?? `GL-LEVEL-${s.gameLevelId}`;
    const title = level?.title ?? `Trò chơi ${code}`;
    const hasVersionChange = multiVersionCodes.has(code);

    return {
      session_uuid: s.sessionUuid,
      level_code: code,
      title,
      stars_earned: s.starsEarned,
      duration_seconds: s.durationSeconds,
      completed_at: (s.completedAt ?? s.createdAt).toISOString(),
      content_version: s.contentVersion ?? 1,
      version_updated_note: hasVersionChange ? "Nội dung đã cập nhật" : null,
    };
  });

  const explanation =
    items.length === 0
      ? "Chưa có phiên chơi gần đây nào trong khoảng thời gian này."
      : `Ghi nhận ${items.length} phiên chơi gần nhất của bé kèm số sao đạt được.`;

  return {
    recentSessions: {
      items,
      explanation,
    },
    versionMarkers,
  };
}

function buildSuggestedInitialGames(
  allLevels: BasicReportLevelRow[]
): BasicReportSuggestedGame[] {
  const published = allLevels.filter(
    (l) => !l.status || l.status === "published"
  );
  if (published.length >= 3) {
    return published.slice(0, 3).map((l) => ({
      level_code: l.code,
      title: l.title,
      competency_code: l.code.split("-")[1] ?? "C1",
      thumbnail_emoji: l.thumbnailEmoji ?? "🎮",
    }));
  }

  return FEATURED_GUEST_LEVELS.slice(0, 3).map((g) => ({
    level_code: g.code,
    title: g.title,
    competency_code: g.competency,
    thumbnail_emoji: g.emoji,
  }));
}

const HOME_SUGGESTIONS = [
  {
    id: "count-household",
    title: "Đếm đồ vật quanh nhà",
    description: "Cùng bé đếm thìa, cốc hoặc đồ chơi từ 1 đến 10 khi dọn bàn.",
    emoji: "🥄",
  },
] as const;

function computeSuggestionsSection(
  initialGames: BasicReportSuggestedGame[]
): BasicReportSuggestionsSection {
  const items: BasicReportSuggestionItem[] = [];

  for (const game of initialGames.slice(0, 2)) {
    items.push({
      id: `in-app-${game.level_code}`,
      kind: "in_app",
      title: game.title,
      description: `Cùng bé khám phá trò chơi ${game.title} trong ứng dụng.`,
      emoji: game.thumbnail_emoji,
      level_code: game.level_code,
    });
  }

  for (const homeItem of HOME_SUGGESTIONS) {
    if (items.length >= 3) {
      break;
    }
    items.push({
      id: `offline-${homeItem.id}`,
      kind: "offline",
      title: homeItem.title,
      description: homeItem.description,
      emoji: homeItem.emoji,
    });
  }

  const titles = items.map((i) => i.title).join(", ");
  return {
    items,
    explanation: `Tuần tới bé có thể thử: ${titles}.`,
  };
}

function buildLevelSkillMaps(params: {
  allLevels: BasicReportLevelRow[];
  allMappings: (typeof contentSkillMap.$inferSelect)[];
  allSkills: (typeof skills.$inferSelect)[];
}): {
  levelById: Map<number, BasicReportLevelRow>;
  skillsByLevelId: Map<number, (typeof skills.$inferSelect)[]>;
} {
  const { allLevels, allMappings, allSkills } = params;
  const levelById = new Map<number, BasicReportLevelRow>();
  const levelIdsByEntityId = new Map<number, number[]>();

  for (const l of allLevels) {
    const lId = Number(l.id);
    levelById.set(lId, l);
    const eId = Number(l.entityId ?? l.id);
    const list = levelIdsByEntityId.get(eId) ?? [];
    list.push(lId);
    levelIdsByEntityId.set(eId, list);
  }

  const skillById = new Map<number, typeof skills.$inferSelect>();
  for (const sk of allSkills) {
    skillById.set(Number(sk.id), sk);
  }

  const skillsByLevelId = new Map<number, (typeof skills.$inferSelect)[]>();
  for (const m of allMappings) {
    const sk = skillById.get(Number(m.skillId));
    if (!sk) {
      continue;
    }
    const entityId = Number(m.entityId);
    const candidateLevelIds = new Set<number>([
      entityId,
      ...(levelIdsByEntityId.get(entityId) ?? []),
    ]);
    for (const lId of candidateLevelIds) {
      const list = skillsByLevelId.get(lId) ?? [];
      if (!list.some((existing) => Number(existing.id) === Number(sk.id))) {
        list.push(sk);
      }
      skillsByLevelId.set(lId, list);
    }
  }

  return { levelById, skillsByLevelId };
}

export interface BuildBasicReportDataInput {
  child: {
    uuid: string;
    displayName: string;
    birthYear: number;
    avatarId: string | null;
    status: string;
  };
  period: BasicReportPeriod;
  fromDateIct: string;
  toDateIct: string;
  dailyRows: DailyStatRow[];
  sessionRows: SessionSummaryRow[];
  allLevels: BasicReportLevelRow[];
  allMappings: (typeof contentSkillMap.$inferSelect)[];
  allSkills: (typeof skills.$inferSelect)[];
}

export function buildBasicReportFromData(
  input: BuildBasicReportDataInput
): BasicReportResult {
  const {
    child,
    period,
    fromDateIct,
    toDateIct,
    dailyRows,
    sessionRows,
    allLevels,
    allMappings,
    allSkills,
  } = input;

  const { levelById, skillsByLevelId } = buildLevelSkillMaps({
    allLevels,
    allMappings,
    allSkills,
  });

  const activity = computeActivitySection({
    dailyRows,
    sessionRows,
    period,
  });

  const completion = computeCompletionSection({
    dailyRows,
    sessionRows,
  });

  const totalSessionsCount = activity.sessions_count;
  const hasAnySessions = totalSessionsCount > 0;
  const insufficientData = totalSessionsCount < BASIC_REPORT_MIN_SESSIONS;

  let insufficientDataNote: string | null = null;
  if (!hasAnySessions) {
    insufficientDataNote =
      "Bé chưa chơi lần nào. Bố mẹ có thể cùng bé bắt đầu với 3 trò chơi gợi ý bên dưới.";
  } else if (insufficientData) {
    insufficientDataNote =
      "Cần thêm dữ liệu để đánh giá (bé cần hoàn thành ít nhất 3 phiên chơi).";
  }

  const { section: skillsTouched, overallLabel } = computeSkillsTouchedSection({
    sessionRows,
    dailyRows,
    totalSessionsCount,
    skillsByLevelId,
  });

  const favoriteGames = computeFavoriteGamesSection({
    sessionRows,
    levelById,
  });

  const { recentSessions, versionMarkers } =
    computeVersionMarkersAndRecentSessions({
      sessionRows,
      levelById,
    });

  const suggestedInitialGames = buildSuggestedInitialGames(allLevels);
  const suggestions = computeSuggestionsSection(suggestedInitialGames);

  const childStatus = child.status === "archived" ? "archived" : "active";

  return {
    child: {
      uuid: child.uuid,
      display_name: child.displayName,
      birth_year: child.birthYear,
      avatar_id: child.avatarId ?? "default",
      status: childStatus,
      is_archived: childStatus === "archived",
    },
    period,
    from_date: fromDateIct,
    to_date: toDateIct,
    disclaimer: BASIC_REPORT_DISCLAIMER,
    has_any_sessions: hasAnySessions,
    insufficient_data: insufficientData,
    insufficient_data_note: insufficientDataNote,
    overall_mastery_label: overallLabel,
    suggested_initial_games: suggestedInitialGames,
    sections: {
      activity,
      completion,
      skills_touched: skillsTouched,
      favorite_games: favoriteGames,
      recent_sessions: recentSessions,
      suggestions,
    },
    version_markers: versionMarkers,
  };
}

/**
 * BR-BRP-01..08 & spec §4, §5, §7, §8
 * Builds Basic Child Report strictly from rollup tables (child_daily_stats &
 * child_session_summaries), never querying telemetry_events or mastery_state,
 * and never exposing raw p_learn or mastery percentages.
 */
export async function buildBasicReport(params: {
  childId: number;
  period: BasicReportPeriod;
}): Promise<BasicReportResult> {
  const db = getOwnerDb();
  const { childId, period } = params;

  const [child] = await db
    .select()
    .from(childProfiles)
    .where(eq(childProfiles.id, childId));

  if (!child) {
    throw new Error(`Child profile #${childId} not found`);
  }

  const now = new Date();
  const days = period === "30d" ? 30 : 7;
  const startDate = new Date(now.getTime() - days * 86_400_000);
  const fromDateIct = formatDateIct(startDate);
  const toDateIct = formatDateIct(now);

  const [dailyRows, sessionRows, allLevels, allMappings, allSkills] =
    await Promise.all([
      db
        .select()
        .from(childDailyStats)
        .where(
          and(
            eq(childDailyStats.childProfileId, childId),
            gte(childDailyStats.dateIct, fromDateIct),
            lte(childDailyStats.dateIct, toDateIct)
          )
        )
        .orderBy(asc(childDailyStats.dateIct)),
      db
        .select()
        .from(childSessionSummaries)
        .where(
          and(
            eq(childSessionSummaries.childProfileId, childId),
            gte(childSessionSummaries.createdAt, startDate)
          )
        )
        .orderBy(desc(childSessionSummaries.createdAt)),
      db
        .select({
          id: gameLevels.id,
          code: gameLevels.code,
          title: gameLevels.title,
          thumbnailEmoji: gameLevels.thumbnailEmoji,
        })
        .from(gameLevels),
      db
        .select()
        .from(contentSkillMap)
        .where(eq(contentSkillMap.entityType, "game_level")),
      db.select().from(skills).orderBy(asc(skills.position)),
    ]);

  return buildBasicReportFromData({
    child,
    period,
    fromDateIct,
    toDateIct,
    dailyRows,
    sessionRows,
    allLevels,
    allMappings,
    allSkills,
  });
}
