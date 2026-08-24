import {
  activities,
  contentSkillMap,
  curricula,
  curriculumItems,
  gameLevels,
  getOwnerDb,
  lessons,
} from "@mindkid/db";
import { and, desc, eq, type SQL, sql } from "drizzle-orm";
import { defineEventHandler, getQuery } from "h3";
import { requireManagerSession } from "#server/utils/admin-auth-runtime";

export interface ReviewQueueItem {
  id: number;
  entity_type:
    | "game_level"
    | "lesson"
    | "activity"
    | "curriculum"
    | "worksheet";
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

/**
 * BR-CRQ-08 & D-KK: Identify items belonging to incomplete curriculum weeks (< 3 items).
 */
async function getIncompleteCurriculumItems(
  db: ReturnType<typeof getOwnerDb>
): Promise<Set<string>> {
  const itemKeys = new Set<string>();

  // Find all weeks with < 3 items in draft or in_review curricula
  const weekCounts = await db
    .select({
      curriculumId: curriculumItems.curriculumId,
      weekNo: curriculumItems.weekNo,
      count: sql<number>`count(*)::int`,
    })
    .from(curriculumItems)
    .innerJoin(curricula, eq(curriculumItems.curriculumId, curricula.id))
    .where(sql`${curricula.status} IN ('draft', 'in_review')`)
    .groupBy(curriculumItems.curriculumId, curriculumItems.weekNo);

  const incompleteWeekTuples = weekCounts.filter((w) => w.count < 3);

  for (const iw of incompleteWeekTuples) {
    const itemsInWeek = await db
      .select({
        entityType: curriculumItems.entityType,
        entityId: curriculumItems.entityId,
      })
      .from(curriculumItems)
      .where(
        and(
          eq(curriculumItems.curriculumId, iw.curriculumId),
          eq(curriculumItems.weekNo, iw.weekNo)
        )
      );

    for (const it of itemsInWeek) {
      itemKeys.add(`${it.entityType}_${it.entityId}`);
    }
  }

  return itemKeys;
}

async function fetchGameLevelReviewQueue(
  db: ReturnType<typeof getOwnerDb>,
  options: {
    filterManagerId?: number;
    filterOrigin?: string;
    filterAuthoredIn?: string;
    limit: number;
  },
  publishedSkillIds: Set<number>,
  incompleteCurriculumItemKeys: Set<string>
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
    const isPartOfIncompleteWeek = incompleteCurriculumItemKeys.has(
      `game_level_${r.id}`
    );

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

    if (isPartOfIncompleteWeek) {
      // Tier 1: Curriculum week missing activities (D-KK)
      priorityTier = 1;
      priorityScore = 50;
    } else if (hasUncoveredSkill && attached.length > 0) {
      // Tier 2: Skill has 0 published levels
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
      title: r.title,
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
  },
  incompleteCurriculumItemKeys: Set<string>
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

  return rows.map((r) => {
    const isPartOfIncompleteWeek = incompleteCurriculumItemKeys.has(
      `lesson_${r.id}`
    );
    let priorityTier: 1 | 2 | 3 | 4 = 4;
    let priorityScore = 10;

    if (isPartOfIncompleteWeek) {
      priorityTier = 1;
      priorityScore = 50;
    } else if (r.contentVersion > 1) {
      priorityTier = 3;
      priorityScore = 30;
    }

    return {
      id: r.id,
      entity_type: "lesson",
      code: r.code,
      version: r.contentVersion,
      title: r.title,
      origin: r.origin,
      authored_in: r.authoredIn,
      created_by_manager_id: r.createdByManagerId,
      waiting_since: r.updatedAt.toISOString(),
      priority_score: priorityScore,
      priority_tier: priorityTier,
    };
  });
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
    title: r.title,
    origin: r.origin,
    authored_in: r.authoredIn,
    created_by_manager_id: r.createdByManagerId,
    waiting_since: r.updatedAt.toISOString(),
    priority_score: r.contentVersion > 1 ? 30 : 10,
    priority_tier: r.contentVersion > 1 ? 3 : 4,
  }));
}

async function fetchCurriculumReviewQueue(
  db: ReturnType<typeof getOwnerDb>,
  options: {
    filterManagerId?: number;
    filterOrigin?: string;
    filterAuthoredIn?: string;
    limit: number;
  }
): Promise<ReviewQueueItem[]> {
  const conditions: SQL<unknown>[] = [
    eq(curricula.status, "in_review"),
    eq(curricula.authoredIn, "studio"),
  ];

  if (options.filterManagerId) {
    conditions.push(eq(curricula.createdByManagerId, options.filterManagerId));
  }
  if (options.filterOrigin) {
    conditions.push(
      eq(
        curricula.origin,
        options.filterOrigin as typeof curricula.$inferSelect.origin
      )
    );
  }
  if (options.filterAuthoredIn) {
    conditions.push(
      eq(
        curricula.authoredIn,
        options.filterAuthoredIn as typeof curricula.$inferSelect.authoredIn
      )
    );
  }

  const rows = await db
    .select()
    .from(curricula)
    .where(and(...conditions))
    .orderBy(desc(curricula.createdAt))
    .limit(options.limit);

  return rows.map((r) => ({
    id: r.id,
    entity_type: "curriculum",
    code: r.code,
    version: r.contentVersion,
    title: r.title,
    origin: r.origin,
    authored_in: r.authoredIn,
    created_by_manager_id: r.createdByManagerId,
    waiting_since: r.updatedAt.toISOString(),
    priority_score: r.contentVersion > 1 ? 30 : 10,
    priority_tier: r.contentVersion > 1 ? 3 : 4,
  }));
}

export default defineEventHandler(async (event) => {
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
  const incompleteCurriculumItemKeys = await getIncompleteCurriculumItems(db);
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
      publishedSkillIds,
      incompleteCurriculumItemKeys
    );
    items.push(...levelItems);
  }

  if (!filterType || filterType === "lesson") {
    const lessonItems = await fetchLessonReviewQueue(
      db,
      {
        filterManagerId,
        filterOrigin,
        filterAuthoredIn,
        limit,
      },
      incompleteCurriculumItemKeys
    );
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

  if (!filterType || filterType === "curriculum") {
    const curriculumItemsList = await fetchCurriculumReviewQueue(db, {
      filterManagerId,
      filterOrigin,
      filterAuthoredIn,
      limit,
    });
    items.push(...curriculumItemsList);
  }

  // Sort by priority_score descending (Tier 1 (50) > Tier 2 (40) > Tier 3 (30) > Tier 4 (10))
  // For tie-breaks: oldest waiting_since first (BR-CRQ-08, D-KK)
  items.sort((a, b) => {
    if (b.priority_score !== a.priority_score) {
      return b.priority_score - a.priority_score;
    }
    return (
      new Date(a.waiting_since).getTime() - new Date(b.waiting_since).getTime()
    );
  });

  const sliced = items.slice(0, limit);
  const nextCursor = items.length > limit ? sliced.at(-1)?.id.toString() : null;

  return {
    items: sliced,
    next_cursor: nextCursor,
    total: items.length,
  };
});
