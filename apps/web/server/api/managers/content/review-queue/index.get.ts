import { gameLevels, getOwnerDb, lessons } from "@kidthink/db";
import { and, desc, eq } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import {
  requireManagerSession,
  respondToManagerAuthError,
} from "../../../../utils/admin-auth-runtime.js";

export interface ReviewQueueItem {
  id: number;
  entity_type: "game_level" | "lesson" | "activity" | "worksheet";
  code: string;
  version: number;
  title: string;
  origin: string;
  authored_in: string;
  created_by_manager_id: number | null;
  waiting_since: string;
  priority_score: number;
}

import type { SQL } from "drizzle-orm";

async function fetchGameLevelReviewQueue(
  db: ReturnType<typeof getOwnerDb>,
  options: { filterManagerId?: number; filterOrigin?: string; limit: number }
): Promise<ReviewQueueItem[]> {
  const conditions: SQL<unknown>[] = [
    eq(gameLevels.status, "in_review"),
    eq(gameLevels.authoredIn, "studio"),
  ];
  if (options.filterManagerId) {
    conditions.push(eq(gameLevels.createdByManagerId, options.filterManagerId));
  }
  if (options.filterOrigin) {
    conditions.push(
      eq(
        gameLevels.origin,
        options.filterOrigin as typeof gameLevels.$inferSelect.origin
      )
    );
  }

  const rows = await db
    .select()
    .from(gameLevels)
    .where(and(...conditions))
    .orderBy(desc(gameLevels.createdAt))
    .limit(options.limit);

  return rows.map((r) => ({
    id: r.id,
    entity_type: "game_level",
    code: r.code,
    version: r.contentVersion,
    title: r.titleVi,
    origin: r.origin,
    authored_in: r.authoredIn,
    created_by_manager_id: r.createdByManagerId,
    waiting_since: r.updatedAt.toISOString(),
    priority_score: r.contentVersion > 1 ? 30 : 10,
  }));
}

async function fetchLessonReviewQueue(
  db: ReturnType<typeof getOwnerDb>,
  options: { filterManagerId?: number; filterOrigin?: string; limit: number }
): Promise<ReviewQueueItem[]> {
  const conditions: SQL<unknown>[] = [
    eq(lessons.status, "in_review"),
    eq(lessons.authoredIn, "studio"),
  ];
  if (options.filterManagerId) {
    conditions.push(eq(lessons.createdByManagerId, options.filterManagerId));
  }
  if (options.filterOrigin) {
    conditions.push(
      eq(
        lessons.origin,
        options.filterOrigin as typeof lessons.$inferSelect.origin
      )
    );
  }

  const rows = await db
    .select()
    .from(lessons)
    .where(and(...conditions))
    .orderBy(desc(lessons.createdAt))
    .limit(options.limit);

  return rows.map((r) => ({
    id: r.id,
    entity_type: "lesson",
    code: r.code,
    version: r.contentVersion,
    title: r.titleVi,
    origin: r.origin,
    authored_in: r.authoredIn,
    created_by_manager_id: r.createdByManagerId,
    waiting_since: r.updatedAt.toISOString(),
    priority_score: r.contentVersion > 1 ? 30 : 10,
  }));
}

export default defineEventHandler(async (event) => {
  try {
    await requireManagerSession(event);
    const query = getQuery(event);

    const filterType = query.entity_type as string | undefined;
    const filterManagerId = query.created_by_manager_id
      ? Number(query.created_by_manager_id)
      : undefined;
    const filterOrigin = query.origin as string | undefined;
    const limit = Math.min(Number(query.limit) || 50, 50);

    const db = getOwnerDb();
    const items: ReviewQueueItem[] = [];

    if (!filterType || filterType === "game_level") {
      const levelItems = await fetchGameLevelReviewQueue(db, {
        filterManagerId,
        filterOrigin,
        limit,
      });
      items.push(...levelItems);
    }

    if (!filterType || filterType === "lesson") {
      const lessonItems = await fetchLessonReviewQueue(db, {
        filterManagerId,
        filterOrigin,
        limit,
      });
      items.push(...lessonItems);
    }

    items.sort((a, b) => b.priority_score - a.priority_score);

    return {
      items: items.slice(0, limit),
      total: items.length,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
