import {
  activities,
  contentSkillMap,
  gameLevels,
  getOwnerDb,
  lessons,
} from "@kidthink/db";
import { and, desc, eq, type SQL } from "drizzle-orm";
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
  priority_tier: 1 | 2 | 3 | 4;
}

async function getSkillsWithPublishedLevels(
  db: ReturnType<typeof getOwnerDb>
): Promise<Set<number>> {
  const rows = await db
    .select({ skillId: contentSkillMap.skillId })
    .from(contentSkillMap)
    .innerJoin(
      gameLevels,
      and(
        eq(contentSkillMap.entityId, gameLevels.id),
        eq(contentSkillMap.entityType, "game_level"),
        eq(gameLevels.status, "published")
      )
    )
    .groupBy(contentSkillMap.skillId);

  return new Set(rows.map((r) => r.skillId));
}

async function fetchGameLevelReviewQueue(
  db: ReturnType<typeof getOwnerDb>,
  options: {
    filterManagerId?: number;
    filterOrigin?: string;
    filterAuthoredIn?: string;
    limit: number;
  },
  publishedSkillIds: Set<number>
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
  if (options.filterAuthoredIn) {
    conditions.push(
      eq(
        gameLevels.authoredIn,
        options.filterAuthoredIn as typeof gameLevels.$inferSelect.authoredIn
      )
    );
  }

  const rows = await db
    .select()
    .from(gameLevels)
    .where(and(...conditions))
    .orderBy(desc(gameLevels.createdAt))
    .limit(options.limit);

  const items: ReviewQueueItem[] = [];

  for (const r of rows) {
    // Check attached skills to see if it qualifies for Tier 2
    const attached = await db
      .select({ skillId: contentSkillMap.skillId })
      .from(contentSkillMap)
      .where(
        and(
          eq(contentSkillMap.entityId, r.id),
          eq(contentSkillMap.entityType, "game_level")
        )
      );

    const hasUncoveredSkill = attached.some(
      (a) => !publishedSkillIds.has(a.skillId)
    );

    let priorityTier: 1 | 2 | 3 | 4 = 4;
    let priorityScore = 10;

    // Tier 1: Curriculum week missing activities (pending_source: P3 - inactive)
    // Tier 2: Skill has 0 published levels
    if (hasUncoveredSkill && attached.length > 0) {
      priorityTier = 2;
      priorityScore = 40;
    } else if (r.contentVersion > 1) {
      // Tier 3: New version of currently published content
      priorityTier = 3;
      priorityScore = 30;
    } else {
      // Tier 4: Standalone content, oldest first
      priorityTier = 4;
      priorityScore = 10;
    }

    items.push({
      id: r.id,
      entity_type: "game_level",
      code: r.code,
      version: r.contentVersion,
      title: r.titleVi,
      origin: r.origin,
      authored_in: r.authoredIn,
      created_by_manager_id: r.createdByManagerId,
      waiting_since: r.updatedAt.toISOString(),
      priority_score: priorityScore,
      priority_tier: priorityTier,
    });
  }

  return items;
}

async function fetchLessonReviewQueue(
  db: ReturnType<typeof getOwnerDb>,
  options: {
    filterManagerId?: number;
    filterOrigin?: string;
    filterAuthoredIn?: string;
    limit: number;
  }
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
  if (options.filterAuthoredIn) {
    conditions.push(
      eq(
        lessons.authoredIn,
        options.filterAuthoredIn as typeof lessons.$inferSelect.authoredIn
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
    priority_tier: r.contentVersion > 1 ? 3 : 4,
  }));
}

async function fetchActivityReviewQueue(
  db: ReturnType<typeof getOwnerDb>,
  options: {
    filterManagerId?: number;
    filterOrigin?: string;
    filterAuthoredIn?: string;
    limit: number;
  }
): Promise<ReviewQueueItem[]> {
  const conditions: SQL<unknown>[] = [
    eq(activities.status, "in_review"),
    eq(activities.authoredIn, "studio"),
  ];

  if (options.filterManagerId) {
    conditions.push(eq(activities.createdByManagerId, options.filterManagerId));
  }
  if (options.filterOrigin) {
    conditions.push(
      eq(
        activities.origin,
        options.filterOrigin as typeof activities.$inferSelect.origin
      )
    );
  }
  if (options.filterAuthoredIn) {
    conditions.push(
      eq(
        activities.authoredIn,
        options.filterAuthoredIn as typeof activities.$inferSelect.authoredIn
      )
    );
  }

  const rows = await db
    .select()
    .from(activities)
    .where(and(...conditions))
    .orderBy(desc(activities.createdAt))
    .limit(options.limit);

  return rows.map((r) => ({
    id: r.id,
    entity_type: "activity",
    code: r.code,
    version: r.contentVersion,
    title: r.titleVi,
    origin: r.origin,
    authored_in: r.authoredIn,
    created_by_manager_id: r.createdByManagerId,
    waiting_since: r.updatedAt.toISOString(),
    priority_score: r.contentVersion > 1 ? 30 : 10,
    priority_tier: r.contentVersion > 1 ? 3 : 4,
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
    const filterAuthoredIn = query.authored_in as string | undefined;
    const limit = Math.min(Number(query.limit) || 50, 50);

    const db = getOwnerDb();
    const publishedSkillIds = await getSkillsWithPublishedLevels(db);
    const items: ReviewQueueItem[] = [];

    if (!filterType || filterType === "game_level") {
      const levelItems = await fetchGameLevelReviewQueue(
        db,
        {
          filterManagerId,
          filterOrigin,
          filterAuthoredIn,
          limit,
        },
        publishedSkillIds
      );
      items.push(...levelItems);
    }

    if (!filterType || filterType === "lesson") {
      const lessonItems = await fetchLessonReviewQueue(db, {
        filterManagerId,
        filterOrigin,
        filterAuthoredIn,
        limit,
      });
      items.push(...lessonItems);
    }

    if (!filterType || filterType === "activity") {
      const activityItems = await fetchActivityReviewQueue(db, {
        filterManagerId,
        filterOrigin,
        filterAuthoredIn,
        limit,
      });
      items.push(...activityItems);
    }

    // Sort by priority_score descending (Tier 2 (40) > Tier 3 (30) > Tier 4 (10))
    // For tie-breaks: oldest waiting_since first (BR-CRQ-08, D-KK)
    items.sort((a, b) => {
      if (b.priority_score !== a.priority_score) {
        return b.priority_score - a.priority_score;
      }
      return (
        new Date(a.waiting_since).getTime() -
        new Date(b.waiting_since).getTime()
      );
    });

    const sliced = items.slice(0, limit);
    const nextCursor =
      items.length > limit ? sliced.at(-1)?.id.toString() : null;

    return {
      items: sliced,
      next_cursor: nextCursor,
      total: items.length,
    };
  } catch (err) {
    return respondToManagerAuthError(event, err);
  }
});
