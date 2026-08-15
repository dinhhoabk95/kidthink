import {
  contentReviewLog,
  gameLevels,
  getOwnerDb,
  lessons,
  playSessions,
} from "@kidthink/db";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { createError, defineEventHandler, getRouterParam } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../../utils/admin-auth-runtime.js";

export interface ContentVersionItem {
  id: number;
  code: string;
  version: number;
  status: string;
  title: string;
  created_by_manager_id: number | null;
  reviewed_by_manager_id: number | null;
  published_at: string | null;
  created_at: string;
  play_count: number;
  diff_summary?: Record<string, { before: unknown; after: unknown }>;
  review_logs?: Array<{
    from_status: string;
    to_status: string;
    reason: string | null;
    created_at: string;
  }>;
}

function computeLevelDiff(
  prevRow: typeof gameLevels.$inferSelect,
  r: typeof gameLevels.$inferSelect
): Record<string, { before: unknown; after: unknown }> {
  const diffSummary: Record<string, { before: unknown; after: unknown }> = {};
  if (prevRow.titleVi !== r.titleVi) {
    diffSummary.title = { before: prevRow.titleVi, after: r.titleVi };
  }
  if (prevRow.accessTier !== r.accessTier) {
    diffSummary.access_tier = {
      before: prevRow.accessTier,
      after: r.accessTier,
    };
  }
  if (JSON.stringify(prevRow.contentPack) !== JSON.stringify(r.contentPack)) {
    diffSummary.content_pack = {
      before: prevRow.contentPack,
      after: r.contentPack,
    };
  }
  if (
    JSON.stringify(prevRow.difficultyParams) !==
    JSON.stringify(r.difficultyParams)
  ) {
    diffSummary.difficulty_params = {
      before: prevRow.difficultyParams,
      after: r.difficultyParams,
    };
  }
  return diffSummary;
}

async function fetchGameLevelVersions(
  code: string,
  db: ReturnType<typeof getOwnerDb>
): Promise<ContentVersionItem[]> {
  const rows = await db
    .select()
    .from(gameLevels)
    .where(eq(gameLevels.code, code))
    .orderBy(asc(gameLevels.contentVersion));

  const versionItems: ContentVersionItem[] = [];
  let prevRow: (typeof rows)[0] | null = null;

  for (const r of rows) {
    const [playCountRes] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(playSessions)
      .where(
        and(
          eq(playSessions.gameLevelId, r.id),
          eq(playSessions.status, "completed")
        )
      );

    const logs = await db
      .select()
      .from(contentReviewLog)
      .where(
        and(
          eq(contentReviewLog.entityType, "game_level"),
          eq(contentReviewLog.entityId, r.id)
        )
      )
      .orderBy(desc(contentReviewLog.createdAt));

    const diffSummary = prevRow ? computeLevelDiff(prevRow, r) : undefined;

    versionItems.push({
      id: r.id,
      code: r.code,
      version: r.contentVersion,
      status: r.status,
      title: r.titleVi,
      created_by_manager_id: r.createdByManagerId,
      reviewed_by_manager_id: r.reviewedByManagerId,
      published_at: r.publishedAt?.toISOString() || null,
      created_at: r.createdAt.toISOString(),
      play_count: playCountRes?.count || 0,
      diff_summary: diffSummary,
      review_logs: logs.map((l) => ({
        from_status: l.fromStatus,
        to_status: l.toStatus,
        reason: l.reason,
        created_at: l.createdAt.toISOString(),
      })),
    });

    prevRow = r;
  }
  return versionItems;
}

async function fetchLessonVersions(
  code: string,
  db: ReturnType<typeof getOwnerDb>
): Promise<ContentVersionItem[]> {
  const rows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.code, code))
    .orderBy(asc(lessons.contentVersion));

  const versionItems: ContentVersionItem[] = [];

  for (const r of rows) {
    const logs = await db
      .select()
      .from(contentReviewLog)
      .where(
        and(
          eq(contentReviewLog.entityType, "lesson"),
          eq(contentReviewLog.entityId, r.id)
        )
      )
      .orderBy(desc(contentReviewLog.createdAt));

    versionItems.push({
      id: r.id,
      code: r.code,
      version: r.contentVersion,
      status: r.status,
      title: r.titleVi,
      created_by_manager_id: r.createdByManagerId,
      reviewed_by_manager_id: r.reviewedByManagerId,
      published_at: r.publishedAt?.toISOString() || null,
      created_at: r.createdAt.toISOString(),
      play_count: 0,
      review_logs: logs.map((l) => ({
        from_status: l.fromStatus,
        to_status: l.toStatus,
        reason: l.reason,
        created_at: l.createdAt.toISOString(),
      })),
    });
  }
  return versionItems;
}

export default defineEventHandler(async (event) => {
  try {
    await requireManagerSession(event);
    const typeParam = getRouterParam(event, "type");
    const code = getRouterParam(event, "code");

    if (!(typeParam && code)) {
      throw createError({
        statusCode: 404,
        statusMessage: "NOT_FOUND",
      });
    }

    const db = getOwnerDb();
    let versionItems: ContentVersionItem[] = [];

    if (typeParam === "game_level") {
      versionItems = await fetchGameLevelVersions(code, db);
    } else if (typeParam === "lesson") {
      versionItems = await fetchLessonVersions(code, db);
    }

    return {
      code,
      versions: versionItems.reverse(), // latest first
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
